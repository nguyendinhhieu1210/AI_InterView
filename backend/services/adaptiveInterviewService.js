const AdaptiveSession = require('../models/AdaptiveSession');
const { GroqService } = require('./ai/groqService');

const groqService = new GroqService(process.env.GROQ_API_KEY, 'llama-3.3-70b-versatile', 0.2);

// ========== CẤU HÌNH ==========
const TOTAL_QUESTIONS = 8;

// ========== QUY TẮC ĐỘ KHÓ ==========
const DIFFICULTY_RULES = {
  easy: `- Ask beginner-friendly questions.\n- Focus on definitions, basic usage, simple examples.\n- Keep questions short and direct.`,
  medium: `- Ask practical, scenario-based questions.\n- Include comparisons and common pitfalls.\n- Expect basic optimization knowledge.`,
  hard: `- Ask deep technical questions.\n- Include performance, edge cases, architecture decisions.\n- Expect knowledge of internals and trade-offs.`
};

// ========== ROADMAP ==========
const TOPIC_ROADMAPS = {
  react: {
    fundamentals: ['jsx & components', 'props vs state', 'event handling', 'conditional rendering', 'lists & keys'],
    hooks: ['useState', 'useEffect (deps, cleanup)', 'custom hooks', 'useMemo & useCallback'],
    performance: ['memoization (React.memo)', 'avoiding re-renders', 'lazy loading & code splitting'],
    architecture: ['context API', 'state management (Redux/Zustand)', 'component composition patterns']
  },
  oop: {
    fundamentals: ['classes & objects', 'encapsulation', 'inheritance', 'polymorphism', 'abstraction'],
    advanced: ['interface vs abstract class', 'composition vs inheritance', 'solid principles'],
    patterns: ['dependency injection', 'factory', 'singleton', 'observer']
  },
  javascript: {
    fundamentals: ['data types', 'hoisting & scope', 'closures', 'prototypes', 'this binding'],
    modern: ['arrow functions', 'destructuring', 'spread/rest', 'modules'],
    async: ['promises', 'async/await', 'event loop', 'error handling'],
    functional: ['map/filter/reduce', 'immutability', 'currying']
  },
  nodejs: {
    fundamentals: ['event loop', 'commonjs vs es modules', 'file system', 'http server'],
    express: ['middleware', 'routing', 'error handling', 'authentication'],
    advanced: ['streams', 'child processes', 'cluster', 'performance tuning'],
    security: ['helmet', 'rate limiting', 'input validation', 'JWT']
  },
  dsa: {
    basics: ['arrays & strings', 'linked lists', 'stacks & queues', 'hashmaps'],
    trees: ['binary trees', 'BST', 'tree traversals'],
    graphs: ['BFS', 'DFS', 'shortest path'],
    algorithms: ['sorting (quick, merge)', 'searching (binary)', 'recursion', 'DP basics']
  },
  java: {
    fundamentals: ['data types & variables', 'control flow', 'methods', 'arrays', 'OOP basics'],
    oop: ['classes & objects', 'inheritance', 'polymorphism', 'abstraction', 'interfaces'],
    advanced: ['generics', 'collections framework', 'exception handling', 'lambda & streams'],
    concurrency: ['threads', 'synchronized', 'executor service', 'CompletableFuture']
  },
  python: {
    fundamentals: ['data types', 'functions', 'loops & conditionals', 'list comprehension'],
    oop: ['classes', 'inheritance', 'dunder methods', 'decorators'],
    advanced: ['generators', 'context managers', 'metaclasses', 'asyncio'],
    libraries: ['numpy basics', 'pandas basics', 'testing with pytest']
  }
};

