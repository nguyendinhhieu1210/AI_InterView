const { GroqService } = require('../ai/groqService');
const {
  safeParseJson,
  repairTruncatedJson,
} = require('../ai/parsers/jsonParser');
const { HumanMessage } = require('@langchain/core/messages');
const {
  logRequest,
  logResponse,
  logError,
  logTimeout,
  logTokenUsage,
  generateRequestId,
} = require('../../utils/aiLogger');

const GENERATE_QUESTIONS_MAX_TOKENS = 4096;
const TOTAL_MCQ = 7;
const TOTAL_ESSAY = 3;

async function generateQuestionsFromCV(selectedSkills, cvText = '') {
  const requestId = generateRequestId();
  const modelName = 'llama-3.3-70b-versatile';
  const temperature = 0.9; // Tăng lên 0.9 cho đa dạng tối đa

  // Gom các skill theo category
  const skillCategories = {
    frontend: selectedSkills.frontend || [],
    backend: selectedSkills.backend || [],
    theory: selectedSkills.theory || [],
    devops: selectedSkills.devops || [],
  };

  const activeCategories = {};
  for (const [category, skills] of Object.entries(skillCategories)) {
    if (skills.length > 0) {
      activeCategories[category] = skills;
    }
  }

  const allSkills = Object.values(activeCategories).flat();
  const uniqueSkills = [...new Set(allSkills)];

  if (uniqueSkills.length === 0) {
    return generateFallbackQuestions();
  }

  // Tạo prompt cực kỳ cụ thể dựa trên skills được chọn
  const systemPrompt = `
You are a technical interviewer. Generate unique, custom interview questions.

**IMPORTANT: The user selected these specific skills: ${uniqueSkills.join(', ')}**

Each question MUST be directly related to these skills. 
DO NOT use generic questions like "What is React?" or "Explain closures" unless these skills were selected.

SKILL CATEGORIES:
${buildSkillDescription(activeCategories)}

REQUIREMENTS:
1. Generate ${TOTAL_MCQ} multiple-choice questions
2. Generate ${TOTAL_ESSAY} essay questions
3. Each question MUST test a SPECIFIC skill from the list above
4. Questions must be PRACTICAL and REAL-WORLD scenario based
5. NO DUPLICATE questions
6. Cover ALL skills mentioned
7. Difficulty distribution: 50% easy, 40% medium, 10% hard

EXAMPLES of GOOD questions for specific skills:
- For JavaScript: "What will be the output of: console.log([..."abc"]);" 
- For Docker: "What command creates a new Docker image from a Dockerfile?"
- For MongoDB: "Explain the difference between $lookup and $graphLookup"
- For Node.js: "How does Node.js handle child processes?"

OUTPUT FORMAT (JSON ONLY, NO OTHER TEXT):
{
  "mcq": [
    {
      "type": "mcq",
      "skill": "exact skill name from selected list",
      "difficulty": "easy|medium|hard",
      "question": "specific question about this skill",
      "options": ["option1", "option2", "option3", "option4"],
      "correctAnswer": "the correct option",
      "explanation": "brief explanation (max 20 words)"
    }
  ],
  "essay": [
    {
      "type": "essay",
      "skill": "exact skill name from selected list",
      "difficulty": "easy|medium|hard",
      "question": "open-ended question about this skill",
      "idealAnswerKeywords": ["keyword1", "keyword2", "keyword3"],
      "aiSuggestedAnswer": "model answer (max 80 words)"
    }
  ]
}`;

  const userPrompt = `
CANDIDATE SKILLS TO TEST:
${formatSkillsForPrompt(activeCategories)}

${cvText ? `CV CONTEXT (for reference only):\n${cvText.slice(0, 1000)}` : ''}

CRITICAL: Generate questions ONLY about these skills: ${uniqueSkills.join(', ')}
Do not use template questions. Create unique, custom questions for EACH skill.
Make sure to cover ALL skills. Output must be valid JSON.
`;

  const messages = [new HumanMessage(`${systemPrompt}\n\n${userPrompt}`)];
  const startTime = Date.now();

  logRequest(modelName, requestId, systemPrompt + userPrompt, temperature);

  const groqService = new GroqService(
    process.env.GROQ_API_KEY,
    modelName,
    temperature,
    GENERATE_QUESTIONS_MAX_TOKENS
  );

  const timeoutMs = 60000;

  try {
    const aiPromise = groqService.invokeWithRetry(messages);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`TIMEOUT after ${timeoutMs}ms`)),
        timeoutMs
      )
    );
    let raw = await Promise.race([aiPromise, timeoutPromise]);

    const duration = Date.now() - startTime;
    logResponse(modelName, requestId, raw, duration);

    // Parse và repair JSON
    let parsed = await safeParseJson(raw);
    if (!parsed) {
      console.warn(`[generateQuestions] JSON không hợp lệ, thử repair...`);
      const repaired = repairTruncatedJson(raw);
      if (repaired) {
        parsed = await safeParseJson(repaired);
        if (parsed)
          console.log(
            `[generateQuestions] Đã sửa thành công JSON bị truncate.`
          );
      }
    }

    // Nếu parse vẫn fail hoặc questions không đủ, retry với prompt cụ thể hơn
    if (!parsed || !parsed.mcq || parsed.mcq.length < 3) {
      console.warn(
        `[generateQuestions] JSON lỗi hoặc thiếu câu hỏi, retry với prompt chi tiết hơn...`
      );
      const retryResult = await retryWithSpecificSkills(
        uniqueSkills,
        activeCategories
      );
      if (retryResult) {
        parsed = retryResult;
      }
    }

    // Lấy và validate questions
    let mcq = extractValidQuestions(parsed?.mcq || [], 'mcq');
    let essay = extractValidQuestions(parsed?.essay || [], 'essay');

    // Kiểm tra xem đã cover hết skills chưa
    const coveredSkills = new Set();
    mcq.forEach((q) => coveredSkills.add(q.skill));
    essay.forEach((q) => coveredSkills.add(q.skill));

    const missingSkills = uniqueSkills.filter((s) => !coveredSkills.has(s));
    if (missingSkills.length > 0) {
      console.warn(
        `[generateQuestions] Thiếu câu hỏi cho skills: ${missingSkills.join(', ')}`
      );
      // Thêm câu hỏi cho skills bị thiếu
      const additionalQuestions =
        await generateQuestionsForMissingSkills(missingSkills);
      mcq = [...mcq, ...additionalQuestions.mcq];
      essay = [...essay, ...additionalQuestions.essay];
    }

    // Đảm bảo đa dạng và không trùng lặp
    mcq = deduplicateAndBalance(mcq, uniqueSkills, TOTAL_MCQ, 'mcq');
    essay = deduplicateAndBalance(essay, uniqueSkills, TOTAL_ESSAY, 'essay');

    // Nếu vẫn thiếu, dùng fallback nhưng gắn skill cụ thể
    const fallback = generateFallbackQuestions();
    while (mcq.length < TOTAL_MCQ) {
      const fbQ = {
        ...fallback.mcq[Math.floor(Math.random() * fallback.mcq.length)],
      };
      // Gắn skill còn thiếu
      const missingSkill = uniqueSkills.find(
        (s) => !mcq.some((q) => q.skill === s)
      );
      fbQ.skill = missingSkill || uniqueSkills[0] || 'General';
      mcq.push(fbQ);
    }
    while (essay.length < TOTAL_ESSAY) {
      const fbQ = {
        ...fallback.essay[Math.floor(Math.random() * fallback.essay.length)],
      };
      const missingSkill = uniqueSkills.find(
        (s) => !essay.some((q) => q.skill === s)
      );
      fbQ.skill = missingSkill || uniqueSkills[0] || 'General';
      essay.push(fbQ);
    }

    mcq = mcq.slice(0, TOTAL_MCQ);
    essay = essay.slice(0, TOTAL_ESSAY);

    // Log kết quả để debug
    console.log(
      `[generateQuestions] Generated: ${mcq.length} MCQ, ${essay.length} Essay`
    );
    console.log(
      `[generateQuestions] Skills covered: ${[...new Set([...mcq.map((q) => q.skill), ...essay.map((q) => q.skill)])].join(', ')}`
    );

    return { mcq, text: essay };
  } catch (err) {
    const duration = Date.now() - startTime;
    if (err.message?.includes('TIMEOUT')) {
      logTimeout(modelName, requestId, timeoutMs);
    } else {
      logError(
        modelName,
        requestId,
        err,
        `generateQuestionsFromCV failed after ${duration}ms`
      );
    }
    console.error('Generate questions error:', err);

    // Trả về fallback với skills được gán đúng
    return generateFallbackQuestionsWithSkills(uniqueSkills);
  }
}

