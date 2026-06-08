const { GroqService } = require('../ai/groqService');
const { safeParseJson } = require('../ai/parsers/jsonParser');
const { HumanMessage } = require('@langchain/core/messages');
const {
  logRequest, logResponse, logError, logTimeout, logTokenUsage, generateRequestId
} = require('../../logs/aiLogger');

// ─────────────────────────────────────────────────────────────────────────────
// PROMPT — yêu cầu AI kiểm tra tính đúng/sai của nội dung, không chỉ keyword
// ─────────────────────────────────────────────────────────────────────────────
const buildBatchPrompt = (questions) => {
  const questionsList = questions.map((q) => {
    if (q.type === 'mcq') {
      return `[ID:${q.id}][MCQ]
Question: ${q.question}
Options: ${(q.options || []).join(' | ')}
Correct answer: ${q.correctAnswer}
User answer: ${q.userAnswer || '(no answer)'}`;
    } else {
      return `[ID:${q.id}][ESSAY]
Question: ${q.question}
Expected concepts: ${(q.keywords || []).join(', ') || 'none'}
User answer: ${q.userAnswer || '(no answer)'}`;
    }
  }).join('\n\n');

  return `You are a strict but fair senior software engineer grading technical interview answers.

ESSAY RULES:
- STEP 1: Is the core claim technically correct? Wrong facts → score max 4, even with keywords.
- STEP 2: Score by depth:
  0-1: blank/gibberish  2-3: keywords but wrong logic  4-5: partially correct, vague
  6-7: correct and clear  8-9: good depth, trade-offs  10: perfect with examples
- strengths: 1-2 things the user got RIGHT (always required, even for score 9-10)
- weaknesses: 1-2 things MISSING or WRONG (always required — even score 9 is missing something for 10)
  Example score 9: strengths=["Correctly explained X","Mentioned Y"], weaknesses=["Missing concrete example","Could mention Z edge case"]
  Example score 3: strengths=["Mentioned keyword X"], weaknesses=["Explanation is factually wrong","Missing core concept"]

MCQ RULES:
- No score field. Write explanation max 45 words: one sentence why correct answer is right, one sentence why the most common wrong option is incorrect.

QUESTIONS:
${questionsList}

Return ONLY valid JSON, no markdown:
{"results":[{"id":0,"type":"mcq","explanation":"..."},{"id":1,"type":"essay","score":7,"strengths":["..."],"weaknesses":["..."],"modelAnswer":"ideal answer 3-5 sentences"}]}`.trim();
};

