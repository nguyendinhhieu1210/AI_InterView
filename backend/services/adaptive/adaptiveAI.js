// services/adaptiveAI.js
const { GroqService } = require("../ai/groqService");
const {
  logTokenUsage,
  generateRequestId,
  logError,
} = require("../../utils/aiLogger");
const {
  DIFFICULTY_RULES,
  TOTAL_QUESTIONS,
  needsCodeExample,
  detectMissingConcepts,
  analyzeAnswerQuality,
} = require("./adaptiveCore");

// Khởi tạo GroqService
const groqService = new GroqService(
  process.env.GROQ_API_KEY,
  "llama-3.3-70b-versatile",
  0.1,
);

// Helper gọi AI và log token
async function callAI(messages, feature = "general") {
  const requestId = generateRequestId();
  const start = Date.now();
  try {
    const content = await groqService.invokeWithRetry(messages);
    const duration = Date.now() - start;
    let usage = groqService.getLastUsage();
    let inputTokens = 0,
      outputTokens = 0,
      totalTokens = 0;

    if (usage && (usage.input_tokens || usage.prompt_tokens)) {
      inputTokens = usage.input_tokens || usage.prompt_tokens || 0;
      outputTokens = usage.output_tokens || usage.completion_tokens || 0;
      totalTokens = usage.total_tokens || inputTokens + outputTokens;
    } else {
      const inputText = JSON.stringify(messages);
      const outputText = content;
      inputTokens = Math.ceil(inputText.length / 4);
      outputTokens = Math.ceil(outputText.length / 4);
      totalTokens = inputTokens + outputTokens;
    }

    logTokenUsage(
      "llama-3.3-70b-versatile",
      requestId,
      inputTokens,
      outputTokens,
      totalTokens,
      feature,
    );
    return content;
  } catch (err) {
    logError("llama-3.3-70b-versatile", requestId, err, feature);
    throw err;
  }
}

// Phase 1: Chấm điểm batch + sinh ideal answer trong cùng 1 call
async function scoreQAPairs(qaPairs, topic, difficulty) {
  const systemPrompt = buildSystemPrompt(difficulty);
  const BATCH_SIZE = 4;
  const allScored = [];

  for (let i = 0; i < qaPairs.length; i += BATCH_SIZE) {
    const batch = qaPairs.slice(i, i + BATCH_SIZE);
    const qaText = batch
      .map((qa) => {
        const qualityNote = qa.answerQuality.tooShort
          ? " [Very short answer]"
          : qa.answerQuality.medium
            ? " [Brief answer]"
            : "";
        const missingHint = qa.ruleMissingConcepts.length
          ? ` [May be missing: ${qa.ruleMissingConcepts.join(", ")}]`
          : "";
        const codeNote = needsCodeExample(qa.subtopic, qa.questionType)
          ? " [Include a short code example, max 4 lines, in idealAnswerCode]"
          : "";
        return `Q${qa.questionNumber} [${qa.subtopic}, type=${qa.questionType}]: ${qa.question}\nAnswer: ${qa.answer}${qualityNote}${missingHint}${codeNote}`;
      })
      .join("\n\n");

    const userPrompt = `Topic: ${topic} | Difficulty: ${difficulty}

${qaText}

Return a JSON array (${batch.length} items):
[
  {
    "questionNumber": <number>,
    "score": <0-10 integer>,
    "verdict": "Excellent|Good|Adequate|Poor|Missing",
    "correctConcepts": ["..."],
    "missingConcepts": ["..."],
    "feedback": "2-3 sentences: what was good, what was missing, why score given",
   "idealAnswer": "<140-180 words, 4-6 sentences, clear and beginner-friendly explanation. Directly answer the question, explain the core concept, why it matters, how it works, and provide one practical example when relevant. Use natural language instead of textbook definitions.>"
    "idealAnswerCode": "<short code snippet max 4 lines, or null>",
    "idealAnswerCodeLanguage": "<javascript|python|java|etc, or null>"
  }
]
Rules:
- feedback must mention exact missing concepts
- Short/vague answers max 3-5
- idealAnswer must directly answer the specific interview question
- Write as if explaining the answer to a junior developer during a technical interview
- Use simple and natural language
- Avoid unnecessary jargon and textbook-style definitions
- Make the explanation easy for someone learning the topic for the first time
- idealAnswer must be between 140-180 words
- Return ONLY the JSON array`;

    let batchResult = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await callAI(
          [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          "score_qa",
        );
        const text = response
          .replace(/```json\s*/gi, "")
          .replace(/```\s*/gi, "")
          .trim();
        const arrStart = text.indexOf("[");
        const arrEnd = text.lastIndexOf("]");
        if (arrStart === -1 || arrEnd === -1)
          throw new Error("No JSON array found");
        batchResult = JSON.parse(text.slice(arrStart, arrEnd + 1));
        break;
      } catch (err) {
        console.warn(
          `[scoreQAPairs] Batch ${Math.floor(i / BATCH_SIZE) + 1}, attempt ${attempt + 1} failed: ${err.message}`,
        );
      }
    }

    if (batchResult && Array.isArray(batchResult)) {
      allScored.push(...batchResult);
    } else {
      for (const qa of batch) {
        const fallbacks = {
          easy: `${qa.subtopic} is a core concept in ${topic}. A correct definition with a simple example suffices.`,
          medium: `${qa.subtopic} works by [explain mechanism]. For example, [practical use]. One common mistake to avoid is [pitfall].`,
          hard: `${qa.subtopic} internally [internals]. Tradeoffs include [pro/con]. Edge case: [example].`,
        };
        allScored.push({
          questionNumber: qa.questionNumber,
          score: 3,
          verdict: "Poor",
          correctConcepts: [],
          missingConcepts: qa.ruleMissingConcepts || [],
          feedback: "Could not evaluate automatically. Please review manually.",
          idealAnswer: fallbacks[difficulty] || fallbacks.medium,
          idealAnswerCode: null,
          idealAnswerCodeLanguage: null,
        });
      }
    }
  }
  return allScored;
}

