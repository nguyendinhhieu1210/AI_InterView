const { GroqService } =
  require('../ai/groqService');
const { safeParseJson } = require('../ai/parsers/jsonParser');
const { HumanMessage } = require('@langchain/core/messages');

const groqService = new GroqService(process.env.GROQ_API_KEY, 'llama-3.3-70b-versatile', 0.7);

/**
 * Tạo câu hỏi phỏng vấn dựa trên danh sách kỹ năng đã phân loại
 * @param {Object} selectedSkills - { frontend, backend, theory, devops }
 * @param {string} cvText - nội dung CV (để lấy context)
 * @returns {Promise<{mcq: Array, text: Array}>}
 */
async function generateQuestionsFromCV(selectedSkills, cvText = '') {
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

  const TOTAL_QUESTIONS = 10;
  const TOTAL_MCQ = 7;
  const TOTAL_ESSAY = 3;

  const EASY_STYLES = ['conceptual', 'best_practice', 'basic_debugging', 'real_world'];
  const MEDIUM_STYLES = ['performance', 'comparison', 'optimization', 'scenario'];

  const usedQuestions = new Set();
  const generated = [];

  const baseCount = Math.floor(TOTAL_QUESTIONS / uniqueSkills.length);
  const extra = TOTAL_QUESTIONS % uniqueSkills.length;

  for (let i = 0; i < uniqueSkills.length; i++) {
    const skill = uniqueSkills[i];
    const count = baseCount + (i < extra ? 1 : 0);
    if (count <= 0) continue;

    const randomStyles = [
      ...EASY_STYLES.sort(() => Math.random() - 0.5).slice(0, 2),
      ...MEDIUM_STYLES.sort(() => Math.random() - 0.5).slice(0, 1)
    ];

    const systemPrompt = `
You are a FRIENDLY TECHNICAL INTERVIEWER.

Your goal:
Generate REALISTIC interview questions suitable for:
- junior developers
- interns
- fresher to mid-level candidates

IMPORTANT RULES:
- Questions should be practical but NOT overly difficult.
- Avoid enterprise-scale architecture questions.
- Avoid impossible debugging scenarios.
- Focus on:
  - React basics/intermediate
  - REST API usage
  - Docker basics
  - debugging basics
  - performance basics
  - best practices

QUESTION STYLES:
${randomStyles.join(', ')}

DIFFICULTY DISTRIBUTION:
- 50% easy
- 40% medium
- 10% hard

Hard questions should still be solvable by mid-level developers.

MCQ RULES:
- 4 options
- only ONE correct answer
- explanation required
- avoid trick questions

ESSAY RULES:
- concise practical questions
- answerable within 100-200 words
- avoid huge architecture discussions

STRICT JSON ONLY:

{
  "questions": [
    {
      "type": "mcq",
      "difficulty": "easy|medium|hard",
      "question": "",
      "options": ["","","",""],
      "correctAnswer": "",
      "explanation": ""
    },
    {
      "type": "essay",
      "difficulty": "easy|medium|hard",
      "question": "",
      "idealAnswerKeywords": [],
      "aiSuggestedAnswer": ""
    }
  ]
}
`;

    const userPrompt = `
Technology Skill:
${skill}

Generate EXACTLY ${count} UNIQUE questions.

Important:
- Questions MUST be realistic.
- Questions should feel like real interviews.
- Avoid repeated beginner questions.
- Avoid over-complicated architecture questions.
- Focus on practical understanding.

Candidate CV context:
${cvText.slice(0, 1000)}

Return ONLY JSON.
`;

    try {
      // Gộp system + user thành một HumanMessage (vì prompt đã bao gồm system)
      const messages = [new HumanMessage(`${systemPrompt}\n\n${userPrompt}`)];
      const raw = await groqService.invokeWithRetry(messages);
      const parsed = await safeParseJson(raw);

      if (!parsed.questions || !Array.isArray(parsed.questions)) continue;

      for (const q of parsed.questions) {
        if (!q.question) continue;
        const normalizedQuestion = q.question.toLowerCase().replace(/[^\w\s]/g, '').trim();
        if (usedQuestions.has(normalizedQuestion)) continue;
        usedQuestions.add(normalizedQuestion);
        generated.push(q);
      }
    } catch (err) {
      console.error(`Generate question error (${skill}):`, err.message);
    }
  }

  // Phân loại MCQ và Essay
  let mcq = generated.filter(q => q.type === 'mcq');
  let essay = generated.filter(q => q.type === 'essay');

  // Xáo trộn
  mcq = mcq.sort(() => Math.random() - 0.5);
  essay = essay.sort(() => Math.random() - 0.5);

  // Fallback MCQ (giống hệt code cũ)
  const fallbackMCQ = [
    {
      type: "mcq",
      difficulty: "easy",
      question: "What is the main purpose of React.memo?",
      options: [
        "Prevent unnecessary re-renders",
        "Handle API requests",
        "Store global state",
        "Create routes"
      ],
      correctAnswer: "Prevent unnecessary re-renders",
      explanation: "React.memo memoizes components to reduce unnecessary renders."
    },
    {
      type: "mcq",
      difficulty: "medium",
      question: "Which issue can cause a memory leak in React?",
      options: [
        "Not cleaning up useEffect",
        "Using Tailwind CSS",
        "Using JSX",
        "Using props"
      ],
      correctAnswer: "Not cleaning up useEffect",
      explanation: "Intervals, subscriptions, or listeners must be cleaned properly."
    }
  ];

  while (mcq.length < TOTAL_MCQ) {
    mcq.push(fallbackMCQ[Math.floor(Math.random() * fallbackMCQ.length)]);
  }

  // Fallback Essay
  const fallbackEssay = [
    {
      type: "essay",
      difficulty: "medium",
      question: "How would you improve the performance of a React application?",
      idealAnswerKeywords: ["memoization", "useMemo", "useCallback", "lazy loading", "performance"],
      aiSuggestedAnswer: "A strong answer should discuss memoization, reducing unnecessary renders, lazy loading, and optimizing state updates."
    }
  ];

  while (essay.length < TOTAL_ESSAY) {
    essay.push(fallbackEssay[Math.floor(Math.random() * fallbackEssay.length)]);
  }

  mcq = mcq.slice(0, TOTAL_MCQ);
  essay = essay.slice(0, TOTAL_ESSAY);

  return { mcq, text: essay };
}

