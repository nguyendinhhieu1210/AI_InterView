const { v4: uuidv4 } = require('uuid');
const LiveCodingSession = require('../../models/LiveCodingSession');
const User = require('../../models/User');
const codeEvaluationService = require('../liveCoding/codeEvaluationService');
const llmProvider = require('../liveCoding/llmProvider');
const sessionStore = require('../liveCoding/sessionStore');

// ========== LANGUAGE MAPPING ==========
const LANGUAGE_MAPPING = {
  java: 'java',
  Java: 'java',
  python: 'python',
  py: 'python',
  Python: 'python',
  javascript: 'javascript',
  js: 'javascript',
  JavaScript: 'javascript',
  typescript: 'javascript',
  ts: 'javascript',
  TypeScript: 'javascript',
  cpp: 'cpp',
  'c++': 'cpp',
  'C++': 'cpp',
  Cpp: 'cpp',
  csharp: 'csharp',
  'c#': 'csharp',
  'C#': 'csharp',
  CSharp: 'csharp',
  go: 'go',
  golang: 'go',
  Go: 'go',
};

// ========== STATIC DATA ==========
const languageDomains = {
  java: ['OOP', 'DSA', 'Concurrency', 'Collections', 'Streams'],
  python: ['OOP', 'DSA', 'Functional Programming', 'Decorators', 'Generators'],
  javascript: [
    'OOP',
    'Functional Programming',
    'Async',
    'DOM Manipulation',
    'Closures',
  ],
  cpp: [
    'OOP',
    'DSA',
    'Memory Management',
    'STL',
    'Templates',
    'Smart Pointers',
    'Move Semantics',
  ],
  csharp: [
    'OOP',
    'DSA',
    'LINQ',
    'Async',
    'Delegates',
    'Events',
    'Properties',
    'Indexers',
  ],
  go: [
    'Concurrency',
    'Interfaces',
    'DSA',
    'Error Handling',
    'Packages',
    'Goroutines',
    'Channels',
  ],
};