// ========== FALLBACK QUESTION BANK ==========
const QUESTION_BANK = {
  conceptual: (sub, topic) => `How would you explain "${sub}" to a junior developer?`,
  comparison: (sub, topic) => `What are the key trade-offs of "${sub}" compared to its alternatives in ${topic}?`,
  scenario: (sub, topic) => `Describe a real-world scenario where you applied "${sub}" in a ${topic} project.`,
  debugging: (sub, topic) => `What common bugs do developers encounter with "${sub}" and how do you debug them?`,
  best_practice: (sub, topic) => `What best practices do you follow when working with "${sub}" in ${topic}?`,
};

// ========== UTILITIES ==========
function getRoadmapForTopic(topic) {
  const lower = (topic || '').toLowerCase().trim();
  const roadmapObj = TOPIC_ROADMAPS[lower] || {
    fundamentals: ['core fundamentals'],
    intermediate: ['practical concepts'],
    advanced: ['advanced patterns']
  };
  const flattened = [];
  for (const phase of Object.values(roadmapObj)) flattened.push(...phase);
  // Giới hạn số lượng câu hỏi = TOTAL_QUESTIONS, lấy đủ số subtopic đầu tiên
  const limitedFlattened = flattened.slice(0, TOTAL_QUESTIONS);
  return { structured: roadmapObj, flattened: limitedFlattened };
}

function normalizeQuestion(text) {
  if (!text || typeof text !== 'string') return '';
  return text.toLowerCase().replace(/[^\w\s]/g, '').trim();
}

function isValidAiQuestion(text) {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (trimmed.length < 10) return false;
  if (trimmed.length > 300) return false; // câu hỏi dài quá -> dùng fallback
  if (trimmed.toLowerCase().includes('undefined')) return false;
  if (trimmed.toLowerCase().includes('null')) return false;
  return true;
}

function isQuestionTooSimilar(question, history = []) {
  if (!question || !history.length) return false;
  const normalized = normalizeQuestion(question);
  const words = new Set(normalized.split(/\s+/).filter(w => w.length > 3));
  if (words.size === 0) return false;
  return history.some(ex => {
    if (!ex) return false;
    const exWords = new Set(ex.split(/\s+/).filter(w => w.length > 3));
    if (exWords.size === 0) return false;
    const intersection = [...words].filter(w => exWords.has(w)).length;
    return intersection / Math.min(words.size, exWords.size) > 0.6;
  });
}

function getFallbackQuestion(subtopic, questionType, topic) {
  const safeSub = (subtopic && subtopic !== 'undefined' && subtopic !== 'null') ? subtopic : (topic || 'this technology');
  const safeTopic = topic || 'software development';
  const fn = QUESTION_BANK[questionType] || QUESTION_BANK.conceptual;
  return fn(safeSub, safeTopic);
}

function getNextQuestionType(history = []) {
  const types = ['conceptual', 'comparison', 'scenario', 'debugging', 'best_practice'];
  const last = history[history.length - 1];
  const available = types.filter(t => t !== last);
  return available[Math.floor(Math.random() * available.length)];
}

// ========== SINH CÂU HỎI ĐẦU TIÊN ==========
async function generateFirstQuestion(topic, difficulty, firstSubtopic) {
  const safeSub = firstSubtopic || topic;
  const prompt = `You are a technical interviewer. Ask a clear, concise question about "${safeSub}" in ${topic}. Difficulty: ${difficulty}.
- One or two sentences only (max 30 words).
- No preamble, no markdown, no numbering.
- Focus on the core concept.`;

  const response = await groqService.invokeWithRetry([{ role: 'user', content: prompt }]);
  let question = (response || '').trim();
  if (!isValidAiQuestion(question)) {
    return getFallbackQuestion(safeSub, 'conceptual', topic);
  }
  return question;
}