// Hàm retry với prompt cụ thể theo skill
async function retryWithSpecificSkills(
  skills,
  activeCategories,
  retryCount = 0
) {
  if (retryCount >= 2) return null;

  const modelName = 'llama-3.3-70b-versatile';
  const skillList = skills.join(', ');

  // Prompt cực kỳ cụ thể
  const prompt = `
Generate ${TOTAL_MCQ} MCQs and ${TOTAL_ESSAY} essay questions for these EXACT skills: ${skillList}

Each question MUST test a specific skill from this list.

For each question, specify which skill it tests.

Examples for skill "${skills[0] || 'JavaScript'}":
- Write a question that a junior developer should know about ${skills[0] || 'JavaScript'}

Return ONLY JSON with no other text.

{
  "mcq": [
    {"type":"mcq","skill":"${skills[0] || 'JavaScript'}","difficulty":"easy","question":"...","options":["...","...","...","..."],"correctAnswer":"...","explanation":"..."}
  ],
  "essay": [
    {"type":"essay","skill":"${skills[0] || 'JavaScript'}","difficulty":"medium","question":"...","idealAnswerKeywords":["kw1","kw2"],"aiSuggestedAnswer":"..."}
  ]
}
`.trim();

  const groqService = new GroqService(
    process.env.GROQ_API_KEY,
    modelName,
    0.8,
    4096
  );

  try {
    const raw = await groqService.invokeWithRetry([new HumanMessage(prompt)]);
    const parsed = await safeParseJson(raw);

    if (parsed && parsed.mcq && parsed.mcq.length > 0) {
      // Gán skill nếu thiếu
      parsed.mcq = parsed.mcq.map((q) => ({
        ...q,
        skill: q.skill || skills[Math.floor(Math.random() * skills.length)],
      }));
      parsed.essay = parsed.essay.map((q) => ({
        ...q,
        skill: q.skill || skills[Math.floor(Math.random() * skills.length)],
      }));
      return parsed;
    }
  } catch (e) {
    console.error('Retry specific skills failed:', e.message);
  }

  return null;
}

