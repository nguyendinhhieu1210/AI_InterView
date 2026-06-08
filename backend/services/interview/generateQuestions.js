const { GroqService } = require('../ai/groqService');
const { safeParseJson, repairTruncatedJson } = require('../ai/parsers/jsonParser');
const { HumanMessage } = require('@langchain/core/messages');
const {
  logRequest, logResponse, logError, logTimeout, logTokenUsage, generateRequestId
} = require('../../logs/aiLogger');

// Tăng lên 4096 để đủ cho 7 MCQ + 3 essay + explanation dài
const GENERATE_QUESTIONS_MAX_TOKENS = 4096;

const TOTAL_MCQ = 7;
const TOTAL_ESSAY = 3;

async function generateQuestionsFromCV(selectedSkills, cvText = '') {
  const requestId = generateRequestId();
  const modelName = 'llama-3.3-70b-versatile';
  const temperature = 0.7;

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

  // Prompt được tối ưu để tiết kiệm token và yêu cầu JSON gọn
  const systemPrompt = `
You are a technical interviewer for junior/mid-level developers.

Generate exactly ${TOTAL_MCQ} multiple-choice questions (MCQ) and ${TOTAL_ESSAY} essay questions 
based on skills: ${uniqueSkills.join(', ')}.

Rules:
- Difficulty: 50% easy, 40% medium, 10% hard.
- MCQ: 4 options, one correct answer. Keep explanation under 20 words.
- Essay: question + idealAnswerKeywords (3-5 keywords) + aiSuggestedAnswer (max 80 words).

IMPORTANT: Return ONLY valid JSON. Do NOT truncate. Do NOT add text outside JSON.

Output format:
{
  "mcq": [
    {
      "type": "mcq",
      "difficulty": "easy|medium|hard",
      "question": "...",
      "options": ["...","...","...","..."],
      "correctAnswer": "...",
      "explanation": "... (short)"
    }
  ],
  "essay": [
    {
      "type": "essay",
      "difficulty": "easy|medium|hard",
      "question": "...",
      "idealAnswerKeywords": ["kw1","kw2"],
      "aiSuggestedAnswer": "... (max 80 words)"
    }
  ]
}
`;

  const userPrompt = `
Candidate's CV (optional):
${cvText.slice(0, 1500)}

Generate questions now. Cover a mix of skills. Output JSON only.
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
      setTimeout(() => reject(new Error(`TIMEOUT after ${timeoutMs}ms`)), timeoutMs)
    );
    let raw = await Promise.race([aiPromise, timeoutPromise]);

    const duration = Date.now() - startTime;
    logResponse(modelName, requestId, raw, duration);

    // Kiểm tra token usage
    const usage = groqService.getLastUsage();
    if (usage) {
      const inputTokens = usage.input_tokens ?? usage.promptTokens ?? usage.prompt_tokens ?? 0;
      const outputTokens = usage.output_tokens ?? usage.completionTokens ?? usage.completion_tokens ?? 0;
      const totalTokens = usage.total_tokens ?? usage.totalTokens ?? (inputTokens + outputTokens);

      if (outputTokens >= GENERATE_QUESTIONS_MAX_TOKENS * 0.95) {
        console.warn(
          `[generateQuestions] outputTokens (${outputTokens}) gần chạm maxTokens (${GENERATE_QUESTIONS_MAX_TOKENS}). ` +
          `JSON có thể bị truncate. Đang thử sửa...`
        );
      }
      logTokenUsage(modelName, requestId, inputTokens, outputTokens, totalTokens, 'generateQuestions');
    }

    // THÊM: sửa JSON bị truncate (thiếu dấu đóng ngoặc hoặc cắt giữa string)
    let parsed = await safeParseJson(raw);
    if (!parsed) {
      console.warn(`[generateQuestions] JSON không hợp lệ, thử repair...`);
      const repaired = repairTruncatedJson(raw);
      if (repaired) {
        parsed = await safeParseJson(repaired);
        if (parsed) console.log(`[generateQuestions] Đã sửa thành công JSON bị truncate.`);
      }
    }

    // Nếu vẫn không parse được, thử retry 1 lần với prompt đơn giản hơn
    if (!parsed) {
      console.warn(`[generateQuestions] JSON vẫn lỗi, gọi lại AI với prompt rút gọn...`);
      const retryResult = await retryGenerateWithSimplerPrompt(uniqueSkills);
      if (retryResult) {
        parsed = retryResult;
      }
    }

    // Trích xuất mcq và essay
    let mcq = (Array.isArray(parsed?.mcq) ? parsed.mcq : [])
      .filter(q => q?.question && Array.isArray(q?.options) && q.options.length === 4 && q?.correctAnswer);
    let essay = (Array.isArray(parsed?.essay) ? parsed.essay : [])
      .filter(q => q?.question);

    // Độn fallback nếu thiếu
    const fallback = generateFallbackQuestions();
    while (mcq.length < TOTAL_MCQ) {
      mcq.push(fallback.mcq[Math.floor(Math.random() * fallback.mcq.length)]);
    }
    while (essay.length < TOTAL_ESSAY) {
      essay.push(fallback.essay[Math.floor(Math.random() * fallback.essay.length)]);
    }

    mcq = mcq.slice(0, TOTAL_MCQ);
    essay = essay.slice(0, TOTAL_ESSAY);

    return { mcq, text: essay };

  } catch (err) {
    const duration = Date.now() - startTime;
    if (err.message?.includes('TIMEOUT')) {
      logTimeout(modelName, requestId, timeoutMs);
    } else {
      logError(modelName, requestId, err, `generateQuestionsFromCV failed after ${duration}ms`);
    }
    console.error('Generate questions error:', err);
    return generateFallbackQuestions();
  }
}

// Hàm retry với prompt đơn giản hơn (ít câu hỏi hơn, ngắn gọn)
async function retryGenerateWithSimplerPrompt(skills, retryCount = 0) {
  if (retryCount >= 1) return null;
  const modelName = 'llama-3.3-70b-versatile';
  const simplePrompt = `
Generate exactly 5 MCQ and 2 essay questions about: ${skills.join(', ')}.

Return ONLY JSON:
{
  "mcq": [{"type":"mcq","difficulty":"easy","question":"...","options":["...","...","...","..."],"correctAnswer":"...","explanation":"..."}],
  "essay": [{"type":"essay","difficulty":"medium","question":"...","idealAnswerKeywords":["kw"],"aiSuggestedAnswer":"..."}]
}
`.trim();

  const groqService = new GroqService(process.env.GROQ_API_KEY, modelName, 0.5, 3072);
  try {
    const raw = await groqService.invokeWithRetry([new HumanMessage(simplePrompt)]);
    const parsed = await safeParseJson(raw);
    if (parsed?.mcq && parsed?.essay) return parsed;
  } catch (e) {
    console.error('Retry failed:', e.message);
  }
  return null;
}

function generateFallbackQuestions() {
  const fallbackMCQ = [
    {
      type: 'mcq',
      difficulty: 'easy',
      question: 'What is the main purpose of React.memo?',
      options: ['Prevent unnecessary re-renders', 'Handle API requests', 'Store global state', 'Create routes'],
      correctAnswer: 'Prevent unnecessary re-renders',
      explanation: 'React.memo memoizes components to reduce unnecessary renders.'
    },
    {
      type: 'mcq',
      difficulty: 'medium',
      question: 'Which issue can cause a memory leak in React?',
      options: ['Not cleaning up useEffect', 'Using Tailwind CSS', 'Using JSX', 'Using props'],
      correctAnswer: 'Not cleaning up useEffect',
      explanation: 'Intervals, subscriptions, or listeners must be cleaned properly.'
    }
  ];
  const fallbackEssay = [
    {
      type: 'essay',
      difficulty: 'medium',
      question: 'How would you improve the performance of a React application?',
      idealAnswerKeywords: ['memoization', 'useMemo', 'useCallback', 'lazy loading'],
      aiSuggestedAnswer: 'Discuss memoization, reducing unnecessary renders, lazy loading, and optimizing state updates.'
    }
  ];
  return { mcq: fallbackMCQ, essay: fallbackEssay };
}

module.exports = { generateQuestionsFromCV };