// ========== SINH CÂU HỎI TIẾP THEO (không đào sâu) ==========
async function generateNextQuestion(session) {
  const roadmapFlat = session.roadmapFlattened;
  const questionType = getNextQuestionType(session.questionTypeHistory || []);
  const recentAsked = (session.askedQuestions || []).slice(-3).join('\n');

  // Chọn subtopic tiếp theo chưa được hỏi
  let targetSubtopic = session.currentSubtopic;
  const remaining = roadmapFlat.filter(r => !(session.coveredTopics || []).includes(r));
  if (remaining.length > 0) {
    targetSubtopic = remaining[0];
    session.currentSubtopic = targetSubtopic;
    session.coveredTopics.push(targetSubtopic);
  } else {
    // Nếu đã hỏi hết, lấy lại từ đầu nhưng bỏ subtopic hiện tại
    const resetRemaining = roadmapFlat.filter(r => r !== session.currentSubtopic);
    targetSubtopic = resetRemaining[0] || roadmapFlat[0];
    session.currentSubtopic = targetSubtopic;
    session.coveredTopics = [targetSubtopic];
  }

  const safeSub = targetSubtopic || session.topic;
  const prompt = `You are a technical interviewer. Ask a clear, concise question about "${safeSub}" in ${session.topic}. Difficulty: ${session.difficulty}. Type: ${questionType}.
- One or two sentences only (max 30 words).
- No preamble, no markdown, no numbering.
- Do NOT repeat the essence of these recent questions: ${recentAsked || '(none)'}.`;

  const response = await groqService.invokeWithRetry([{ role: 'user', content: prompt }]);
  let question = (response || '').trim();
  if (!isValidAiQuestion(question) || isQuestionTooSimilar(question, session.askedQuestions)) {
    question = getFallbackQuestion(safeSub, questionType, session.topic);
  }

  session.questionTypeHistory = [...(session.questionTypeHistory || []), questionType];
  session.askedQuestions = [...(session.askedQuestions || []), normalizeQuestion(question)];

  return { question, subtopic: safeSub };
}