const domainTopics = {
  java: {
    OOP: [
      'Inheritance',
      'Polymorphism',
      'Encapsulation',
      'Abstraction',
      'Interfaces',
    ],
    DSA: [
      'Arrays',
      'Linked Lists',
      'Stacks',
      'Queues',
      'Trees',
      'Graphs',
      'Sorting',
      'Searching',
    ],
    Concurrency: [
      'Threads',
      'Runnable',
      'Synchronized',
      'Locks',
      'Executors',
      'CompletableFuture',
    ],
    Collections: [
      'List',
      'Set',
      'Map',
      'Queue',
      'Iterators',
      'Comparable',
      'Comparator',
    ],
    Streams: [
      'Stream API',
      'Lambdas',
      'Filter/Map/Reduce',
      'Collectors',
      'Optional',
    ],
  },
  python: {
    OOP: [
      'Classes',
      'Inheritance',
      'Polymorphism',
      'Encapsulation',
      'Magic Methods',
      'Property Decorators',
    ],
    DSA: [
      'Lists',
      'Dictionaries',
      'Sets',
      'Tuples',
      'Sorting',
      'Searching',
      'List Comprehensions',
    ],
    'Functional Programming': [
      'Lambda',
      'Map',
      'Filter',
      'Reduce',
      'Decorators',
      'Functools',
    ],
    Decorators: [
      'Function Decorators',
      'Class Decorators',
      'Functools',
      'Property',
    ],
    Generators: [
      'Yield',
      'Generator Expressions',
      'Lazy Evaluation',
      'Iterators',
    ],
  },
  javascript: {
    OOP: [
      'Prototypes',
      'Classes',
      'Inheritance',
      'Polymorphism',
      'Encapsulation',
      'Object.create',
    ],
    'Functional Programming': [
      'Higher-order Functions',
      'Closures',
      'Pure Functions',
      'Currying',
      'Composition',
    ],
    Async: ['Callbacks', 'Promises', 'Async/Await', 'Event Loop', 'Fetch API'],
    'DOM Manipulation': [
      'Selectors',
      'Events',
      'Dynamic Rendering',
      'Element Creation',
      'Event Delegation',
    ],
    Closures: ['Lexical Scoping', 'Private Variables', 'Modules', 'IIFE'],
  },
  cpp: {
    OOP: [
      'Classes',
      'Inheritance',
      'Polymorphism',
      'Encapsulation',
      'Virtual Functions',
      'Abstract Classes',
    ],
    DSA: [
      'Arrays',
      'Vectors',
      'Linked Lists',
      'Stacks',
      'Queues',
      'Trees',
      'Sorting',
      'Searching',
      'Maps',
    ],
    'Memory Management': [
      'Pointers',
      'References',
      'Dynamic Allocation',
      'Smart Pointers',
      'RAII',
    ],
    STL: ['Vector', 'List', 'Map', 'Set', 'Algorithm', 'Iterator', 'String'],
    Templates: [
      'Function Templates',
      'Class Templates',
      'Template Specialization',
      'Variadic Templates',
    ],
    'Smart Pointers': [
      'unique_ptr',
      'shared_ptr',
      'weak_ptr',
      'make_unique',
      'make_shared',
    ],
    'Move Semantics': [
      'Move Constructor',
      'Move Assignment',
      'std::move',
      'Rvalue References',
    ],
  },
  csharp: {
    OOP: [
      'Classes',
      'Inheritance',
      'Polymorphism',
      'Encapsulation',
      'Abstract Classes',
      'Interfaces',
      'Records',
    ],
    DSA: [
      'Arrays',
      'Lists',
      'Dictionaries',
      'Stack',
      'Queue',
      'HashSet',
      'LinkedList',
      'Sorting',
      'Searching',
    ],
    LINQ: [
      'Query Syntax',
      'Method Syntax',
      'Where',
      'Select',
      'GroupBy',
      'Join',
      'OrderBy',
    ],
    Async: [
      'async/await',
      'Task',
      'Task<T>',
      'CancellationToken',
      'WhenAll',
      'WhenAny',
    ],
    Delegates: [
      'Func',
      'Action',
      'Predicate',
      'Anonymous Methods',
      'Lambda Expressions',
    ],
    Events: ['Event Handlers', 'EventArgs', 'Custom Events', 'Event Accessors'],
    Properties: [
      'Auto Properties',
      'Computed Properties',
      'Required Properties',
      'Init Only',
    ],
    Indexers: ['Indexers', 'Overload Indexers', 'Multi-dimensional Indexers'],
  },
  go: {
    Concurrency: [
      'Goroutines',
      'Channels',
      'Select',
      'WaitGroups',
      'Mutex',
      'Atomic Operations',
    ],
    Interfaces: [
      'Empty Interface',
      'Type Assertions',
      'Type Switches',
      'Interface Embedding',
    ],
    DSA: [
      'Slices',
      'Maps',
      'Structs',
      'Arrays',
      'Linked Lists',
      'Trees',
      'Sorting',
      'Searching',
    ],
    'Error Handling': [
      'Error Interface',
      'Custom Errors',
      'Panic/Recover',
      'Error Wrapping',
      'Defer',
    ],
    Packages: [
      'Package Creation',
      'Exported/Private',
      'Init Functions',
      'Package Aliases',
      'Vendor',
    ],
    Goroutines: [
      'go keyword',
      'Channel Buffering',
      'Worker Pools',
      'Rate Limiting',
      'Context',
    ],
    Channels: [
      'Unbuffered',
      'Buffered',
      'Directional',
      'Channel Closing',
      'Range over Channels',
    ],
  },
};

// ========== HELPERS ==========
const normalizeLanguage = (language) => {
  const normalized = LANGUAGE_MAPPING[language?.toLowerCase()];
  return normalized || 'javascript';
};

const getDomainsForLanguage = (language) => {
  const normalized = normalizeLanguage(language);
  return languageDomains[normalized] || ['Basic', 'Intermediate', 'Advanced'];
};