// Helper: build system prompt
function buildSystemPrompt(difficulty) {
  const diffConfig = DIFFICULTY_RULES[difficulty] || DIFFICULTY_RULES.medium;
  return `You are a senior software engineer conducting technical interviews.
Evaluate candidate answers fairly but rigorously. Return ONLY valid JSON — no markdown, no backticks, no text outside JSON.

SCORING GUIDE:
- 0-2: Wrong or completely off-topic
- 3-4: Very basic, missing core concepts
- 5-6: Understands the basics, lacks depth
- 7-8: Good practical understanding, minor gaps
- 9-10: Expert-level, covers all aspects

${diffConfig.scoreNote}

IMPORTANT:
- Penalize vague or one-line answers
- Detect missing key concepts
- Prefer technical accuracy over politeness`;
}

// Sinh câu hỏi đầu tiên
async function generateFirstQuestion(topic, difficulty, firstSubtopic) {
  const safeSub = firstSubtopic || topic;
  const diffConfig = DIFFICULTY_RULES[difficulty] || DIFFICULTY_RULES.medium;
  const prompt = `You are a senior technical interviewer starting an interview.

${diffConfig.description}

Ask ONE opening question about "${safeSub}" in ${topic}.
- Start with this subtopic's fundamentals at the given difficulty level
- 1-2 sentences max (under 40 words)
- No preamble, no numbering, no markdown`;
  const response = await callAI(
    [{ role: "user", content: prompt }],
    "first_question",
  );
  const question = (response || "").trim();
  const { isValidAiQuestion, getFallbackQuestion } = require("./adaptiveCore");
  return isValidAiQuestion(question)
    ? question
    : getFallbackQuestion(safeSub, "conceptual", topic, difficulty);
}