// ========== TẠO BÁO CÁO VÀ CHẤM ĐIỂM TỪNG CÂU ==========
async function generateFinalReport(session) {
  // Xây dựng các cặp Q&A từ conversation
  const messages = session.conversation;
  const qaPairs = [];
  for (let i = 0; i < messages.length - 1; i++) {
    const msg = messages[i];
    const next = messages[i + 1];
    if (msg.role === 'assistant' && msg.type === 'question' && next.role === 'user' && next.type === 'answer') {
      qaPairs.push({
        questionNumber: qaPairs.length + 1,
        subtopic: msg.subtopic || session.topic,
        question: msg.content,
        answer: next.content
      });
    }
  }

  const qaText = qaPairs.map(qa => 
    `Q${qa.questionNumber} [${qa.subtopic}]: ${qa.question}\nCandidate answer: ${qa.answer}`
  ).join('\n\n');

  const systemPrompt = `You are a senior technical hiring manager. Evaluate each answer on a scale of 0-10.
Return ONLY valid JSON — no markdown, no backticks, no extra text.`;

  const userPrompt = `Topic: ${session.topic}
Difficulty: ${session.difficulty}

=== FULL INTERVIEW TRANSCRIPT ===
${qaText}
=== END TRANSCRIPT ===

For each question, provide:
- score (0-10 integer)
- verdict: "Excellent|Good|Adequate|Poor|Missing"
- correctConcepts (array of strings)
- missingConcepts (array of strings)
- idealAnswer (brief 2-3 sentences)
- feedback (specific, constructive)

Also provide overall:
- overallScore (0-100, sum of all question scores * 1.25)
- grade (A+|A|B+|B|C+|C|D|F)
- overallEvaluation (Beginner|Junior-ready|Mid-level|Strong|Expert)
- hireRecommendation (Strong Yes|Yes|Maybe|No|Strong No)
- topicBreakdown (object: subtopic -> average score 0-10)
- strengths (array)
- weaknesses (array)
- learningRoadmap (array)
- communicationScore (1-10)
- technicalDepth (1-10)
- problemSolving (1-10)
- confidence (1-10)
- summary (2-3 sentences)

Return JSON structure:
{
  "questionBreakdown": [
    {
      "questionNumber": 1,
      "subtopic": "...",
      "question": "...",
      "score": <0-10>,
      "verdict": "...",
      "correctConcepts": ["..."],
      "missingConcepts": ["..."],
      "idealAnswer": "...",
      "feedback": "..."
    }
  ],
  "overallScore": <0-100>,
  "grade": "...",
  "overallEvaluation": "...",
  "hireRecommendation": "...",
  "topicBreakdown": {},
  "strengths": ["..."],
  "weaknesses": ["..."],
  "learningRoadmap": ["..."],
  "communicationScore": <1-10>,
  "technicalDepth": <1-10>,
  "problemSolving": <1-10>,
  "confidence": <1-10>,
  "summary": "..."
}`;

  let report;
  try {
    const response = await groqService.invokeWithRetry([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    report = JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('[generateFinalReport] error:', err.message);
    // Fallback report
    report = {
      questionBreakdown: qaPairs.map((qa, i) => ({
        questionNumber: i + 1,
        subtopic: qa.subtopic,
        question: qa.question,
        score: 5,
        verdict: 'Adequate',
        correctConcepts: [],
        missingConcepts: [],
        idealAnswer: 'Not available.',
        feedback: 'Could not evaluate automatically.'
      })),
      overallScore: 50,
      grade: 'C',
      overallEvaluation: 'Needs improvement',
      hireRecommendation: 'No',
      topicBreakdown: {},
      strengths: [],
      weaknesses: ['Could not fully evaluate'],
      learningRoadmap: ['Review fundamentals'],
      communicationScore: 5,
      technicalDepth: 5,
      problemSolving: 5,
      confidence: 5,
      summary: 'The interview could not be fully scored automatically. Please review manually.'
    };
  }

  // Cập nhật điểm số vào từng message trong conversation
  for (const q of report.questionBreakdown) {
    // Tìm câu hỏi thứ q.questionNumber trong conversation
    let qIndex = -1;
    let aIndex = -1;
    let count = 0;
    for (let i = 0; i < session.conversation.length; i++) {
      const msg = session.conversation[i];
      if (msg.role === 'assistant' && msg.type === 'question') {
        count++;
        if (count === q.questionNumber) {
          qIndex = i;
          aIndex = i + 1;
          break;
        }
      }
    }
    if (qIndex !== -1 && aIndex !== -1 && session.conversation[aIndex]?.role === 'user') {
      session.conversation[qIndex].score = q.score;
      session.conversation[qIndex].strengths = q.correctConcepts || [];
      session.conversation[qIndex].weaknesses = q.missingConcepts || [];
      session.conversation[aIndex].score = q.score;
      session.conversation[aIndex].strengths = q.correctConcepts || [];
      session.conversation[aIndex].weaknesses = q.missingConcepts || [];
      session.conversation[aIndex].missingConcepts = q.missingConcepts || [];
    }
  }

  // Tính finalScore = trung bình cộng các score (làm tròn 1 chữ số)
  const scores = report.questionBreakdown.map(q => q.score).filter(s => typeof s === 'number');
  const avgScore = scores.length ? scores.reduce((a,b) => a + b, 0) / scores.length : 5;
  const finalScore = Math.min(10, Math.max(0, parseFloat(avgScore.toFixed(1))));

  // Lưu các trường khác
  session.finalScore = finalScore;
  session.summary = {
    overallScore: report.overallScore,
    grade: report.grade,
    overallEvaluation: report.overallEvaluation,
    hireRecommendation: report.hireRecommendation,
    questionBreakdown: report.questionBreakdown,
    topicBreakdown: report.topicBreakdown,
    strengths: report.strengths,
    weaknesses: report.weaknesses,
    learningRoadmap: report.learningRoadmap,
    communicationScore: report.communicationScore,
    technicalDepth: report.technicalDepth,
    problemSolving: report.problemSolving,
    confidence: report.confidence,
    summary: report.summary
  };

  return { report, finalScore };
}

// ========== BẮT ĐẦU PHIÊN PHỎNG VẤN ==========
async function startSession(userId, topic, difficulty = 'medium', interviewStyle = 'friendly', mode = 'adaptive') {
  if (!topic || !topic.trim()) throw new Error('Topic is required.');

  const { structured, flattened } = getRoadmapForTopic(topic);
  const firstSubtopic = flattened[0] || topic;
  const firstQuestion = await generateFirstQuestion(topic, difficulty, firstSubtopic);

  const session = new AdaptiveSession({
    userId,
    topic: topic.trim(),
    difficulty,
    interviewStyle,
    mode,
    status: 'active',
    conversation: [{
      role: 'assistant',
      type: 'question',
      content: firstQuestion,
      subtopic: firstSubtopic,
      createdAt: new Date()
    }],
    coveredTopics: [firstSubtopic],
    currentSubtopic: firstSubtopic,
    roadmapStructured: structured,
    roadmapFlattened: flattened,
    askedQuestions: [normalizeQuestion(firstQuestion)],
    questionTypeHistory: ['conceptual'],
    startedAt: new Date()
  });

  await session.save();
  return {
    sessionId: session._id,
    firstQuestion,
    progress: { current: 1, total: TOTAL_QUESTIONS }
  };
}

// ========== XỬ LÝ CÂU TRẢ LỜI ==========
async function processAnswer(sessionId, userId, answer) {
  const session = await AdaptiveSession.findOne({ _id: sessionId, userId });
  if (!session) throw new Error('Session not found');
  if (session.status !== 'active') throw new Error('Interview already completed');

  // Khởi tạo các mảng nếu thiếu
  if (!Array.isArray(session.askedQuestions)) session.askedQuestions = [];
  if (!Array.isArray(session.questionTypeHistory)) session.questionTypeHistory = [];
  if (!Array.isArray(session.coveredTopics)) session.coveredTopics = [];
  if (!Array.isArray(session.roadmapFlattened) || session.roadmapFlattened.length === 0) {
    const roadmap = getRoadmapForTopic(session.topic);
    session.roadmapFlattened = roadmap.flattened;
    session.roadmapStructured = roadmap.structured;
  }
  if (!session.currentSubtopic) session.currentSubtopic = session.roadmapFlattened[0] || session.topic;

  // Lưu câu trả lời
  session.conversation.push({
    role: 'user',
    type: 'answer',
    content: answer || '',
    createdAt: new Date()
  });

  const answersGiven = session.conversation.filter(m => m.role === 'user' && m.type === 'answer').length;
  const questionsAsked = session.conversation.filter(m => m.role === 'assistant' && m.type === 'question').length;

  // Kiểm tra đủ số câu hỏi
  if (answersGiven >= TOTAL_QUESTIONS) {
    session.status = 'completed';
    session.endedAt = new Date();

    const { report, finalScore } = await generateFinalReport(session);
    session.finalScore = finalScore;
    await session.save();

    return {
      isFinished: true,
      sessionId: session._id,
      finalScore: session.finalScore,
      summary: session.summary,
      conversation: session.conversation.map(msg => ({
        role: msg.role,
        type: msg.type,
        content: msg.content,
        subtopic: msg.subtopic || null,
        score: msg.score || null,
        strengths: msg.strengths || [],
        weaknesses: msg.weaknesses || [],
        missingConcepts: msg.missingConcepts || [],
        createdAt: msg.createdAt
      }))
    };
  }

  // Chưa đủ -> hỏi câu tiếp theo
  const { question: nextQuestion, subtopic: nextSubtopic } = await generateNextQuestion(session);

  session.conversation.push({
    role: 'assistant',
    type: 'question',
    content: nextQuestion,
    subtopic: nextSubtopic,
    createdAt: new Date()
  });
  await session.save();

  return {
    isFinished: false,
    sessionId: session._id,
    nextQuestion,
    currentSubtopic: nextSubtopic,
    progress: { current: questionsAsked + 1, total: TOTAL_QUESTIONS }
  };
}

module.exports = { startSession, processAnswer };