const getTopicsForDomain = (language, domain) => {
  const normalized = normalizeLanguage(language);
  const domains = domainTopics[normalized];
  if (domains && domains[domain]) return domains[domain];
  const fallbacks = {
    OOP: ['Classes', 'Inheritance', 'Polymorphism', 'Encapsulation'],
    DSA: ['Arrays', 'Lists', 'Stacks', 'Queues', 'Sorting', 'Searching'],
    Basic: ['Variables', 'Functions', 'Loops', 'Conditionals'],
  };
  return (
    fallbacks[domain] || [
      'Basic Syntax',
      'Control Flow',
      'Functions',
      'Error Handling',
    ]
  );
};

const cleanText = (text) => {
  if (!text) return '';
  return text.replace(/\.\.\./g, '.');
};

// Service class
class LiveCodingService {
  // ========== PUBLIC API FOR CONTROLLER ==========

  static getDomains(language) {
    if (!language) throw new Error('Missing language');
    return getDomainsForLanguage(language);
  }

  static getTopics(language, domain) {
    if (!language || !domain) throw new Error('Missing language or domain');
    return getTopicsForDomain(language, domain);
  }

  static async startInterview(
    userId,
    { language, domain, topicName, difficulty }
  ) {
    if (!language || !domain || !topicName || !difficulty) {
      throw new Error('Missing required fields');
    }

    console.log(`\n========== STARTING INTERVIEW ==========`);
    console.log(`Language: ${language}`);
    console.log(`Domain: ${domain}`);
    console.log(`Topic: ${topicName}`);
    console.log(`Difficulty: ${difficulty}`);
    console.log(`=========================================\n`);

    const normalizedLanguage = normalizeLanguage(language);
    const sessionId = uuidv4();

    const question = await llmProvider.generateCodeQuestion(
      normalizedLanguage,
      domain,
      topicName,
      difficulty
    );

    console.log(`\n========== QUESTION GENERATED ==========`);
    console.log(`Problem: ${question.problemStatement?.substring(0, 100)}...`);
    console.log(`Signature: ${question.functionSignature}`);
    console.log(`Example Input: ${question.exampleInput}`);
    console.log(`Example Output: ${question.exampleOutput}`);
    console.log(`Expected Type: ${question.expectedType}`);
    console.log(`=========================================\n`);

    const sessionData = {
      userId,
      language: normalizedLanguage,
      originalLanguage: language,
      domain,
      topic: topicName,
      difficulty,
      currentQuestion: {
        ...question,
        problemStatement:
          question.problemStatement ||
          question.description ||
          'Problem statement not provided',
        type: 'code',
        answered: false,
      },
      explainAnswers: [],
      explainCount: 0,
      currentCodeSubmission: null,
      waitingForNextCode: false,
      createdAt: new Date(),
    };

    sessionStore.setSession(sessionId, sessionData);
    return { sessionId, question: sessionData.currentQuestion };
  }

  static getCurrentQuestion(sessionId, userId) {
    const session = this._getSessionWithOwnershipCheck(sessionId, userId);
    if (!session) throw new Error('Session not found or expired');
    return session.currentQuestion;
  }

  static async submitCode(sessionId, userId, code) {
    const session = this._getSessionWithOwnershipCheck(sessionId, userId);
    if (!session) throw new Error('Session not found or expired');
    if (session.currentQuestion.type !== 'code')
      throw new Error('Not a code question');
    if (session.currentQuestion.answered === true) {
      throw new Error('This question has already been answered correctly');
    }

    // Đánh giá code
    const evaluation = await llmProvider.evaluateCodeSubmission(
      session.language,
      code,
      session.currentQuestion.problemStatement,
      session.currentQuestion.exampleOutput || ''
    );

    if (!evaluation.correct) {
      return {
        correct: false,
        feedback: cleanText(evaluation.feedback),
      };
    }

    // Lưu code đúng
    session.currentQuestion.answered = true;
    session.currentCodeSubmission = {
      code,
      question: session.currentQuestion,
      problemStatement: session.currentQuestion.problemStatement,
      submittedAt: new Date(),
    };
    session.explainAnswers = [];
    session.explainCount = 0;
    session.askedLineNumbers = [];

    // Tạo câu hỏi giải thích tiếp theo
    const explainQuestion = await llmProvider.generateExplanationQuestion(
      session.language,
      code,
      session.currentQuestion,
      session.difficulty,
      session.askedLineNumbers
    );

    session.currentQuestion = {
      ...explainQuestion,
      type: 'explain',
      answered: false,
    };
    sessionStore.setSession(sessionId, session);

    return {
      correct: true,
      feedback: cleanText(
        evaluation.feedback || 'Correct! Now explain your code.'
      ),
      nextQuestion: session.currentQuestion,
    };
  }

