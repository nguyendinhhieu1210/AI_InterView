// backend/src/services/grading/aiGrader.js
const { GroqService } = require('../ai/groqService');
const { safeParseJson } = require('../ai/parsers/jsonParser');
const { HumanMessage } = require('@langchain/core/messages');
const {
  logRequest, logResponse, logError, logTimeout, logTokenUsage, generateRequestId
} = require('../../logs/aiLogger');

// ─────────────────────────────────────────────────────────────────────────────
// PROMPT - YÊU CẦU GIẢI THÍCH CHI TIẾT VÀ MODEL ANSWER CỤ THỂ
// ─────────────────────────────────────────────────────────────────────────────
const buildBatchPrompt = (questions) => {
  const questionsList = questions.map((q) => {
    if (q.type === 'mcq') {
      return `[MCQ ${q.id}]
QUESTION: ${q.question}
OPTIONS: ${(q.options || []).join(' | ')}
CORRECT ANSWER: ${q.correctAnswer}
USER ANSWER: ${q.userAnswer || '(no answer)'}`;
    } else {
      const hasAnswer = !isBlankOrDontKnow(q.userAnswer);
      return `[ESSAY ${q.id}]
QUESTION: ${q.question}
USER ANSWER: ${hasAnswer ? q.userAnswer : '(NO ANSWER - user did not respond)'}
${!hasAnswer ? 'NOTE: User did not answer this question. Set score=0, weaknesses=[], strengths=[], provide a complete model answer.' : ''}`;
    }
  }).join('\n\n');

  return `You are a senior software engineer and university professor grading technical answers.

═══════════════════════════════════════════════════════════════════════════════
📋 GRADING RULES - APPLY TO EVERY QUESTION
═══════════════════════════════════════════════════════════════════════════════

STEP 1: CHECK IF ANSWER ADDRESSES THE QUESTION
- If answer is COMPLETELY OFF-TOPIC: Score 1-2, weaknesses = ["Does not answer the question"], strengths = []
- If answer is PARTIALLY RELEVANT: Score 3-4
- If answer DIRECTLY ADDRESSES the question: Score 5-10
- If NO ANSWER provided: Score 0, weaknesses = ["No answer provided"], strengths = []

STEP 2: FOR MCQ - WRITE A LEARNING EXPLANATION (40-70 words)

Explain the concept behind the correct answer.

Focus on:
- Why the concept is correct
- How it works
- When it is used

DO NOT say:
- "The correct answer is..."
- "Your answer is..."
- "You selected..."

Write the explanation as educational feedback for learning purposes.

STEP 3: FOR ESSAY - EVALUATE BASED ON QUESTION REQUIREMENTS

SCORE RUBRIC:
10 = Perfect - Covers ALL key concepts
8-9 = Excellent - Covers 85-95% of key concepts
6-7 = Good - Covers 65-85% of key concepts
5 = Satisfactory - Covers 50-65% of key concepts
3-4 = Below expectation - Covers <50% of key concepts
1-2 = Poor/Failing - Off-topic or extremely brief
0 = No answer provided

STEP 4: PROVIDE STRENGTHS AND WEAKNESSES FOR ESSAY

STRENGTHS (1-2 items, each at least 15 words):
✅ Good: "Correctly identified that useState triggers a re-render when state value changes"
✅ Good: "Accurately described the difference between controlled and uncontrolled inputs"
❌ Bad: "Good answer", "You understood the concept"

WEAKNESSES (1-2 items, each at least 15 words):
✅ Good: "Did not explain how the Virtual DOM diffing algorithm minimizes real DOM updates"
✅ Good: "Missing comparison of JWT vs session-based auth trade-offs"
❌ Bad: "Needs more detail", "Answer is incomplete"

MODEL ANSWER (4-6 sentences, 120-170 words):
The model answer MUST directly answer the question and cover ALL key technical concepts.

═══════════════════════════════════════════════════════════════════════════════
QUESTIONS TO GRADE
═══════════════════════════════════════════════════════════════════════════════

${questionsList}

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON ONLY)
═══════════════════════════════════════════════════════════════════════════════

{
  "results": [
    {"id": 0, "type": "mcq", "explanation": "Educational explanation about the concept..."},
    {"id": 1, "type": "essay", "score": 8, "strengths": ["Good point 1"], "weaknesses": ["Missing point 1"], "modelAnswer": "Complete 4-6 sentence exemplary answer..."}
  ]
}`.trim();
};