// Sinh câu hỏi tiếp theo
async function generateNextQuestion(session, lastScore = null) {
  const {
    getRoadmapForTopic,
    getNextQuestionType,
    getAdaptiveDifficulty,
    getFallbackQuestion,
    isValidAiQuestion,
    isQuestionTooSimilar,
    normalizeQuestion,
  } = require("./adaptiveCore");
  const roadmapFlat =
    session.roadmapFlattened || getRoadmapForTopic(session.topic).flattened;
  const baseDifficulty = session.difficulty || "medium";
  const adaptiveDifficulty = getAdaptiveDifficulty(baseDifficulty, lastScore);
  const diffConfig =
    DIFFICULTY_RULES[adaptiveDifficulty] || DIFFICULTY_RULES.medium;

  const questionType = getNextQuestionType(
    adaptiveDifficulty,
    session.questionTypeHistory || [],
  );
  const recentAsked = (session.askedQuestions || []).slice(-3).join("\n");

  let targetSubtopic = session.currentSubtopic;
  const remaining = roadmapFlat.filter(
    (r) => !(session.coveredTopics || []).includes(r),
  );
  if (remaining.length > 0) {
    targetSubtopic = remaining[Math.floor(Math.random() * remaining.length)];
    session.currentSubtopic = targetSubtopic;
    session.coveredTopics.push(targetSubtopic);
  } else {
    const resetRemaining = roadmapFlat.filter(
      (r) => r !== session.currentSubtopic,
    );
    const pool = resetRemaining.length > 0 ? resetRemaining : roadmapFlat;
    targetSubtopic = pool[Math.floor(Math.random() * pool.length)];
    session.currentSubtopic = targetSubtopic;
    session.coveredTopics = [targetSubtopic];
  }

  const safeSub = targetSubtopic || session.topic;
  const adaptiveNote =
    adaptiveDifficulty !== baseDifficulty
      ? `\nNOTE: Difficulty adjusted to "${adaptiveDifficulty}" based on candidate's last answer performance.`
      : "";

  const prompt = `You are a senior technical interviewer.

${diffConfig.description}${adaptiveNote}

Ask ONE ${questionType} question about "${safeSub}" in ${session.topic}.
- 1-2 sentences max (under 40 words)
- No preamble, no numbering, no markdown
- Do NOT repeat these recent questions:
${recentAsked || "(none)"}`;

  const response = await callAI(
    [{ role: "user", content: prompt }],
    "next_question",
  );
  let question = (response || "").trim();
  if (
    !isValidAiQuestion(question) ||
    isQuestionTooSimilar(question, session.askedQuestions)
  ) {
    question = getFallbackQuestion(
      safeSub,
      questionType,
      session.topic,
      adaptiveDifficulty,
    );
  }

  session.questionTypeHistory = [
    ...(session.questionTypeHistory || []),
    questionType,
  ];
  session.askedQuestions = [
    ...(session.askedQuestions || []),
    normalizeQuestion(question),
  ];

  return { question, subtopic: safeSub, questionType, adaptiveDifficulty };
}