  static async submitExplanation(sessionId, userId, answer) {
    const MAX_EXPLAIN = 3;
    const session = this._getSessionWithOwnershipCheck(sessionId, userId);
    if (!session) throw new Error('Session not found or expired');
    if (session.currentQuestion.type !== 'explain')
      throw new Error('Not an explanation question');
    if (session.currentQuestion.answered === true) {
      throw new Error('This question has already been answered');
    }

    if (!session.askedLineNumbers) session.askedLineNumbers = [];

    // Đánh giá câu trả lời
    let evalResult;
    try {
      evalResult = await llmProvider.evaluateExplanation(
        session.language,
        answer,
        session.currentQuestion
      );
    } catch (err) {
      console.error('AI evaluateExplanation error:', err);
      throw new Error('AI evaluation failed, please try again later');
    }

    if (!evalResult || typeof evalResult.correct !== 'boolean') {
      throw new Error('AI evaluation returned invalid data, please try again');
    }

    // Lưu line number đã hỏi
    const currentLineNumber = session.currentQuestion.lineNumber;
    if (
      currentLineNumber &&
      !session.askedLineNumbers.includes(currentLineNumber)
    ) {
      session.askedLineNumbers.push(currentLineNumber);
    }

    console.log(`[DEBUG] Asked lines: ${session.askedLineNumbers.join(', ')}`);

    session.explainAnswers.push({
      question: session.currentQuestion.question,
      answer,
      isCorrect: evalResult.correct,
      feedback: cleanText(evalResult.feedback),
      modelAnswer: cleanText(evalResult.modelAnswer),
      lineNumber: currentLineNumber,
    });
    session.explainCount++;
    session.currentQuestion.answered = true;

    // Nếu chưa đủ số lần giải thích, tạo câu hỏi tiếp theo
    if (session.explainCount < MAX_EXPLAIN) {
      let nextExplain;
      try {
        nextExplain = await llmProvider.generateNextExplanationQuestion(
          session.language,
          session.currentCodeSubmission.code,
          answer,
          session.currentQuestion,
          session.explainCount,
          session.difficulty,
          session.askedLineNumbers
        );
      } catch (err) {
        console.error('AI generateNextExplanationQuestion error:', err);
        nextExplain = null;
      }

      if (nextExplain && nextExplain.lineNumber) {
        session.currentQuestion = {
          ...nextExplain,
          type: 'explain',
          answered: false,
        };
        sessionStore.setSession(sessionId, session);
        return {
          correct: evalResult.correct,
          feedback: cleanText(evalResult.feedback),
          modelAnswer: cleanText(evalResult.modelAnswer),
          nextQuestion: session.currentQuestion,
        };
      } else {
        // Nếu không tạo được, kết thúc vòng
        session.explainCount = MAX_EXPLAIN;
      }
    }

    // Đánh giá tổng kết
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
      throw new Error('AI final evaluation failed, please try again later.');
    }

    if (!finalEvaluation || typeof finalEvaluation.summary !== 'string') {
      throw new Error('AI final evaluation returned invalid data.');
    }

    // Lưu vào DB
    const historyEntry = {
      code: session.currentCodeSubmission.code,
      problemStatement: session.currentCodeSubmission.problemStatement,
      submittedAt: session.currentCodeSubmission.submittedAt,
      explainAnswers: session.explainAnswers,
      evaluation: {
        summary: cleanText(finalEvaluation.summary),
        feedback: cleanText(finalEvaluation.feedback),
        strengths: (finalEvaluation.strengths || []).map((s) => cleanText(s)),
        weaknesses: (finalEvaluation.weaknesses || []).map((w) => cleanText(w)),
      },
    };

