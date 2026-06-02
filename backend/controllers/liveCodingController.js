const LiveCodingSession = require('../models/LiveCodingSession');
const codeEvaluationService = require('../services/liveCoding/codeEvaluationService');
const llmProvider = require('../services/liveCoding/llmProvider');
const sessionStore = require('../services/liveCoding/sessionStore');
const { v4: uuidv4 } = require('uuid');

// ========== STATIC DATA ==========
const languageDomains = {
  java: ['OOP', 'DSA', 'Concurrency', 'Collections', 'Streams'],
  python: ['OOP', 'DSA', 'Functional Programming', 'Decorators', 'Generators'],
  javascript: ['OOP', 'Functional Programming', 'Async', 'DOM Manipulation', 'Closures'],
  cpp: ['OOP', 'DSA', 'Memory Management', 'STL', 'Templates'],
  csharp: ['OOP', 'DSA', 'LINQ', 'Async', 'Delegates'],
  go: ['Concurrency', 'Interfaces', 'DSA', 'Error Handling', 'Packages'],
};

const domainTopics = {
  java: {
    OOP: ['Inheritance', 'Polymorphism', 'Encapsulation', 'Abstraction', 'Interfaces'],
    DSA: ['Arrays', 'Linked Lists', 'Stacks', 'Queues', 'Trees', 'Graphs', 'Sorting', 'Searching'],
    Concurrency: ['Threads', 'Runnable', 'Synchronized', 'Locks', 'Executors'],
    Collections: ['List', 'Set', 'Map', 'Queue', 'Iterators'],
    Streams: ['Stream API', 'Lambdas', 'Filter/Map/Reduce', 'Collectors'],
  },
  python: {
    OOP: ['Classes', 'Inheritance', 'Polymorphism', 'Encapsulation', 'Magic Methods'],
    DSA: ['Lists', 'Dictionaries', 'Sets', 'Tuples', 'Sorting', 'Searching'],
    'Functional Programming': ['Lambda', 'Map', 'Filter', 'Reduce', 'Decorators'],
    Decorators: ['Function Decorators', 'Class Decorators', 'Functools'],
    Generators: ['Yield', 'Generator Expressions', 'Lazy Evaluation'],
  },
  javascript: {
    OOP: ['Prototypes', 'Classes', 'Inheritance', 'Polymorphism', 'Encapsulation'],
    'Functional Programming': ['Higher-order Functions', 'Closures', 'Pure Functions', 'Currying'],
    Async: ['Callbacks', 'Promises', 'Async/Await', 'Event Loop'],
    'DOM Manipulation': ['Selectors', 'Events', 'Dynamic Rendering'],
    Closures: ['Lexical Scoping', 'Private Variables', 'Modules'],
  },
};

function getDomainsForLanguage(language) {
  const lang = language.toLowerCase();
  return languageDomains[lang] || ['Basic', 'Intermediate', 'Advanced'];
}

function getTopicsForDomain(language, domain) {
  const lang = language.toLowerCase();
  const domains = domainTopics[lang];
  if (domains && domains[domain]) return domains[domain];
  return ['Basic Syntax', 'Control Flow', 'Functions', 'Error Handling'];
}

// ============== HELPER: Loại bỏ ellipsis và không truncate ==============
function cleanText(text) {
  if (!text) return '';
  return text.replace(/\.\.\./g, '.');
}