// Generate final report
async function generateFinalReport(session) {
  const {
    detectMissingConcepts,
    analyzeAnswerQuality,
    buildTopicBreakdown,
  } = require("./adaptiveCore");
  const messages = session.conversation;
  const qaPairs = [];
  for (let i = 0; i < messages.length - 1; i++) {
    const msg = messages[i];
    const next = messages[i + 1];
    if (
      msg.role === "assistant" &&
      msg.type === "question" &&
      next.role === "user" &&
      next.type === "answer"
    ) {
      qaPairs.push({
        questionNumber: qaPairs.length + 1,
        subtopic: msg.subtopic || session.topic,
        question: msg.content,
        answer: next.content,
        questionType: msg.questionType || "conceptual",
        ruleMissingConcepts: detectMissingConcepts(msg.subtopic, next.content),
        answerQuality: analyzeAnswerQuality(next.content),
      });
    }
  }

  const scoredItems = await scoreQAPairs(
    qaPairs,
    session.topic,
    session.difficulty,
  );

  const questionBreakdown = qaPairs.map((qa) => {
    const scored = scoredItems.find(
      (s) => s.questionNumber === qa.questionNumber,
    ) || {
      score: 3,
      verdict: "Poor",
      correctConcepts: [],
      missingConcepts: qa.ruleMissingConcepts,
      feedback: "Could not evaluate automatically.",
      idealAnswer: "",
      idealAnswerCode: null,
      idealAnswerCodeLanguage: null,
    };
    const mergedMissing = [
      ...new Set([
        ...(scored.missingConcepts || []),
        ...qa.ruleMissingConcepts,
      ]),
    ];
    let finalScore = scored.score;
    let feedback = scored.feedback || "";
    if (qa.answerQuality.tooShort && finalScore > 4) {
      finalScore = Math.max(1, finalScore - 2);
      feedback = `[Answer too brief - score reduced] ${feedback}`;
    } else if (qa.answerQuality.medium && finalScore > 6) {
      finalScore = Math.max(2, finalScore - 1);
      feedback = `[Answer lacks detail - score reduced] ${feedback}`;
    }
    return {
      questionNumber: qa.questionNumber,
      subtopic: qa.subtopic,
      question: qa.question,
      score: finalScore,
      verdict: scored.verdict || "Adequate",
      correctConcepts: scored.correctConcepts || [],
      missingConcepts: mergedMissing,
      idealAnswer: scored.idealAnswer || "",
      idealAnswerCode: scored.idealAnswerCode || null,
      idealAnswerCodeLanguage: scored.idealAnswerCodeLanguage || null,
      feedback,
    };
  });

  // Gắn score vào conversation
  for (const q of questionBreakdown) {
    let count = 0;
    for (let i = 0; i < session.conversation.length; i++) {
      const msg = session.conversation[i];
      if (msg.role === "assistant" && msg.type === "question") {
        count++;
        if (count === q.questionNumber) {
          const aIdx = i + 1;
          session.conversation[i].score = q.score;
          session.conversation[i].strengths = q.correctConcepts;
          session.conversation[i].weaknesses = q.missingConcepts;
          if (session.conversation[aIdx]?.role === "user") {
            session.conversation[aIdx].score = q.score;
            session.conversation[aIdx].strengths = q.correctConcepts;
            session.conversation[aIdx].weaknesses = q.missingConcepts;
            session.conversation[aIdx].missingConcepts = q.missingConcepts;
          }
          break;
        }
      }
    }
  }

  const scores = questionBreakdown
    .map((q) => q.score)
    .filter((s) => typeof s === "number");
  const avgScore = scores.length
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : 3;
  const finalScore = Math.min(10, Math.max(0, parseFloat(avgScore.toFixed(1))));

  const overallScore = Math.round(avgScore * 10);
  const grade =
    avgScore >= 8 ? "A" : avgScore >= 6 ? "B" : avgScore >= 4 ? "C" : "D";
  const overallEvaluation =
    avgScore >= 8
      ? "Strong"
      : avgScore >= 6
        ? "Mid-level"
        : avgScore >= 4
          ? "Junior-ready"
          : "Beginner";
  const hireRecommendation =
    avgScore >= 7 ? "Yes" : avgScore >= 5 ? "Maybe" : "No";
  const communicationScore = Math.min(
    10,
    Math.max(1, Math.floor(avgScore) + 2),
  );
  const technicalDepth = Math.min(10, Math.max(1, Math.floor(avgScore) + 1));
  const problemSolving = Math.min(10, Math.max(1, Math.floor(avgScore)));
  const summaryText = `Candidate answered ${questionBreakdown.length} questions with average score ${avgScore.toFixed(1)}/10.`;

  const topicBreakdown = buildTopicBreakdown(questionBreakdown);

  session.finalScore = finalScore;
  session.summary = {
    overallScore,
    grade,
    overallEvaluation,
    hireRecommendation,
    questionBreakdown,
    topicBreakdown,
    communicationScore,
    technicalDepth,
    problemSolving,
    confidence: 5,
    summary: summaryText,
  };

  return { report: session.summary, finalScore };
}

module.exports = {
  callAI,
  scoreQAPairs,
  generateFirstQuestion,
  generateNextQuestion,
  generateFinalReport,
};