    await LiveCodingSession.findOneAndUpdate(
      { id: sessionId, userId },
      {
        $setOnInsert: {
          userId,
          id: sessionId,
          language: session.language,
          domain: session.domain,
          topic: session.topic,
          difficulty: session.difficulty,
          createdAt: session.createdAt,
        },
        $push: { codeHistory: historyEntry },
        $set: { updatedAt: new Date() },
      },
      { upsert: true, new: true }
    );

    // Reset trạng thái session cho code tiếp theo
    session.waitingForNextCode = true;
    session.currentQuestion = null;
    session.explainAnswers = [];
    session.explainCount = 0;
    session.currentCodeSubmission = null;
    session.askedLineNumbers = [];
    sessionStore.setSession(sessionId, session);

    return {
      correct: evalResult.correct,
      feedback: cleanText(evalResult.feedback),
      modelAnswer: cleanText(evalResult.modelAnswer),
      nextQuestion: null,
      completedForCurrentCode: true,
      evaluation: {
        summary: cleanText(finalEvaluation.summary),
        feedback: cleanText(finalEvaluation.feedback),
        strengths: (finalEvaluation.strengths || []).map((s) => cleanText(s)),
        weaknesses: (finalEvaluation.weaknesses || []).map((w) => cleanText(w)),
      },
    };
  }

  static async nextCodeQuestion(sessionId, userId) {
    const session = this._getSessionWithOwnershipCheck(sessionId, userId);
    if (!session) throw new Error('Session not found or expired');
    if (!session.waitingForNextCode) {
      throw new Error('Current round not completed yet');
    }

    session.waitingForNextCode = false;
    session.explainAnswers = [];
    session.explainCount = 0;
    session.currentCodeSubmission = null;
    session.askedLineNumbers = [];

    const newCodeQuestion = await llmProvider.generateCodeQuestion(
      session.language,
      session.domain,
      session.topic,
      session.difficulty,
      [],
      { singleCall: true }
    );

    const codeWithLines = llmProvider.formatCodeWithLineNumbers(
      newCodeQuestion.functionSignature || newCodeQuestion.problemStatement
    );

    session.currentQuestion = {
      ...newCodeQuestion,
      problemStatement:
        newCodeQuestion.problemStatement ||
        newCodeQuestion.description ||
        'Problem statement not provided',
      codeWithLines: codeWithLines,
      type: 'code',
      answered: false,
    };
    sessionStore.setSession(sessionId, session);

    return session.currentQuestion;
  }

  static async getLastEvaluation(sessionId, userId) {
    const session = await LiveCodingSession.findOne({ id: sessionId, userId });
    if (!session) throw new Error('Session not found');
    const lastEntry = session.codeHistory[session.codeHistory.length - 1];
    if (!lastEntry || !lastEntry.evaluation) {
      return null;
    }
    return lastEntry.evaluation;
  }

  static async getSessionHistory(sessionId, userId) {
    const session = await LiveCodingSession.findOne({ id: sessionId, userId });
    if (!session) throw new Error('Session not found');
    return {
      sessionId: session.id,
      language: session.language,
      domain: session.domain,
      topic: session.topic,
      difficulty: session.difficulty,
      codeHistory: session.codeHistory,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  }

  static async getSessionList(userId) {
    const sessions = await LiveCodingSession.find({ userId })
      .sort({ createdAt: -1 })
      .lean();
    return sessions.map((session) => ({
      id: session.id,
      language: session.language,
      domain: session.domain,
      topic: session.topic,
      difficulty: session.difficulty,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      totalQuestions: session.codeHistory?.length || 0,
    }));
  }

  static async getSessionDetail(sessionId, userId) {
    const session = await LiveCodingSession.findOne({
      id: sessionId,
      userId,
    }).lean();
    if (!session) return null;
    return {
      id: session.id,
      language: session.language,
      domain: session.domain,
      topic: session.topic,
      difficulty: session.difficulty,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      codeHistory: session.codeHistory,
    };
  }

  // ========== ADMIN METHODS ==========

  static async getAllSessionsForAdmin(queryParams) {
    const {
      page = 1,
      limit,
      search,
      language,
      difficulty,
      fromDate,
      toDate,
    } = queryParams;

    let usePagination = true;
    let realLimit = parseInt(limit) || 10;
    if (limit === 'all' || limit === '0') {
      usePagination = false;
      realLimit = null;
    }
    const skip = usePagination ? (page - 1) * realLimit : 0;

    let query = {};

    if (search) {
      const users = await User.find({
        $or: [
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { userName: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');
      query.userId = { $in: users.map((u) => u._id) };
    }

    if (language) query.language = { $regex: language, $options: 'i' };
    if (difficulty) query.difficulty = difficulty;
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate + 'T23:59:59');
    }

    const total = await LiveCodingSession.countDocuments(query);
    let sessionsQuery = LiveCodingSession.find(query).sort({ createdAt: -1 });
    if (usePagination) {
      sessionsQuery = sessionsQuery.skip(skip).limit(realLimit);
    }
    const sessions = await sessionsQuery.lean();

    const sessionsWithUser = await Promise.all(
      sessions.map(async (session) => {
        const user = await User.findById(session.userId).select(
          'fullName email userName'
        );
        const totalQuestions = session.codeHistory?.length || 0;
        const lastEntry =
          session.codeHistory?.length > 0
            ? session.codeHistory[session.codeHistory.length - 1]
            : null;
        const lastScore = lastEntry?.evaluation?.summary || 'N/A';
        return {
          id: session.id,
          userId: session.userId,
          userName: user?.fullName || user?.userName || 'Unknown',
          userEmail: user?.email || 'Unknown',
          language: session.language,
          domain: session.domain,
          topic: session.topic,
          difficulty: session.difficulty,
          totalQuestions,
          lastScore,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
        };
      })
    );

    const totalSessions = await LiveCodingSession.countDocuments();
    const uniqueUsers = await LiveCodingSession.distinct('userId');
    const languagesStats = await LiveCodingSession.aggregate([
      { $group: { _id: '$language', count: { $sum: 1 } } },
    ]);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const thisWeek = await LiveCodingSession.countDocuments({
      createdAt: { $gte: oneWeekAgo },
    });

    return {
      sessions: sessionsWithUser,
      total,
      pages: usePagination ? Math.ceil(total / realLimit) : 1,
      currentPage: usePagination ? page : 1,
      stats: {
        total: totalSessions,
        uniqueUsers: uniqueUsers.length,
        languages: languagesStats,
        thisWeek,
      },
    };
  }

  static async getSessionDetailForAdmin(sessionId) {
    const session = await LiveCodingSession.findOne({ id: sessionId }).lean();
    if (!session) throw new Error('Coding session not found');
    const user = await User.findById(session.userId).select(
      'fullName email userName'
    );
    const codeHistory = (session.codeHistory || []).map((entry, idx) => ({
      index: idx + 1,
      code: entry.code,
      problemStatement: entry.problemStatement,
      submittedAt: entry.submittedAt,
      explainAnswers: entry.explainAnswers || [],
      evaluation: {
        summary: entry.evaluation?.summary || 'No summary',
        feedback: entry.evaluation?.feedback || 'No feedback',
        strengths: entry.evaluation?.strengths || [],
        weaknesses: entry.evaluation?.weaknesses || [],
      },
    }));
    return {
      id: session.id,
      userId: session.userId,
      userName: user?.fullName || user?.userName || 'Unknown',
      userEmail: user?.email || 'Unknown',
      language: session.language,
      domain: session.domain,
      topic: session.topic,
      difficulty: session.difficulty,
      codeHistory,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  }

  static async deleteSessionForAdmin(sessionId) {
    const result = await LiveCodingSession.findOneAndDelete({ id: sessionId });
    if (!result) throw new Error('Coding session not found');
    return true;
  }

  // ========== PRIVATE HELPERS ==========

  static _getSessionWithOwnershipCheck(sessionId, userId) {
    const session = sessionStore.getSession(sessionId);
    if (!session) return null;
    if (!session.userId) return null;
    if (String(session.userId) !== String(userId)) return null;
    return session;
  }
}

module.exports = LiveCodingService;