// ─────────────────────────────────────────────────────────────────────────────
// GỌI AI — với manual JSON extraction nếu safeParseJson fail
// ─────────────────────────────────────────────────────────────────────────────
async function callBatchAI(questions) {
  const modelName   = 'llama-3.1-8b-instant';
  const temperature = 0.0; // 0 = deterministic, ít hallucinate hơn
  const prompt      = buildBatchPrompt(questions);
  const messages    = [new HumanMessage(prompt)];
  const startTime   = Date.now();
  const requestId   = generateRequestId();

  logRequest(modelName, requestId, prompt, temperature);

  // max_tokens tính theo số câu để tránh truncate output
  const maxTokens   = Math.max(1000, questions.length * 250);
  const groqService = new GroqService(process.env.GROQ_API_KEY, modelName, temperature, maxTokens);
  const timeoutMs   = 60000;

  try {
    const raw = await Promise.race([
      groqService.invokeWithRetry(messages),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('BATCH_AI_TIMEOUT')), timeoutMs)
      )
    ]);
    const duration = Date.now() - startTime;
    logResponse(modelName, requestId, raw, duration);

    console.log('[grading] Raw AI (500 chars):', String(raw).slice(0, 500));

    if (typeof groqService.getLastUsage === 'function') {
      const usage = groqService.getLastUsage();
      if (usage) {
        const inp = usage.input_tokens  ?? usage.promptTokens     ?? usage.prompt_tokens     ?? 0;
        const out = usage.output_tokens ?? usage.completionTokens ?? usage.completion_tokens ?? 0;
        logTokenUsage(modelName, requestId, inp, out, usage.total_tokens ?? (inp + out), 'batchGrade');
      }
    }

    // Thử parse — dùng safeParseJson trước, fallback manual extract
    let parsed = await safeParseJson(raw);
    if (!parsed || !Array.isArray(parsed.results)) {
      console.warn('[grading] safeParseJson failed, trying manual extract...');
      parsed = extractJsonObject(String(raw));
    }

    if (parsed && Array.isArray(parsed.results)) {
      return parsed.results;
    }

    console.error('[grading] All parse attempts failed. Raw:', String(raw).slice(0, 800));
    return null;

  } catch (err) {
    const duration = Date.now() - startTime;
    if (err.message.includes('TIMEOUT')) logTimeout(modelName, requestId, timeoutMs);
    else logError(modelName, requestId, err, `Batch AI failed after ${duration}ms`);
    console.error('[grading] callBatchAI error:', err.message);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MANUAL JSON EXTRACTOR — lấy { } lớn nhất từ raw string, repair nếu truncated
// ─────────────────────────────────────────────────────────────────────────────
function extractJsonObject(raw) {
  try {
    // Bỏ markdown fences
    let s = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

    // Lấy từ { đầu tiên đến } cuối cùng
    const start = s.indexOf('{');
    const end   = s.lastIndexOf('}');
    if (start === -1 || end <= start) return null;

    return JSON.parse(s.slice(start, end + 1));
  } catch {
    // Repair: đóng string, array, object bị cắt
    try {
      let s = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const start = s.indexOf('{');
      if (start === -1) return null;
      let frag = s.slice(start);

      if ((frag.match(/"/g) || []).length % 2 !== 0) frag += '"';
      const missingBrackets = (frag.match(/\[/g)||[]).length - (frag.match(/\]/g)||[]).length;
      const missingBraces   = (frag.match(/\{/g)||[]).length - (frag.match(/\}/g)||[]).length;
      if (missingBrackets > 0) frag += ']'.repeat(missingBrackets);
      if (missingBraces   > 0) frag += '}'.repeat(missingBraces);

      return JSON.parse(frag);
    } catch (e2) {
      console.error('[grading] extractJsonObject repair failed:', e2.message);
      return null;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MCQ RESULT
// ─────────────────────────────────────────────────────────────────────────────
function buildMCQResult(q, userAnswer, aiExplanation) {
  const isCorrect = (userAnswer || '').trim().toLowerCase()
    === (q.correctAnswer || '').trim().toLowerCase();

  // Chỉ cần explanation thực sự giải thích — không phải "Explanation not available"
  const explanation = (aiExplanation && aiExplanation.length > 40)
    ? aiExplanation
    : (q.explanation && q.explanation.length > 40)
      ? q.explanation
      : `The correct answer is "${q.correctAnswer}". ${q.explanation || 'Review this concept to understand the reasoning.'}`;

  return {
    type:          'mcq',
    difficulty:    q.difficulty,
    question:      q.question,
    options:       q.options,
    yourAnswer:    userAnswer || '(no answer)',
    correctAnswer: q.correctAnswer,
    isCorrect,
    score:         isCorrect ? 10 : 0,
    explanation
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HEURISTIC — CHỈ dùng để phát hiện blank/quá ngắn
// KHÔNG dùng để tính điểm cao — tránh trường hợp câu sai có keyword được điểm cao
// ─────────────────────────────────────────────────────────────────────────────
function analyzeAnswer(userAnswer, keywords) {
  const lower        = (userAnswer || '').toLowerCase();
  const wordCount    = lower.split(/\s+/).filter(Boolean).length;
  const idealKws     = (keywords || []).map(k => k.toLowerCase());
  const matchedCount = idealKws.filter(kw => lower.includes(kw)).length;
  const keywordRatio = idealKws.length ? matchedCount / idealKws.length : 0;

  const hasExample     = /(example|e\.g\.|such as|for instance|ví dụ)/i.test(lower);
  const hasTech        = /(react|api|database|docker|jwt|cache|render|hook|async|promise|class|interface|object|function|component|state|props|ref|dom|virtual)/i.test(lower);
  const hasExplanation = /(because|since|therefore|however|but|whereas|helps|improves|reduces|avoids|prevents|enables|allows|để|giúp|tránh|vì|nên|do đó)/i.test(lower);

  // Phân loại rõ ràng thay vì cố tính điểm
  const isEmpty     = wordCount < 3 && matchedCount === 0;
  const isTooShort  = wordCount < 8;

  return {
    wordCount, matchedCount, keywordRatio,
    hasExample, hasTech, hasExplanation,
    isEmpty, isTooShort
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ESSAY RESULT
// Score logic: AI là primary judge, heuristic chỉ block điểm cao khi câu trống
// ─────────────────────────────────────────────────────────────────────────────
function buildEssayResult(q, userAnswer, aiData, analysis) {
  const keywords = q.idealAnswerKeywords || [];
  let finalScore;

  if (aiData && typeof aiData.score === 'number') {
    finalScore = aiData.score;

    // Nếu câu gần trống → AI không nên cho cao, cap lại
    if (analysis.isEmpty)    finalScore = Math.min(finalScore, 1);
    if (analysis.isTooShort && analysis.matchedCount === 0) finalScore = Math.min(finalScore, 2);

  } else {
    // AI fail hoàn toàn — fallback điểm thủ công, nhưng CÓ GIỚI HẠN
    // Không tính điểm cao khi không biết nội dung đúng hay sai
    if (analysis.isEmpty)         finalScore = 0;
    else if (analysis.isTooShort) finalScore = Math.min(3, analysis.matchedCount > 0 ? 3 : 1);
    else                          finalScore = Math.min(5, analysis.matchedCount > 0 ? 4 : 2);
    // Giới hạn 5/10 khi AI fail — vì không thể verify tính đúng sai
  }

  finalScore = Math.min(10, Math.max(0, Math.round(finalScore)));

  // Strengths: luôn hiển thị — user cần biết mình làm đúng gì, kể cả điểm 9
  const strengths = (aiData?.strengths || []).filter(s => s && s.trim().length > 5);

  // Weaknesses: luôn hiển thị — dù 9/10 vẫn cần biết thiếu gì để lên 10
  // Chỉ trả [] khi đạt 10 điểm hoàn hảo
  const weaknesses = finalScore === 10
    ? []
    : (aiData?.weaknesses || []).filter(w => w && w.trim().length > 5);

  // Model answer
  const modelAnswer = (aiData?.modelAnswer && aiData.modelAnswer.length > 20)
    ? aiData.modelAnswer
    : q.aiSuggestedAnswer
      || (keywords.length > 0
        ? `A strong answer should cover: ${keywords.join(', ')}.`
        : 'No model answer available.');

  return {
    type:       'essay',
    difficulty: q.difficulty,
    question:   q.question,
    yourAnswer: userAnswer,
    score:      finalScore,
    strengths,
    mistakes:   weaknesses,
    importantKeywords: keywords.filter(kw =>
      (userAnswer || '').toLowerCase().includes(kw.toLowerCase())
    ),
    aiSuggestedAnswer: modelAnswer,
    analysis: {
      wordCount:           analysis.wordCount,
      keywordMatchedCount: analysis.matchedCount,
      keywordRatio:        analysis.keywordRatio,
      hasExample:          analysis.hasExample,
      hasTechnicalTerms:   analysis.hasTech,
      hasExplanation:      analysis.hasExplanation
    }
  };
}

function createEmptyEssayResult(q) {
  return buildEssayResult(q, '', null, {
    wordCount: 0, matchedCount: 0, keywordRatio: 0,
    hasExample: false, hasTech: false, hasExplanation: false,
    isEmpty: true, isTooShort: true
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// FALLBACK: chấm không dùng AI (khi batch fail hoàn toàn)
// Điểm bị cap tối đa 5/10 vì không verify được tính đúng sai
// ─────────────────────────────────────────────────────────────────────────────
function gradeWithoutAI(mcq, text, answers) {
  const mcqResults = mcq.map((q, i) => {
    const userAnswer = (answers[`mcq_${i}`] || '').trim();
    return buildMCQResult(q, userAnswer, q.explanation || '');
  });

  const textResults = text.map((q, i) => {
    const userAnswer = (answers[`text_${i}`] || '').trim();
    if (!userAnswer) return createEmptyEssayResult(q);
    const analysis = analyzeAnswer(userAnswer, q.idealAnswerKeywords || []);
    return buildEssayResult(q, userAnswer, null, analysis);
  });

  return { mcqResults, textResults };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
async function gradeCVAnswersAdvanced(questions, answers) {
  const { mcq = [], text = [] } = questions;

  // Gom tất cả câu hỏi cho batch AI
  const allForAI = [
    ...mcq.map((q, idx) => ({
      id:            idx,
      type:          'mcq',
      original:      q,
      userAnswer:    (answers[`mcq_${idx}`] || '').trim(),
      question:      q.question,
      options:       q.options,
      correctAnswer: q.correctAnswer,
      keywords:      []
    })),
    ...text.map((q, idx) => ({
      id:          mcq.length + idx,
      type:        'essay',
      original:    q,
      userAnswer:  (answers[`text_${idx}`] || '').trim(),
      question:    q.question,
      keywords:    q.idealAnswerKeywords || []
    }))
  ];

  // Gọi AI một lần duy nhất
  const aiResults = await callBatchAI(allForAI);

  let mcqResults, textResults;

  if (aiResults && Array.isArray(aiResults) && aiResults.length > 0) {
    // Batch AI thành công
    const aiMap = new Map(aiResults.map(r => [r.id, r]));
    mcqResults  = [];
    textResults = [];

    for (const item of allForAI) {
      const aiData = aiMap.get(item.id) || null;
      if (item.type === 'mcq') {
        mcqResults.push(
          buildMCQResult(item.original, item.userAnswer, aiData?.explanation || '')
        );
      } else {
        if (!item.userAnswer) {
          textResults.push(createEmptyEssayResult(item.original));
        } else {
          const analysis = analyzeAnswer(item.userAnswer, item.keywords);
          textResults.push(
            buildEssayResult(item.original, item.userAnswer, aiData, analysis)
          );
        }
      }
    }
  } else {
    // Batch AI fail → fallback không dùng AI, điểm essay max 5/10
    console.warn('[grading] Batch AI failed, using no-AI fallback. Essay scores capped at 5.');
    ({ mcqResults, textResults } = gradeWithoutAI(mcq, text, answers));
  }

  // Tổng điểm
  const allResults    = [...mcqResults, ...textResults];
  const totalAchieved = allResults.reduce((s, r) => s + r.score, 0);
  const totalScore    = Math.round((totalAchieved / (allResults.length * 10)) * 100);
  const level =
    totalScore >= 85 ? 'Excellent'      :
    totalScore >= 70 ? 'Good'           :
    totalScore >= 50 ? 'Average'        : 'Needs Improvement';

  return {
    totalScore,
    level,
    mcq:  mcqResults,
    text: textResults,
    summary: {
      overall: `Candidate achieved ${totalScore}% - ${level}`,
      statistics: {
        totalQuestions: allResults.length,
        totalMcq:       mcqResults.length,
        totalEssay:     textResults.length
      }
    }
  };
}

module.exports = { gradeCVAnswersAdvanced };