// Generate questions cho skills bị thiếu
async function generateQuestionsForMissingSkills(missingSkills) {
  const result = { mcq: [], essay: [] };

  for (const skill of missingSkills) {
    // Tạo 2 MCQ và 1 essay cho mỗi skill bị thiếu
    const prompt = `
Generate 2 MCQ and 1 essay question about "${skill}".

Return ONLY JSON:
{
  "mcq": [
    {"type":"mcq","skill":"${skill}","difficulty":"medium","question":"...","options":["...","...","...","..."],"correctAnswer":"...","explanation":"..."}
  ],
  "essay": [
    {"type":"essay","skill":"${skill}","difficulty":"medium","question":"...","idealAnswerKeywords":["kw1","kw2","kw3"],"aiSuggestedAnswer":"..."}
  ]
}`;

    try {
      const groqService = new GroqService(
        process.env.GROQ_API_KEY,
        'llama-3.3-70b-versatile',
        0.7,
        2048
      );
      const raw = await groqService.invokeWithRetry([new HumanMessage(prompt)]);
      const parsed = await safeParseJson(raw);

      if (parsed) {
        result.mcq.push(...(parsed.mcq || []));
        result.essay.push(...(parsed.essay || []));
      }
    } catch (e) {
      console.error(`Failed to generate questions for ${skill}:`, e.message);
    }
  }

  return result;
}

