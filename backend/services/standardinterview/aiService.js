// backend/services/standardinterview/aiService.js  (Interview feature)
const { HumanMessage } = require('@langchain/core/messages');
const { GroqService } = require('../ai/groqService');
const { extractJson } = require('../../utils/jsonExtractor');
const {
  logRequest,
  logResponse,
  logError,
  logRateLimit,
  logTokenUsage,
  generateRequestId,
} = require('../../utils/aiLogger'); // ← dùng logger sẵn có, không cần file mới

const MODEL = 'llama-3.3-70b-versatile';

// ─────────────────────────────────────────────
// Helper nội bộ: gọi Groq + log đầy đủ
// ─────────────────────────────────────────────
async function callGroq(groqInstance, messages, feature = 'general', temperature = 0) {
  const requestId = generateRequestId();

  // Lấy text prompt để log + estimate token
  const promptText = messages
    .map(m => m?.lc_kwargs?.content || m?.content || (typeof m === 'string' ? m : ''))
    .join('\n');

  logRequest(MODEL, requestId, promptText, temperature);

  const startTime = Date.now();
  try {
    const responseText = await groqInstance.invokeWithRetry(messages);
    const durationMs = Date.now() - startTime;

    logResponse(MODEL, requestId, responseText, durationMs);

    // Estimate token (1 token ≈ 4 ký tự) vì Groq wrapper không trả usage
    const inputTokens  = Math.ceil(promptText.length / 4);
    const outputTokens = Math.ceil((responseText || '').length / 4);
    logTokenUsage(MODEL, requestId, inputTokens, outputTokens, inputTokens + outputTokens, feature);

    return responseText;
  } catch (error) {
    if (error?.status === 429 || error?.message?.includes('rate limit')) {
      logRateLimit(MODEL, requestId, error?.headers?.['retry-after'] || null, error);
    } else {
      logError(MODEL, requestId, error, feature);
    }
    throw error;
  }
}

// ─────────────────────────────────────────────
// Difficulty config (giữ nguyên)
// ─────────────────────────────────────────────
const difficultyConfig = {
  easy: {
    levelDescription: `- beginner level\n- junior/intern level\n- focus on fundamentals\n- simple debugging\n- basic syntax\n- easy real-world usage`,
    questionStyle: `- conceptual\n- beginner friendly\n- avoid tricky questions\n- avoid complex algorithms`,
    examples: `Examples:\n- What is React state?\n- What is a REST API?\n- Difference between let and var`,
  },
  medium: {
    levelDescription: `- intermediate developer level\n- practical coding knowledge\n- debugging and optimization\n- real-world development scenarios`,
    questionStyle: `- scenario based\n- practical debugging\n- performance basics\n- architecture basics`,
    examples: `Examples:\n- How does useEffect cleanup work?\n- How would you optimize API calls?\n- Difference between SQL and NoSQL`,
  },
  hard: {
    levelDescription: `- advanced mid-level developer\n- deeper problem solving\n- optimization\n- algorithms\n- system thinking\n- edge cases`,
    questionStyle: `- performance optimization\n- algorithm complexity\n- advanced debugging\n- real-world architecture\n- edge-case handling`,
    examples: `Examples:\n- Time complexity of Dijkstra\n- Optimize React rendering\n- Prevent race conditions\n- Design scalable REST APIs`,
  },
};

const buildPrompt = (topic, difficulty) => {
  const config = difficultyConfig[difficulty?.toLowerCase()] || difficultyConfig.medium;
  return `You are a SENIOR TECHNICAL INTERVIEWER.

Your task: Generate a REALISTIC technical interview for topic: "${topic}" Difficulty: "${difficulty}"

==================================================
DIFFICULTY REQUIREMENTS
==================================================
${config.levelDescription}

==================================================
QUESTION STYLE
==================================================
${config.questionStyle}

==================================================
EXAMPLE QUESTIONS
==================================================
${config.examples}

==================================================
IMPORTANT RULES
==================================================
- Questions MUST match the topic closely and difficulty level.
- Avoid repeated concepts, vague or impossible questions.
- Real-world programming knowledge only.

==================================================
MCQ RULES
==================================================
- EXACTLY 7 MCQ, EXACTLY 4 options each, ONLY ONE correct answer.
- Provide explanation why correct answer is correct and others wrong.

==================================================
ESSAY RULES
==================================================
- EXACTLY 3 essay questions, concise but practical, answerable within 100-250 words.

==================================================
OUTPUT FORMAT (ONLY VALID JSON, no extra text)
==================================================
{
  "mcq": [
    {
      "question": "string",
      "difficulty": "easy|medium|hard",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "must exactly match one option",
      "explanation": "detailed explanation"
    }
  ],
  "text": [
    {
      "question": "string",
      "difficulty": "easy|medium|hard",
      "idealAnswerKeywords": ["keyword1", "keyword2"],
      "sampleAnswer": "short professional answer"
    }
  ]
}`;
};