// ─────────────────────────────────────────────────────────────────────────────
// CALL AI WITH 70B MODEL
// ─────────────────────────────────────────────────────────────────────────────
async function callBatchAI(questions) {
  const modelName = 'llama-3.3-70b-versatile';
  const temperature = 0.1;
  const prompt = buildBatchPrompt(questions);
  const messages = [new HumanMessage(prompt)];
  const startTime = Date.now();
  const requestId = generateRequestId();

  logRequest(modelName, requestId, prompt, temperature);

  const maxTokens = Math.min(4000, 1000 + questions.length * 350);
  const groqService = new GroqService(process.env.GROQ_API_KEY, modelName, temperature, maxTokens);
  const timeoutMs = 90000;

  try {
    const raw = await Promise.race([
      groqService.invokeWithRetry(messages),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('BATCH_AI_TIMEOUT')), timeoutMs)
      )
    ]);
    const duration = Date.now() - startTime;
    logResponse(modelName, requestId, raw, duration);

    console.log('[grading] Raw AI response (first 500 chars):', String(raw).slice(0, 500));

    if (typeof groqService.getLastUsage === 'function') {
      const usage = groqService.getLastUsage();
      if (usage) {
        const inp = usage.input_tokens ?? usage.promptTokens ?? usage.prompt_tokens ?? 0;
        const out = usage.output_tokens ?? usage.completionTokens ?? usage.completion_tokens ?? 0;
        logTokenUsage(modelName, requestId, inp, out, usage.total_tokens ?? (inp + out), 'batchGrade');
        console.log(`[grading] Token - Input: ${inp}, Output: ${out}`);
      }
    }

    let parsed = await safeParseJson(raw);
    if (!parsed || !Array.isArray(parsed.results)) {
      console.warn('[grading] safeParseJson failed, attempting manual extraction...');
      parsed = extractJsonObject(String(raw));
    }

    if (parsed && Array.isArray(parsed.results)) {
      console.log(`[grading] Successfully parsed ${parsed.results.length} results`);
      return parsed;
    }

    console.error('[grading] All parse attempts failed.');
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
// EXTRACT JSON
// ─────────────────────────────────────────────────────────────────────────────
function extractJsonObject(raw) {
  try {
    let s = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const start = s.indexOf('{');
    const end = s.lastIndexOf('}');
    if (start === -1 || end <= start) return null;
    return JSON.parse(s.slice(start, end + 1));
  } catch (e) {
    try {
      let s = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const start = s.indexOf('{');
      if (start === -1) return null;
      let frag = s.slice(start);
      if ((frag.match(/"/g) || []).length % 2 !== 0) frag += '"';
      const missingBrackets = (frag.match(/\[/g) || []).length - (frag.match(/\]/g) || []).length;
      const missingBraces = (frag.match(/\{/g) || []).length - (frag.match(/\}/g) || []).length;
      if (missingBrackets > 0) frag += ']'.repeat(missingBrackets);
      if (missingBraces > 0) frag += '}'.repeat(missingBraces);
      return JSON.parse(frag);
    } catch (e2) {
      console.error('[grading] JSON extraction failed:', e2.message);
      return null;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MCQ RESULT - KHÔNG THAY ĐỔI
// ─────────────────────────────────────────────────────────────────────────────
function buildMCQResult(q, userAnswer, aiExplanation) {
  const isCorrect = (userAnswer || '').trim().toLowerCase() === (q.correctAnswer || '').trim().toLowerCase();

  let explanation = aiExplanation || q.explanation || '';

  if (!explanation || explanation.length < 40 || explanation.includes('complete answer to')) {
    explanation = `The correct answer is "${q.correctAnswer}". ${generateDetailedMCQExplanation(q.question, q.correctAnswer, q.options, userAnswer)}`;
  }

  return {
    type: 'mcq',
    difficulty: q.difficulty,
    question: q.question,
    options: q.options,
    yourAnswer: userAnswer || '(no answer)',
    correctAnswer: q.correctAnswer,
    isCorrect,
    score: isCorrect ? 10 : 0,
    explanation: explanation
  };
}

function generateDetailedMCQExplanation(question, correctAnswer, options, userAnswer) {
  const explanations = {
    'What is the primary function of React.js?':
      `React.js is a frontend library for building user interfaces. ` +
      `"${userAnswer}" is incorrect because ${userAnswer === 'Backend framework' ? 'React runs in the browser, not on the server' :
        userAnswer === 'Database management' ? 'React has nothing to do with databases' :
          userAnswer === 'API design' ? 'API design is handled by backend frameworks' :
            'that describes a different aspect of web development'}.`,
    'How do you handle state changes in React?':
      `In class components, setState() updates component state. In functional components, useState hook serves the same purpose. ` +
      `"${userAnswer}" is ${userAnswer === 'Using hooks' ? 'partially correct for functional components, but the classic React way is setState()' :
        userAnswer === 'Using props' ? 'props are read-only and cannot change component state' :
          userAnswer === 'Using context' ? 'context is for sharing data, not for state changes' :
            'not the standard React method for state updates'}.`,
    'What is Express.js used for?':
      `Express.js is a backend web application framework for Node.js providing routing, middleware, and HTTP utilities. ` +
      `"${userAnswer}" is ${userAnswer === 'Backend development' ? 'correct!' : 'incorrect because Express runs on Node.js servers'}.`,
    'How do you handle routing in Express.js?':
      `Express.js provides a built-in Router class for modular route handlers. Define routes using app.get(), app.post(), or express.Router(). ` +
      `"${userAnswer}" is ${userAnswer === 'Using Express Router' ? 'correct' :
        userAnswer === 'Using React Router' ? 'React Router is for client-side routing' :
          'not the Express.js native routing method'}.`,
    'What is the difference between a controlled and uncontrolled component in React?':
      `Controlled components have value controlled by React state via onChange handlers. Uncontrolled components store value in DOM and use refs. ` +
      `"${userAnswer}" is ${userAnswer === 'Controlled components use state, uncontrolled use refs' ? 'correct' :
        'incorrect'}.`,
    'What is the purpose of the useEffect hook in React?':
      `useEffect performs side effects in function components: data fetching, subscriptions, timers, DOM changes. Runs after component renders. ` +
      `"${userAnswer}" is ${userAnswer === 'For handling side effects' ? 'correct!' : 'incorrect'}.`,
    'How do you authenticate users in an Express.js application?':
      `Express.js supports Passport.js (strategy-based), JWT (stateless tokens), and sessions (stateful with cookies). ` +
      `"${userAnswer}" is ${userAnswer === 'Using all of the above' ? 'correct' : 'only one of several valid methods'}.`
  };

  return explanations[question] ||
    `The correct answer is "${correctAnswer}". ${userAnswer !== correctAnswer ?
      `Your answer "${userAnswer}" is incorrect. ` : ''}
    This question tests understanding of ${question.split('?')[0].toLowerCase()}.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// DETECT EMPTY ANSWERS
// ─────────────────────────────────────────────────────────────────────────────
function isBlankOrDontKnow(answer) {
  if (!answer || answer.trim().length === 0) return true;
  const lower = answer.trim().toLowerCase();
  const emptyPhrases = ['không biết', 'i don\'t know', 'no idea', 'not sure', 'n/a', 'none'];
  return emptyPhrases.some(phrase => lower.includes(phrase));
}

// ─────────────────────────────────────────────────────────────────────────────
// FALLBACK MODEL ANSWER
// ─────────────────────────────────────────────────────────────────────────────
function getFallbackModelAnswer(question) {
  const lowerQ = question.toLowerCase();

  if (lowerQ.includes('component') && lowerQ.includes('react')) {
    return 'A React component is a JavaScript function or class that returns JSX to describe a portion of the user interface. Components accept inputs called "props" and can maintain internal state using the useState hook. They can be composed together - a page component might contain Header, Main, and Footer components. This modularity promotes code reuse and maintainability, as each component is isolated and can be tested independently. Components re-render when their state or props change, making the UI reactive to user interactions.';
  }

  if (lowerQ.includes('authentication') && lowerQ.includes('express') && lowerQ.includes('passport')) {
    return 'To implement authentication with Passport.js in Express.js: (1) Install passport, passport-local, and express-session. (2) Configure Passport with a LocalStrategy that verifies username/password against your database using bcrypt. (3) Serialize user to store user ID in session, and deserialize to retrieve user from database on each request. (4) Initialize Passport with app.use(passport.initialize()) and app.use(passport.session()). (5) Create a login route that uses passport.authenticate("local") to validate credentials. (6) Protect routes by checking req.isAuthenticated() before granting access.';
  }

  if (lowerQ.includes('controlled') && lowerQ.includes('uncontrolled') && lowerQ.includes('react')) {
    return 'Controlled components have form input values controlled by React state: value={value} onChange={setValue}. This gives React full control over the input, enabling real-time validation and conditional disabling. Uncontrolled components store values in the DOM and use refs (useRef) to read values when needed. Trade-offs: Controlled components offer better control but cause re-renders on every keystroke. Uncontrolled components are simpler and perform better for large forms but lack real-time validation.';
  }

  return `This question requires a thorough technical explanation. Key points to cover: (1) Define the core concept. (2) Explain how it works with an example. (3) Describe common use cases. (4) Mention important caveats or best practices.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// ESSAY RESULT - GIỮ LẠI STRENGTHS VÀ WEAKNESSES
// ─────────────────────────────────────────────────────────────────────────────
function buildEssayResult(q, userAnswer, aiData) {
  const isNoAnswer = isBlankOrDontKnow(userAnswer);

  // Khi user không trả lời
  if (isNoAnswer) {
    const modelAnswer = aiData?.modelAnswer?.trim() || getFallbackModelAnswer(q.question);

    return {
      type: 'essay',
      difficulty: q.difficulty,
      question: q.question,
      yourAnswer: '(Không có câu trả lời)',
      score: 0,
      strengths: [],
      mistakes: [
        `Không trả lời câu hỏi về "${q.question.slice(0, 60)}..."`,
        'Chưa thể hiện bất kỳ kiến thức nào liên quan đến chủ đề này'
      ],
      aiSuggestedAnswer: modelAnswer,
      detailedFeedback: `❌ Bạn chưa trả lời câu hỏi này. Dưới đây là câu trả lời mẫu từ AI để bạn tham khảo.`
    };
  }

  let finalScore = 5;
  let strengths = [];
  let weaknesses = [];
  let modelAnswer = '';

  if (aiData && typeof aiData.score === 'number') {
    finalScore = aiData.score;

    // Lấy strengths từ AI response
    strengths = (aiData.strengths || [])
      .map(s => s?.trim())
      .filter(s => s && s.length >= 15)
      .filter(s => !['good answer', 'you understood', 'nice work', 'well done'].some(g => s.toLowerCase().includes(g)))
      .slice(0, 2);

    // Lấy weaknesses từ AI response
    weaknesses = (aiData.weaknesses || [])
      .map(w => w?.trim())
      .filter(w => w && w.length >= 15)
      .filter(w => !['needs more detail', 'answer is incomplete', 'study more', 'more explanation'].some(g => w.toLowerCase().includes(g)))
      .slice(0, 2);

    if (weaknesses.length === 0 && finalScore < 8) {
      weaknesses = [`Câu trả lời chưa đủ chiều sâu để bao phủ hết các khía cạnh kỹ thuật của câu hỏi`];
    }

    if (strengths.length === 0 && finalScore >= 7) {
      strengths = [`Câu trả lời đã đề cập đúng các khái niệm cơ bản liên quan đến câu hỏi`];
    }

    modelAnswer = (aiData.modelAnswer || '').trim();

    if (!modelAnswer || modelAnswer.length < 60 || modelAnswer.toLowerCase().startsWith('a complete answer to')) {
      modelAnswer = getFallbackModelAnswer(q.question);
      console.log(`[grading] Using fallback model answer for: ${q.question.slice(0, 50)}`);
    }
  } else {
    // Fallback khi không có AI response
    finalScore = userAnswer.length > 100 ? 6 : userAnswer.length > 50 ? 5 : 4;
    strengths = userAnswer.length > 80 ? ['Có đưa ra câu trả lời liên quan đến câu hỏi được hỏi'] : [];
    weaknesses = ['Câu trả lời chưa đề cập đến các khái niệm kỹ thuật cụ thể hoặc ví dụ thực tế'];
    modelAnswer = getFallbackModelAnswer(q.question);
  }

  finalScore = Math.min(10, Math.max(1, Math.round(finalScore)));

  // detailedFeedback rõ ràng
  let detailedFeedback = '';
  const strengthText = strengths.length > 0 ? `\n✅ Điểm mạnh: ${strengths.join(' | ')}` : '';
  const weaknessText = weaknesses.length > 0 ? `\n⚠️ Cần cải thiện: ${weaknesses.join(' | ')}` : '';

  if (finalScore >= 9) {
    detailedFeedback = `🌟 Xuất sắc! Câu trả lời gần như hoàn hảo.${strengthText}${weaknessText}`;
  } else if (finalScore >= 7) {
    detailedFeedback = `👍 Tốt! Bạn nắm vững phần lớn kiến thức cần thiết.${strengthText}${weaknessText}`;
  } else if (finalScore >= 5) {
    detailedFeedback = `📚 Đạt yêu cầu. Cần bổ sung thêm để đạt điểm cao hơn.${strengthText}${weaknessText}`;
  } else if (finalScore >= 3) {
    detailedFeedback = `⚠️ Chưa đạt. Câu trả lời còn thiếu nhiều điểm quan trọng.${strengthText}${weaknessText}`;
  } else {
    detailedFeedback = `❌ Câu trả lời chưa giải quyết đúng câu hỏi hoặc quá sơ sài.${strengthText}${weaknessText}`;
  }

  return {
    type: 'essay',
    difficulty: q.difficulty,
    question: q.question,
    yourAnswer: userAnswer,
    score: finalScore,
    strengths: strengths,
    mistakes: weaknesses,
    aiSuggestedAnswer: modelAnswer,
    detailedFeedback
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// BUILD SUMMARY - GIỮ LẠI STRENGTHS TỪ ESSAY
// ─────────────────────────────────────────────────────────────────────────────
function buildLocalSummary(totalScore, textResults, mcqResults) {
  const allStrengths = [];
  const allWeaknesses = [];

  for (let i = 0; i < textResults.length; i++) {
    const r = textResults[i];
    if (r.strengths && r.strengths.length > 0) {
      allStrengths.push(...r.strengths);
    }
    if (r.mistakes && r.mistakes.length > 0) {
      allWeaknesses.push(...r.mistakes);
    }
  }

  const correctMcqCount = mcqResults.filter(r => r.isCorrect).length;
  const totalMcq = mcqResults.length;

  if (correctMcqCount === totalMcq && totalMcq > 0) {
    allStrengths.push(`Perfect score on all ${totalMcq} multiple choice questions`);
  } else if (correctMcqCount >= totalMcq * 0.7 && totalMcq > 0) {
    allStrengths.push(`Good performance on MCQs: ${correctMcqCount}/${totalMcq} correct`);
  } else if (correctMcqCount <= totalMcq * 0.4 && totalMcq > 0) {
    allWeaknesses.push(`Low MCQ score: only ${correctMcqCount}/${totalMcq} correct. Review fundamental concepts.`);
  }

  const uniqueStrengths = [...new Set(allStrengths)].slice(0, 4);
  const uniqueWeaknesses = [...new Set(allWeaknesses)].slice(0, 4);

  let overallStrengths = '';
  let overallWeaknesses = '';
  let overallRecommendations = '';

  if (totalScore >= 85) {
    overallStrengths = `✨ Outstanding! Total score: ${totalScore}%. ${uniqueStrengths.join('. ')}`;
    overallRecommendations = 'You have excellent understanding. Review any incorrect answers to ensure complete mastery.';
  } else if (totalScore >= 70) {
    overallStrengths = `👍 Good work! Total score: ${totalScore}%. ${uniqueStrengths.join('. ')}`;
    overallWeaknesses = `⚠️ Areas to improve: ${uniqueWeaknesses.join('. ')}`;
    overallRecommendations = 'Review the sample answers for questions you missed. Focus on adding specific technical details to your essay responses.';
  } else if (totalScore >= 50) {
    overallStrengths = `📚 Total score: ${totalScore}%. ${uniqueStrengths.length > 0 ? uniqueStrengths.join('. ') : 'You attempted all questions.'}`;
    overallWeaknesses = `❌ Focus areas: ${uniqueWeaknesses.join('. ')}`;
    overallRecommendations = 'Study the sample answers carefully. Pay attention to what each question is asking.';
  } else {
    overallStrengths = `📖 Total score: ${totalScore}%. Keep practicing!`;
    overallWeaknesses = `❌ Critical improvements needed: ${uniqueWeaknesses.join('. ')}`;
    overallRecommendations = 'Start with the fundamentals. Read each question carefully. Study all sample answers thoroughly.';
  }

  return {
    overall: `Candidate achieved ${totalScore}% overall.`,
    overallStrengths,
    overallWeaknesses,
    overallRecommendations
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN FUNCTION
// ─────────────────────────────────────────────────────────────────────────────
async function gradeCVAnswersAdvanced(questions, answers) {
  const { mcq = [], text = [] } = questions;

  const allForAI = [
    ...mcq.map((q, idx) => ({
      id: idx,
      type: 'mcq',
      original: q,
      userAnswer: (answers[`mcq_${idx}`] || '').trim(),
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
    })),
    ...text.map((q, idx) => ({
      id: mcq.length + idx,
      type: 'essay',
      original: q,
      userAnswer: (answers[`text_${idx}`] || '').trim(),
      question: q.question,
    }))
  ];

  console.log(`[grading] Processing ${allForAI.length} questions with Groq 70B...`);

  const aiResponse = await callBatchAI(allForAI);
  let mcqResults, textResults;

  if (aiResponse && Array.isArray(aiResponse.results) && aiResponse.results.length > 0) {
    console.log(`[grading] AI returned ${aiResponse.results.length} results`);
    const aiMap = new Map(aiResponse.results.map(r => [r.id, r]));
    mcqResults = [];
    textResults = [];

    for (const item of allForAI) {
      const aiData = aiMap.get(item.id) || null;
      if (item.type === 'mcq') {
        mcqResults.push(buildMCQResult(item.original, item.userAnswer, aiData?.explanation || ''));
      } else {
        textResults.push(buildEssayResult(item.original, item.userAnswer, aiData));
      }
    }
  } else {
    console.warn('[grading] AI response failed, using fallback.');
    mcqResults = mcq.map((q, i) => buildMCQResult(q, answers[`mcq_${i}`] || '', ''));
    textResults = text.map((q, i) => {
      const userAnswer = answers[`text_${i}`] || '';
      return buildEssayResult(q, userAnswer, null);
    });
  }

  const allResults = [...mcqResults, ...textResults];
  const totalAchieved = allResults.reduce((s, r) => s + r.score, 0);
  const totalScore = Math.round((totalAchieved / (allResults.length * 10)) * 100);
  const level = totalScore >= 85 ? 'Excellent' : totalScore >= 70 ? 'Good' : totalScore >= 50 ? 'Average' : 'Needs Improvement';

  const summaryContent = buildLocalSummary(totalScore, textResults, mcqResults);

  return {
    totalScore,
    level,
    mcq: mcqResults,
    text: textResults,
    summary: {
      overall: summaryContent.overall,
      overallStrengths: summaryContent.overallStrengths,
      overallWeaknesses: summaryContent.overallWeaknesses,
      overallRecommendations: summaryContent.overallRecommendations
    }
  };
}

module.exports = { gradeCVAnswersAdvanced };