/**
 * Hàm dự phòng khi không có kỹ năng nào
 */
function generateFallbackQuestions() {
  const fallbackMCQ = [
    {
      type: "mcq",
      difficulty: "easy",
      question: "What is the main purpose of React.memo?",
      options: [
        "Prevent unnecessary re-renders",
        "Handle API requests",
        "Store global state",
        "Create routes"
      ],
      correctAnswer: "Prevent unnecessary re-renders",
      explanation: "React.memo memoizes components to reduce unnecessary renders."
    },
    {
      type: "mcq",
      difficulty: "medium",
      question: "Which issue can cause a memory leak in React?",
      options: [
        "Not cleaning up useEffect",
        "Using Tailwind CSS",
        "Using JSX",
        "Using props"
      ],
      correctAnswer: "Not cleaning up useEffect",
      explanation: "Intervals, subscriptions, or listeners must be cleaned properly."
    }
  ];
  const fallbackEssay = [
    {
      type: "essay",
      difficulty: "medium",
      question: "How would you improve the performance of a React application?",
      idealAnswerKeywords: ["memoization", "useMemo", "useCallback", "lazy loading", "performance"],
      aiSuggestedAnswer: "A strong answer should discuss memoization, reducing unnecessary renders, lazy loading, and optimizing state updates."
    }
  ];

  return {
    mcq: fallbackMCQ.slice(0, 7),
    text: fallbackEssay.slice(0, 3)
  };
}

module.exports = { generateQuestionsFromCV };