// ===============================
// Lấy danh sách domains (không cần session)
// ===============================
exports.getDomainsByLanguage = async (req, res) => {
  try {
    const { language } = req.query;
    if (!language) return res.status(400).json({ error: 'Missing language' });
    const domains = getDomainsForLanguage(language);
    res.json({ domains });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ===============================
// Lấy danh sách topics (không cần session)
// ===============================
exports.getTopicsByLanguageAndDomain = async (req, res) => {
  try {
    const { language, domain } = req.query;
    if (!language || !domain) return res.status(400).json({ error: 'Missing language or domain' });
    const topics = getTopicsForDomain(language, domain);
    res.json({ topics });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ===============================
// BẮT ĐẦU INTERVIEW (tạo session tạm, không lưu DB)
// ===============================
exports.startInterview = async (req, res) => {
  try {
    const { language, domain, topicName, difficulty } = req.body;
    if (!language || !domain || !topicName || !difficulty) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const sessionId = uuidv4();

    // Sinh câu hỏi code từ AI (đa dạng)
    const question = await llmProvider.generateCodeQuestion(language, domain, topicName, difficulty);

    const sessionData = {
      language,
      domain,
      topic: topicName,
      difficulty,
      currentQuestion: {
        ...question,
        problemStatement: question.problemStatement || question.description || 'Problem statement not provided',
        type: 'code',
        answered: false,
      },
      explainAnswers: [], // RAM only
      explainCount: 0, // RAM only
      currentCodeSubmission: null, // RAM only
      waitingForNextCode: false, // RAM only
      createdAt: new Date(),
    };

    sessionStore.setSession(sessionId, sessionData);

    res.status(201).json({
      sessionId,
      question: sessionData.currentQuestion,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// ===============================
// LẤY CÂU HỎI HIỆN TẠI
// ===============================
exports.getCurrentQuestion = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = sessionStore.getSession(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found or expired' });
    res.json({ currentQuestion: session.currentQuestion });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ===============================
// SUBMIT CODE
// ===============================
exports.submitCode = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { code } = req.body;

    const session = sessionStore.getSession(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found or expired' });
    if (session.currentQuestion.type !== 'code') {
      return res.status(400).json({ error: 'Not a code question' });
    }
    if (session.currentQuestion.answered === true) {
      return res.status(400).json({ error: 'This question has already been answered correctly' });
    }

    // Đánh giá code
    const evaluation = await llmProvider.evaluateCodeSubmission(
      session.language,
      code,
      session.currentQuestion.problemStatement,
      session.currentQuestion.exampleOutput || ''
    );

    if (!evaluation.correct) {
      return res.json({ correct: false, feedback: cleanText(evaluation.feedback) });
    }

    // Code đúng
    session.currentQuestion.answered = true;
    session.currentCodeSubmission = {
      code,
      question: session.currentQuestion,
      problemStatement: session.currentQuestion.problemStatement,
      submittedAt: new Date(),
    };
    session.explainAnswers = [];
    session.explainCount = 0;

    // Sinh câu hỏi giải thích đầu tiên
    const explainQuestion = await llmProvider.generateExplanationQuestion(
      session.language,
      code,
      session.currentQuestion,
      session.difficulty
    );
    session.currentQuestion = {
      ...explainQuestion,
      type: 'explain',
      answered: false,
    };

    sessionStore.setSession(sessionId, session);

    res.json({
      correct: true,
      feedback: cleanText(evaluation.feedback || 'Correct! Now explain your code.'),
      nextQuestion: session.currentQuestion,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// ===============================
// SUBMIT EXPLANATION
// ===============================
exports.submitExplanation = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { answer } = req.body;
    const MAX_EXPLAIN = 3;

    const session = sessionStore.getSession(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found or expired' });
    if (session.currentQuestion.type !== 'explain') {
      return res.status(400).json({ error: 'Not an explanation question' });
    }
    if (session.currentQuestion.answered === true) {
      return res.status(400).json({ error: 'This question has already been answered' });
    }

    // Đánh giá câu trả lời
    let evalResult;
    try {
      evalResult = await llmProvider.evaluateExplanation(session.language, answer, session.currentQuestion);
    } catch (err) {
      console.error('AI evaluateExplanation error:', err);
      return res.status(503).json({ error: 'AI evaluation failed, please try again later' });
    }
    if (!evalResult || typeof evalResult.correct !== 'boolean') {
      return res.status(503).json({ error: 'AI evaluation returned invalid data, please try again' });
    }

    // Lưu câu trả lời vào RAM (sessionStore)
    session.explainAnswers.push({
      question: session.currentQuestion.question,
      answer,
      isCorrect: evalResult.correct,
      feedback: cleanText(evalResult.feedback),
      modelAnswer: cleanText(evalResult.modelAnswer),
    });
    session.explainCount++;
    session.currentQuestion.answered = true;

    // Chưa đủ 3 câu -> sinh câu tiếp theo
    if (session.explainCount < MAX_EXPLAIN) {
      let nextExplain;
      try {
        nextExplain = await llmProvider.generateNextExplanationQuestion(
          session.language,
          session.currentCodeSubmission.code,
          answer,
          session.currentQuestion,
          session.explainCount,
          session.difficulty
        );
      } catch (err) {
        console.error('AI generateNextExplanationQuestion error:', err);
        nextExplain = {
          type: 'explain',
          question: 'Explain a different aspect of your code.',
        };
      }
      session.currentQuestion = { ...nextExplain, type: 'explain', answered: false };
      sessionStore.setSession(sessionId, session);

      return res.json({
        correct: evalResult.correct,
        feedback: cleanText(evalResult.feedback),
        modelAnswer: cleanText(evalResult.modelAnswer),
        nextQuestion: session.currentQuestion,
      });
    }

    // Đã đủ 3 câu -> final evaluation
    let finalEvaluation;
    try {
      finalEvaluation = await llmProvider.evaluateCodeAndExplanations(
        session.language,
        session.currentCodeSubmission?.code || '',
        session.currentCodeSubmission?.problemStatement || '',
        session.explainAnswers
      );
    } catch (err) {
      console.error('AI evaluateCodeAndExplanations error:', err);
      return res.status(503).json({ error: 'AI final evaluation failed, please try again later.' });
    }
    if (!finalEvaluation || typeof finalEvaluation.summary !== 'string') {
      return res.status(503).json({ error: 'AI final evaluation returned invalid data.' });
    }

    // LƯU VÀO DATABASE - chỉ những dữ liệu cần thiết
    const newSessionRecord = new LiveCodingSession({
      id: sessionId,
      language: session.language,
      domain: session.domain,
      topic: session.topic,
      difficulty: session.difficulty,
      codeHistory: [
        {
          code: session.currentCodeSubmission.code,
          problemStatement: session.currentCodeSubmission.problemStatement,
          submittedAt: session.currentCodeSubmission.submittedAt,
          explainAnswers: session.explainAnswers,
          evaluation: {
            summary: cleanText(finalEvaluation.summary),
            feedback: cleanText(finalEvaluation.feedback),
            strengths: (finalEvaluation.strengths || []).map(s => cleanText(s)),
            weaknesses: (finalEvaluation.weaknesses || []).map(w => cleanText(w)),
          },
        },
      ],
      createdAt: session.createdAt,
    });
    await newSessionRecord.save();

    // RESET session (RAM) để chờ câu code tiếp theo
    session.waitingForNextCode = true;
    session.currentQuestion = null;
    session.explainAnswers = [];
    session.explainCount = 0;
    session.currentCodeSubmission = null;
    sessionStore.setSession(sessionId, session);

    res.json({
      correct: evalResult.correct,
      feedback: cleanText(evalResult.feedback),
      modelAnswer: cleanText(evalResult.modelAnswer),
      nextQuestion: null,
      completedForCurrentCode: true,
      evaluation: {
        summary: cleanText(finalEvaluation.summary),
        feedback: cleanText(finalEvaluation.feedback),
        strengths: (finalEvaluation.strengths || []).map(s => cleanText(s)),
        weaknesses: (finalEvaluation.weaknesses || []).map(w => cleanText(w)),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// ===============================
// NEXT CODE QUESTION
// ===============================
exports.nextCodeQuestion = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = sessionStore.getSession(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found or expired' });
    if (!session.waitingForNextCode) {
      return res.status(400).json({ error: 'Current round not completed yet' });
    }

    session.waitingForNextCode = false;
    session.explainAnswers = [];
    session.explainCount = 0;
    session.currentCodeSubmission = null;

    const newCodeQuestion = await llmProvider.generateCodeQuestion(
      session.language,
      session.domain,
      session.topic,
      session.difficulty
    );
    session.currentQuestion = {
      ...newCodeQuestion,
      problemStatement: newCodeQuestion.problemStatement || newCodeQuestion.description || 'Problem statement not provided',
      type: 'code',
      answered: false,
    };
    sessionStore.setSession(sessionId, session);

    res.json({ nextQuestion: session.currentQuestion });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// ===============================
// LẤY ĐÁNH GIÁ CUỐI CÙNG (từ DB)
// ===============================
exports.getLastEvaluation = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await LiveCodingSession.findOne({ id: sessionId });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const lastEntry = session.codeHistory[session.codeHistory.length - 1];
    if (!lastEntry || !lastEntry.evaluation) {
      return res.json({ evaluation: null, message: 'No evaluation yet' });
    }
    res.json({ evaluation: lastEntry.evaluation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ===============================
// LẤY TOÀN BỘ CODE HISTORY (từ DB)
// ===============================
exports.getSessionHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await LiveCodingSession.findOne({ id: sessionId });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    res.json({
      sessionId: session.id,
      language: session.language,
      domain: session.domain,
      topic: session.topic,
      difficulty: session.difficulty,
      codeHistory: session.codeHistory,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};