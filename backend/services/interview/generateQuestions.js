// services/interview/generateQuestions.js

const { GroqService } = require('../ai/groqService');
const { safeParseJson } = require('../ai/parsers/jsonParser');
const { HumanMessage } = require('@langchain/core/messages');

const groqService = new GroqService(process.env.GROQ_API_KEY, 'llama-3.3-70b-versatile', 0.7);

async function generateQuestionsFromCV(selectedSkills, cvText = '') {
  // Gom tất cả kỹ năng từ 4 nhóm
  const allSkills = [
    ...(selectedSkills.frontend || []),
    ...(selectedSkills.backend || []),
    ...(selectedSkills.theory || []),
    ...(selectedSkills.devops || [])
  ];
  const uniqueSkills = [...new Set(allSkills)];

  if (uniqueSkills.length === 0) {
    return generateFallbackQuestions();
  }

  const TOTAL_MCQ = 7;
  const TOTAL_ESSAY = 3;

  // Prompt duy nhất – yêu cầu sinh câu hỏi dựa trên danh sách kỹ năng
  const systemPrompt = `
You are a FRIENDLY TECHNICAL INTERVIEWER for junior/mid-level developers.

Generate exactly ${TOTAL_MCQ} multiple-choice questions (MCQ) and ${TOTAL_ESSAY} essay questions 
based on the following skills: ${uniqueSkills.join(', ')}.

Rules:
- Questions must be practical, realistic, and avoid enterprise-scale complexity.
- Difficulty distribution: 50% easy, 40% medium, 10% hard.
- MCQ: 4 options, one correct answer, include explanation.
- Essay: concise (100-200 words answer), include "idealAnswerKeywords" array.

Return ONLY JSON with this structure:
{
  "mcq": [
    {
      "type": "mcq",
      "difficulty": "easy|medium|hard",
      "question": "...",
      "options": ["...", "...", "...", "..."],
      "correctAnswer": "...",
      "explanation": "..."
    }
  ],
  "essay": [
    {
      "type": "essay",
      "difficulty": "easy|medium|hard",
      "question": "...",
      "idealAnswerKeywords": ["keyword1", "keyword2"],
      "aiSuggestedAnswer": "..."
    }
  ]
}
`;

  const userPrompt = `
Candidate's CV context (optional):
${cvText.slice(0, 1500)}

Generate the questions now. Ensure they cover a mix of the skills listed. 
Do not repeat the same question. 
Output JSON only.
`;

  try {
    const messages = [new HumanMessage(`${systemPrompt}\n\n${userPrompt}`)];
    const raw = await groqService.invokeWithRetry(messages);
    const parsed = await safeParseJson(raw);

    let mcq = parsed.mcq || [];
    let essay = parsed.essay || [];

    // Đảm bảo đủ số lượng, dùng fallback nếu thiếu
    const fallback = generateFallbackQuestions();
    while (mcq.length < TOTAL_MCQ) mcq.push(fallback.mcq[Math.floor(Math.random() * fallback.mcq.length)]);
    while (essay.length < TOTAL_ESSAY) essay.push(fallback.essay[Math.floor(Math.random() * fallback.essay.length)]);

    // Cắt gọn nếu thừa (do AI sinh dư)
    mcq = mcq.slice(0, TOTAL_MCQ);
    essay = essay.slice(0, TOTAL_ESSAY);

    return { mcq, text: essay };
  } catch (err) {
    console.error("Generate questions error:", err);
    return generateFallbackQuestions();
  }
}

function generateFallbackQuestions() {
  const fallbackMCQ = [
    {
      type: "mcq",
      difficulty: "easy",
      question: "What is the main purpose of React.memo?",
      options: ["Prevent unnecessary re-renders", "Handle API requests", "Store global state", "Create routes"],
      correctAnswer: "Prevent unnecessary re-renders",
      explanation: "React.memo memoizes components to reduce unnecessary renders."
    },
    {
      type: "mcq",
      difficulty: "medium",
      question: "Which issue can cause a memory leak in React?",
      options: ["Not cleaning up useEffect", "Using Tailwind CSS", "Using JSX", "Using props"],
      correctAnswer: "Not cleaning up useEffect",
      explanation: "Intervals, subscriptions, or listeners must be cleaned properly."
    }
  ];
  const fallbackEssay = [
    {
      type: "essay",
      difficulty: "medium",
      question: "How would you improve the performance of a React application?",
      idealAnswerKeywords: ["memoization", "useMemo", "useCallback", "lazy loading"],
      aiSuggestedAnswer: "Discuss memoization, reducing unnecessary renders, lazy loading, and optimizing state updates."
    }
  ];
  return {
    mcq: fallbackMCQ,
    essay: fallbackEssay
  };
}

module.exports = { generateQuestionsFromCV };