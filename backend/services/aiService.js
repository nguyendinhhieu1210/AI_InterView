// backend/services/aiService.js
const { HumanMessage } = require('@langchain/core/messages');
const { GroqService } = require('./ai/groqService');
const { extractJson } = require('../utils/jsonExtractor'); // dùng hàm của bạn

// ---------- Giữ nguyên toàn bộ difficultyConfig, buildPrompt, validate... (cũ) ----------
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

const validateMCQ = (mcq = []) => {
  return mcq.filter(q => q.question && Array.isArray(q.options) && q.options.length === 4 && q.correctAnswer && q.options.includes(q.correctAnswer));
};

const validateEssay = (text = []) => {
  return text.filter(q => q.question && Array.isArray(q.idealAnswerKeywords));
};

// ---------- Hàm tạo câu hỏi ----------
const generateInterviewQuestions = async (topic, difficulty = 'medium') => {
  const prompt = buildPrompt(topic, difficulty);
  let temperature = difficulty === 'easy' ? 0.3 : (difficulty === 'medium' ? 0.5 : 0.7);
  const groqService = new GroqService(process.env.GROQ_API_KEY, 'llama-3.3-70b-versatile', temperature);

  try {
    const responseText = await groqService.invokeWithRetry([new HumanMessage(prompt)]);
    // Dùng extractJson thay cho safeParseJSON cũ
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

    // Fallback chỉ khi thiếu, nội dung liên quan đến topic, không có "Fallback X"
    const fallbackMCQBase = () => ({
      question: `What is an essential concept in ${topic}?`,
      difficulty,
      options: ['Performance', 'Security', 'Scalability', 'Best Practices'],
      correctAnswer: 'Best Practices',
      explanation: `Understanding best practices in ${topic} is crucial for writing maintainable code.`
    });
    const fallbackEssayBase = () => ({
      question: `Describe a common challenge when working with ${topic} and how to overcome it.`,
      difficulty,
      idealAnswerKeywords: [topic.toLowerCase(), 'challenge', 'solution'],
      sampleAnswer: `One common challenge is managing state; a solution is using appropriate design patterns.`
    });

    while (mcq.length < 7) mcq.push(fallbackMCQBase());
    while (text.length < 3) text.push(fallbackEssayBase());

    return { mcq: mcq.slice(0,7), text: text.slice(0,3) };
  } catch (error) {
    console.error('Generate Interview Error:', error.message);
    // Fallback an toàn, không có từ "Fallback"
    const defaultMCQ = [];
    for (let i=0; i<7; i++) {
      defaultMCQ.push({
        question: `Explain an important concept in ${topic}.`,
        difficulty,
        options: ['Concept A', 'Concept B', 'Concept C', 'All of the above'],
        correctAnswer: 'All of the above',
        explanation: `This ensures coverage of multiple aspects of ${topic}.`
      });
    }
    const defaultEssay = [];
    for (let i=0; i<3; i++) {
      defaultEssay.push({
        question: `Discuss a best practice for ${topic} development.`,
        difficulty,
        idealAnswerKeywords: [topic.toLowerCase(), 'practice', 'quality'],
        sampleAnswer: `Following coding standards and testing are key practices.`
      });
    }
    return { mcq: defaultMCQ, text: defaultEssay };
  }
};

// ---------- Hàm chấm điểm essay (giữ nguyên, chỉ dùng extractJson) ----------
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

  const groqService = new GroqService(process.env.GROQ_API_KEY, 'llama-3.3-70b-versatile', 0.2);
  const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('AI_TIMEOUT')), 30000));

  try {
    const aiCall = groqService.invokeWithRetry([new HumanMessage(prompt)]);
    const responseText = await Promise.race([aiCall, timeoutPromise]);
    const result = extractJson(responseText);
    if (!result || typeof result.score !== 'number') throw new Error('Invalid JSON');
    let score = Math.min(10, Math.max(0, result.score));
    score = Math.round(score * 10) / 10;
    return {
      score,
      explanation: result.explanation || 'No explanation',
      feedback: result.feedback || 'Try adding more technical details.'
    };
  } catch (error) {
    console.error('gradeEssay error:', error.message);
    // Fallback keyword-based
    const answer = (userAnswer || '').toLowerCase();
    let matched = 0;
    for (const kw of idealAnswerKeywords || []) {
      if (answer.includes(kw.toLowerCase())) matched++;
    }
    const score = idealAnswerKeywords.length ? (matched / idealAnswerKeywords.length) * 10 : 0;
    return {
      score: Math.round(score * 10) / 10,
      explanation: 'Fallback scoring used due to AI error.',
      feedback: 'Include relevant keywords for better score.'
    };
  }
};

module.exports = { generateInterviewQuestions, gradeEssay };