// ─────────────────────────────────────────────
// Validation (giữ nguyên)
// ─────────────────────────────────────────────
const validateMCQ = (mcq = []) =>
  mcq.filter(q =>
    q.question &&
    Array.isArray(q.options) &&
    q.options.length === 4 &&
    q.correctAnswer &&
    q.options.includes(q.correctAnswer)
  );

const validateEssay = (text = []) =>
  text.filter(q => q.question && Array.isArray(q.idealAnswerKeywords));

// ─────────────────────────────────────────────
// generateInterviewQuestions
// ─────────────────────────────────────────────
const generateInterviewQuestions = async (topic, difficulty = 'medium') => {
  const temperature = difficulty === 'easy' ? 0.3 : difficulty === 'medium' ? 0.5 : 0.7;
  const groqService = new GroqService(process.env.GROQ_API_KEY, MODEL, temperature);
  const prompt = buildPrompt(topic, difficulty);

  try {
    const responseText = await callGroq(
      groqService,
      [new HumanMessage(prompt)],
      'generateInterviewQuestions',
      temperature
    );

    const parsed = extractJson(responseText);
    if (!parsed) throw new Error('extractJson returned null');

    let mcq = validateMCQ(parsed.mcq || []);
    let text = validateEssay(parsed.text || []);

    // Xoá trùng
    const used = new Set();
    mcq = mcq.filter(q => {
      const norm = q.question.toLowerCase().trim();
      if (used.has(norm)) return false;
      used.add(norm);
      return true;
    });
    text = text.filter(q => {
      const norm = q.question.toLowerCase().trim();
      if (used.has(norm)) return false;
      used.add(norm);
      return true;
    });

    // Fallback nếu thiếu câu
    const fallbackMCQ = () => ({
      question: `What is an essential concept in ${topic}?`,
      difficulty,
      options: ['Performance', 'Security', 'Scalability', 'Best Practices'],
      correctAnswer: 'Best Practices',
      explanation: `Understanding best practices in ${topic} is crucial for writing maintainable code.`,
    });
    const fallbackEssay = () => ({
      question: `Describe a common challenge when working with ${topic} and how to overcome it.`,
      difficulty,
      idealAnswerKeywords: [topic.toLowerCase(), 'challenge', 'solution'],
      sampleAnswer: `One common challenge is managing state; a solution is using appropriate design patterns.`,
    });

    while (mcq.length < 7) mcq.push(fallbackMCQ());
    while (text.length < 3) text.push(fallbackEssay());

    return { mcq: mcq.slice(0, 7), text: text.slice(0, 3) };
  } catch (error) {
    console.error('Generate Interview Error:', error.message);
    return {
      mcq: Array.from({ length: 7 }, () => ({
        question: `Explain an important concept in ${topic}.`,
        difficulty,
        options: ['Concept A', 'Concept B', 'Concept C', 'All of the above'],
        correctAnswer: 'All of the above',
        explanation: `This ensures coverage of multiple aspects of ${topic}.`,
      })),
      text: Array.from({ length: 3 }, () => ({
        question: `Discuss a best practice for ${topic} development.`,
        difficulty,
        idealAnswerKeywords: [topic.toLowerCase(), 'practice', 'quality'],
        sampleAnswer: `Following coding standards and testing are key practices.`,
      })),
    };
  }
};

// ─────────────────────────────────────────────
// gradeEssay
// ─────────────────────────────────────────────
const gradeEssay = async (question, userAnswer, idealAnswerKeywords) => {
  const prompt = `
You are a STRICT technical interviewer.

Question:
${question}

Expected keywords:
${idealAnswerKeywords.join(', ')}

User answer:
${userAnswer || 'No answer'}

RULES:
- Score between 0 and 10
- Be fair but strict
- Evaluate correctness, technical understanding, keyword coverage, clarity

Return ONLY JSON:
{
  "score": number,
  "explanation": "why this score",
  "feedback": "how to improve"
}
`;

  const groqService = new GroqService(process.env.GROQ_API_KEY, MODEL, 0.2);
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('AI_TIMEOUT')), 30000)
  );

  try {
    const responseText = await Promise.race([
      callGroq(groqService, [new HumanMessage(prompt)], 'gradeEssay', 0.2),
      timeoutPromise,
    ]);

    const result = extractJson(responseText);
    if (!result || typeof result.score !== 'number') throw new Error('Invalid JSON');

    return {
      score: Math.round(Math.min(10, Math.max(0, result.score)) * 10) / 10,
      explanation: result.explanation || 'No explanation',
      feedback: result.feedback || 'Try adding more technical details.',
    };
  } catch (error) {
    console.error('gradeEssay error:', error.message);
    const answer = (userAnswer || '').toLowerCase();
    const matched = (idealAnswerKeywords || []).filter(kw =>
      answer.includes(kw.toLowerCase())
    ).length;
    const score = idealAnswerKeywords?.length
      ? Math.round((matched / idealAnswerKeywords.length) * 100) / 10
      : 0;
    return {
      score,
      explanation: 'Fallback scoring used due to AI error.',
      feedback: 'Include relevant keywords for better score.',
    };
  }
};

module.exports = { generateInterviewQuestions, gradeEssay };