// Helper: Loại bỏ trùng lặp và cân bằng skills
function deduplicateAndBalance(questions, skills, targetCount, type) {
  if (!Array.isArray(questions) || questions.length === 0) {
    return [];
  }

  // Loại bỏ trùng lặp (dựa trên question text)
  const seen = new Set();
  const unique = questions.filter((q) => {
    const key = q.question?.toLowerCase().trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Gom theo skill
  const bySkill = {};
  unique.forEach((q) => {
    const skill = q.skill || 'unknown';
    if (!bySkill[skill]) bySkill[skill] = [];
    bySkill[skill].push(q);
  });

  // Lấy ít nhất 1 câu từ mỗi skill
  const balanced = [];
  const skillKeys = Object.keys(bySkill);

  // Round-robin qua các skill
  let maxIterations = targetCount * 2;
  while (balanced.length < targetCount && maxIterations > 0) {
    for (const skill of skillKeys) {
      if (balanced.length >= targetCount) break;
      if (bySkill[skill] && bySkill[skill].length > 0) {
        balanced.push(bySkill[skill].shift());
      }
    }
    maxIterations--;
  }

  return balanced;
}

// Helper functions
function buildSkillDescription(activeCategories) {
  let result = '';
  for (const [category, skills] of Object.entries(activeCategories)) {
    result += `- ${category.toUpperCase()}: ${skills.join(', ')}\n`;
  }
  return result;
}

function formatSkillsForPrompt(activeCategories) {
  let result = '';
  for (const [category, skills] of Object.entries(activeCategories)) {
    result += `${category.toUpperCase()}: ${skills.join(', ')}\n`;
  }
  return result;
}

function extractValidQuestions(questions, type) {
  if (!Array.isArray(questions)) return [];

  return questions.filter((q) => {
    if (!q || typeof q !== 'object') return false;
    if (!q.question || typeof q.question !== 'string' || q.question.length < 10)
      return false;
    if (!q.difficulty || !['easy', 'medium', 'hard'].includes(q.difficulty))
      return false;

    if (type === 'mcq') {
      return (
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        q.options.every(
          (opt) => typeof opt === 'string' && opt.trim().length > 0
        ) &&
        q.correctAnswer &&
        typeof q.correctAnswer === 'string' &&
        q.options.includes(q.correctAnswer)
      );
    } else {
      return (
        Array.isArray(q.idealAnswerKeywords) &&
        q.idealAnswerKeywords.length >= 2 &&
        q.aiSuggestedAnswer &&
        typeof q.aiSuggestedAnswer === 'string' &&
        q.aiSuggestedAnswer.length > 10
      );
    }
  });
}

function generateFallbackQuestionsWithSkills(skills) {
  const fallback = generateFallbackQuestions();

  // Gán skills cụ thể cho fallback questions
  const mcq = fallback.mcq.map((q, index) => ({
    ...q,
    skill: skills[index % skills.length] || 'General',
  }));

  const essay = fallback.essay.map((q, index) => ({
    ...q,
    skill: skills[(index + 2) % skills.length] || 'General',
  }));

  return { mcq, text: essay };
}

function generateFallbackQuestions() {
  const fallbackMCQ = [
    {
      type: 'mcq',
      difficulty: 'easy',
      question: 'What is the main purpose of React.memo?',
      options: [
        'Prevent unnecessary re-renders',
        'Handle API requests',
        'Store global state',
        'Create routes',
      ],
      correctAnswer: 'Prevent unnecessary re-renders',
      explanation:
        'React.memo memoizes components to reduce unnecessary renders.',
    },
    {
      type: 'mcq',
      difficulty: 'medium',
      question: 'Which hook is used for side effects in React?',
      options: ['useState', 'useEffect', 'useContext', 'useReducer'],
      correctAnswer: 'useEffect',
      explanation:
        'useEffect handles side effects like data fetching and subscriptions.',
    },
    {
      type: 'mcq',
      difficulty: 'easy',
      question: 'What command builds a Docker image?',
      options: ['docker build', 'docker create', 'docker run', 'docker image'],
      correctAnswer: 'docker build',
      explanation: 'docker build creates a Docker image from a Dockerfile.',
    },
    {
      type: 'mcq',
      difficulty: 'medium',
      question: 'What is the difference between let and const in JavaScript?',
      options: [
        'let allows reassignment, const does not',
        'const allows reassignment, let does not',
        'They are the same',
        'let is block-scoped, const is not',
      ],
      correctAnswer: 'let allows reassignment, const does not',
      explanation:
        'let variables can be reassigned, const cannot be reassigned after declaration.',
    },
  ];

  const fallbackEssay = [
    {
      type: 'essay',
      difficulty: 'medium',
      question: 'How would you improve the performance of a React application?',
      idealAnswerKeywords: [
        'memoization',
        'useMemo',
        'useCallback',
        'lazy loading',
      ],
      aiSuggestedAnswer:
        'Discuss memoization, reducing unnecessary renders, lazy loading, and optimizing state updates.',
    },
    {
      type: 'essay',
      difficulty: 'easy',
      question: 'Explain the concept of closures in JavaScript',
      idealAnswerKeywords: [
        'closure',
        'lexical scope',
        'inner function',
        'outer function',
      ],
      aiSuggestedAnswer:
        'A closure is a function that has access to its outer scope even after the outer function has returned.',
    },
    {
      type: 'essay',
      difficulty: 'medium',
      question: 'What are the benefits of using Docker for development?',
      idealAnswerKeywords: [
        'containerization',
        'isolation',
        'consistency',
        'portability',
      ],
      aiSuggestedAnswer:
        'Docker provides consistent environments, isolates dependencies, and makes applications portable across systems.',
    },
  ];

  return { mcq: fallbackMCQ, essay: fallbackEssay };
}

module.exports = { generateQuestionsFromCV };
