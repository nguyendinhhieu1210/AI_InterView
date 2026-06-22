const LiveCodingSession = require("../models/LiveCodingSession");
const codeEvaluationService = require("../services/liveCoding/codeEvaluationService");
const llmProvider = require("../services/liveCoding/llmProvider");
const sessionStore = require("../services/liveCoding/sessionStore");
const { v4: uuidv4 } = require("uuid");

// ========== LANGUAGE MAPPING ==========
const LANGUAGE_MAPPING = {
  java: "java",
  Java: "java",
  python: "python",
  py: "python",
  Python: "python",
  javascript: "javascript",
  js: "javascript",
  JavaScript: "javascript",
  typescript: "javascript",
  ts: "javascript",
  TypeScript: "javascript",
  cpp: "cpp",
  "c++": "cpp",
  "C++": "cpp",
  Cpp: "cpp",
  csharp: "csharp",
  "c#": "csharp",
  "C#": "csharp",
  CSharp: "csharp",
  go: "go",
  golang: "go",
  Go: "go",
};

// ========== STATIC DATA ==========
const languageDomains = {
  java: ["OOP", "DSA", "Concurrency", "Collections", "Streams"],
  python: ["OOP", "DSA", "Functional Programming", "Decorators", "Generators"],
  javascript: [
    "OOP",
    "Functional Programming",
    "Async",
    "DOM Manipulation",
    "Closures",
  ],
  cpp: [
    "OOP",
    "DSA",
    "Memory Management",
    "STL",
    "Templates",
    "Smart Pointers",
    "Move Semantics",
  ],
  csharp: [
    "OOP",
    "DSA",
    "LINQ",
    "Async",
    "Delegates",
    "Events",
    "Properties",
    "Indexers",
  ],
  go: [
    "Concurrency",
    "Interfaces",
    "DSA",
    "Error Handling",
    "Packages",
    "Goroutines",
    "Channels",
  ],
};

const domainTopics = {
  java: {
    OOP: [
      "Inheritance",
      "Polymorphism",
      "Encapsulation",
      "Abstraction",
      "Interfaces",
    ],
    DSA: [
      "Arrays",
      "Linked Lists",
      "Stacks",
      "Queues",
      "Trees",
      "Graphs",
      "Sorting",
      "Searching",
    ],
    Concurrency: [
      "Threads",
      "Runnable",
      "Synchronized",
      "Locks",
      "Executors",
      "CompletableFuture",
    ],
    Collections: [
      "List",
      "Set",
      "Map",
      "Queue",
      "Iterators",
      "Comparable",
      "Comparator",
    ],
    Streams: [
      "Stream API",
      "Lambdas",
      "Filter/Map/Reduce",
      "Collectors",
      "Optional",
    ],
  },
  python: {
    OOP: [
      "Classes",
      "Inheritance",
      "Polymorphism",
      "Encapsulation",
      "Magic Methods",
      "Property Decorators",
    ],
    DSA: [
      "Lists",
      "Dictionaries",
      "Sets",
      "Tuples",
      "Sorting",
      "Searching",
      "List Comprehensions",
    ],
    "Functional Programming": [
      "Lambda",
      "Map",
      "Filter",
      "Reduce",
      "Decorators",
      "Functools",
    ],
    Decorators: [
      "Function Decorators",
      "Class Decorators",
      "Functools",
      "Property",
    ],
    Generators: [
      "Yield",
      "Generator Expressions",
      "Lazy Evaluation",
      "Iterators",
    ],
  },
  javascript: {
    OOP: [
      "Prototypes",
      "Classes",
      "Inheritance",
      "Polymorphism",
      "Encapsulation",
      "Object.create",
    ],
    "Functional Programming": [
      "Higher-order Functions",
      "Closures",
      "Pure Functions",
      "Currying",
      "Composition",
    ],
    Async: ["Callbacks", "Promises", "Async/Await", "Event Loop", "Fetch API"],
    "DOM Manipulation": [
      "Selectors",
      "Events",
      "Dynamic Rendering",
      "Element Creation",
      "Event Delegation",
    ],
    Closures: ["Lexical Scoping", "Private Variables", "Modules", "IIFE"],
  },
  cpp: {
    OOP: [
      "Classes",
      "Inheritance",
      "Polymorphism",
      "Encapsulation",
      "Virtual Functions",
      "Abstract Classes",
    ],
    DSA: [
      "Arrays",
      "Vectors",
      "Linked Lists",
      "Stacks",
      "Queues",
      "Trees",
      "Sorting",
      "Searching",
      "Maps",
    ],
    "Memory Management": [
      "Pointers",
      "References",
      "Dynamic Allocation",
      "Smart Pointers",
      "RAII",
    ],
    STL: ["Vector", "List", "Map", "Set", "Algorithm", "Iterator", "String"],
    Templates: [
      "Function Templates",
      "Class Templates",
      "Template Specialization",
      "Variadic Templates",
    ],
    "Smart Pointers": [
      "unique_ptr",
      "shared_ptr",
      "weak_ptr",
      "make_unique",
      "make_shared",
    ],
    "Move Semantics": [
      "Move Constructor",
      "Move Assignment",
      "std::move",
      "Rvalue References",
    ],
  },
  csharp: {
    OOP: [
      "Classes",
      "Inheritance",
      "Polymorphism",
      "Encapsulation",
      "Abstract Classes",
      "Interfaces",
      "Records",
    ],
    DSA: [
      "Arrays",
      "Lists",
      "Dictionaries",
      "Stack",
      "Queue",
      "HashSet",
      "LinkedList",
      "Sorting",
      "Searching",
    ],
    LINQ: [
      "Query Syntax",
      "Method Syntax",
      "Where",
      "Select",
      "GroupBy",
      "Join",
      "OrderBy",
    ],
    Async: [
      "async/await",
      "Task",
      "Task<T>",
      "CancellationToken",
      "WhenAll",
      "WhenAny",
    ],
    Delegates: [
      "Func",
      "Action",
      "Predicate",
      "Anonymous Methods",
      "Lambda Expressions",
    ],
    Events: ["Event Handlers", "EventArgs", "Custom Events", "Event Accessors"],
    Properties: [
      "Auto Properties",
      "Computed Properties",
      "Required Properties",
      "Init Only",
    ],
    Indexers: ["Indexers", "Overload Indexers", "Multi-dimensional Indexers"],
  },
  go: {
    Concurrency: [
      "Goroutines",
      "Channels",
      "Select",
      "WaitGroups",
      "Mutex",
      "Atomic Operations",
    ],
    Interfaces: [
      "Empty Interface",
      "Type Assertions",
      "Type Switches",
      "Interface Embedding",
    ],
    DSA: [
      "Slices",
      "Maps",
      "Structs",
      "Arrays",
      "Linked Lists",
      "Trees",
      "Sorting",
      "Searching",
    ],
    "Error Handling": [
      "Error Interface",
      "Custom Errors",
      "Panic/Recover",
      "Error Wrapping",
      "Defer",
    ],
    Packages: [
      "Package Creation",
      "Exported/Private",
      "Init Functions",
      "Package Aliases",
      "Vendor",
    ],
    Goroutines: [
      "go keyword",
      "Channel Buffering",
      "Worker Pools",
      "Rate Limiting",
      "Context",
    ],
    Channels: [
      "Unbuffered",
      "Buffered",
      "Directional",
      "Channel Closing",
      "Range over Channels",
    ],
  },
};

// ========== PURE HELPERS ==========
const normalizeLanguage = (language) => {
  const normalized = LANGUAGE_MAPPING[language?.toLowerCase()];
  return normalized || "javascript";
};

const getDomainsForLanguage = (language) => {
  const normalized = normalizeLanguage(language);
  return languageDomains[normalized] || ["Basic", "Intermediate", "Advanced"];
};

const getTopicsForDomain = (language, domain) => {
  const normalized = normalizeLanguage(language);
  const domains = domainTopics[normalized];
  if (domains && domains[domain]) return domains[domain];
  const fallbacks = {
    OOP: ["Classes", "Inheritance", "Polymorphism", "Encapsulation"],
    DSA: ["Arrays", "Lists", "Stacks", "Queues", "Sorting", "Searching"],
    Basic: ["Variables", "Functions", "Loops", "Conditionals"],
  };
  return (
    fallbacks[domain] || [
      "Basic Syntax",
      "Control Flow",
      "Functions",
      "Error Handling",
    ]
  );
};

const getSessionWithOwnershipCheck = (sessionId, userId) => {
  const session = sessionStore.getSession(sessionId);
  if (!session) return null;
  if (!session.userId) return null;
  if (String(session.userId) !== String(userId)) return null;
  return session;
};

const cleanText = (text) => {
  if (!text) return "";
  return text.replace(/\.\.\./g, ".");
};

// ========== CONTROLLERS ==========
const getDomainsByLanguage = async (req, res) => {
  try {
    const { language } = req.query;
    if (!language) return res.status(400).json({ error: "Missing language" });
    const domains = getDomainsForLanguage(language);
    res.json({ domains });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTopicsByLanguageAndDomain = async (req, res) => {
  try {
    const { language, domain } = req.query;
    if (!language || !domain) {
      return res.status(400).json({ error: "Missing language or domain" });
    }
    const topics = getTopicsForDomain(language, domain);
    res.json({ topics });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const startInterview = async (req, res) => {
  try {
    let { language, domain, topicName, difficulty } = req.body;

    if (!language || !domain || !topicName || !difficulty) {
      return res.status(400).json({ error: "Missing required fields" });
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
      difficulty,
    );

    // Log kết quả
    console.log(`\n========== QUESTION GENERATED ==========`);
    console.log(`Problem: ${question.problemStatement?.substring(0, 100)}...`);
    console.log(`Signature: ${question.functionSignature}`);
    console.log(`Example Input: ${question.exampleInput}`);
    console.log(`Example Output: ${question.exampleOutput}`);
    console.log(`Expected Type: ${question.expectedType}`);
    console.log(`=========================================\n`);

    const sessionData = {
      userId: req.user.id,
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
          "Problem statement not provided",
        type: "code",
        answered: false,
      },
      explainAnswers: [],
      explainCount: 0,
      currentCodeSubmission: null,
      waitingForNextCode: false,
      createdAt: new Date(),
    };

    sessionStore.setSession(sessionId, sessionData);
    res.status(201).json({ sessionId, question: sessionData.currentQuestion });
  } catch (error) {
    console.error("Start interview error:", error);
    res.status(500).json({ error: error.message });
  }
};

const getCurrentQuestion = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = getSessionWithOwnershipCheck(sessionId, req.user.id);
    if (!session) {
      return res.status(404).json({ error: "Session not found or expired" });
    }
    res.json({ currentQuestion: session.currentQuestion });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const submitCode = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { code } = req.body;

    const session = getSessionWithOwnershipCheck(sessionId, req.user.id);
    if (!session) {
      return res.status(404).json({ error: "Session not found or expired" });
    }
    if (session.currentQuestion.type !== "code") {
      return res.status(400).json({ error: "Not a code question" });
    }
    if (session.currentQuestion.answered === true) {
      return res
        .status(400)
        .json({ error: "This question has already been answered correctly" });
    }

    const evaluation = await llmProvider.evaluateCodeSubmission(
      session.language,
      code,
      session.currentQuestion.problemStatement,
      session.currentQuestion.exampleOutput || "",
    );

    if (!evaluation.correct) {
      return res.json({
        correct: false,
        feedback: cleanText(evaluation.feedback),
      });
    }

    session.currentQuestion.answered = true;
    session.currentCodeSubmission = {
      code,
      question: session.currentQuestion,
      problemStatement: session.currentQuestion.problemStatement,
      submittedAt: new Date(),
    };
    session.explainAnswers = [];
    session.explainCount = 0;
    session.askedLineNumbers = []; // Reset cho vòng giải thích mới

    const explainQuestion = await llmProvider.generateExplanationQuestion(
      session.language,
      code,
      session.currentQuestion,
      session.difficulty,
      session.askedLineNumbers,
    );

    session.currentQuestion = {
      ...explainQuestion,
      type: "explain",
      answered: false,
    };
    sessionStore.setSession(sessionId, session);

    res.json({
      correct: true,
      feedback: cleanText(
        evaluation.feedback || "Correct! Now explain your code.",
      ),
      nextQuestion: session.currentQuestion,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

const submitExplanation = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { answer } = req.body;
    const MAX_EXPLAIN = 3;

    const session = getSessionWithOwnershipCheck(sessionId, req.user.id);
    if (!session) {
      return res.status(404).json({ error: "Session not found or expired" });
    }
    if (session.currentQuestion.type !== "explain") {
      return res.status(400).json({ error: "Not an explanation question" });
    }
    if (session.currentQuestion.answered === true) {
      return res
        .status(400)
        .json({ error: "This question has already been answered" });
    }

    if (!session.askedLineNumbers) {
      session.askedLineNumbers = [];
    }

    let evalResult;
    try {
      evalResult = await llmProvider.evaluateExplanation(
        session.language,
        answer,
        session.currentQuestion,
      );
    } catch (err) {
      console.error("AI evaluateExplanation error:", err);
      return res
        .status(503)
        .json({ error: "AI evaluation failed, please try again later" });
    }

    if (!evalResult || typeof evalResult.correct !== "boolean") {
      return res.status(503).json({
        error: "AI evaluation returned invalid data, please try again",
      });
    }

    // ĐƠN GIẢN: Lưu line number đã hỏi vào mảng
    const currentLineNumber = session.currentQuestion.lineNumber;
    if (
      currentLineNumber &&
      !session.askedLineNumbers.includes(currentLineNumber)
    ) {
      session.askedLineNumbers.push(currentLineNumber);
    }

    console.log(`[DEBUG] Asked lines: ${session.askedLineNumbers.join(", ")}`);

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
          session.askedLineNumbers, // Truyền mảng line numbers đã hỏi cho AI
        );
      } catch (err) {
        console.error("AI generateNextExplanationQuestion error:", err);
        nextExplain = null;
      }

      if (nextExplain && nextExplain.lineNumber) {
        session.currentQuestion = {
          ...nextExplain,
          type: "explain",
          answered: false,
        };
        sessionStore.setSession(sessionId, session);

        return res.json({
          correct: evalResult.correct,
          feedback: cleanText(evalResult.feedback),
          modelAnswer: cleanText(evalResult.modelAnswer),
          nextQuestion: session.currentQuestion,
        });
      } else {
        // Nếu AI không tạo được câu hỏi mới, kết thúc vòng
        session.explainCount = MAX_EXPLAIN;
      }
    }

    // Final evaluation
    let finalEvaluation;
    try {
      finalEvaluation = await llmProvider.evaluateCodeAndExplanations(
        session.language,
        session.currentCodeSubmission?.code || "",
        session.currentCodeSubmission?.problemStatement || "",
        session.explainAnswers,
      );
    } catch (err) {
      console.error("AI evaluateCodeAndExplanations error:", err);
      return res
        .status(503)
        .json({ error: "AI final evaluation failed, please try again later." });
    }

    if (!finalEvaluation || typeof finalEvaluation.summary !== "string") {
      return res
        .status(503)
        .json({ error: "AI final evaluation returned invalid data." });
    }

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
      { id: sessionId, userId: req.user.id },
      {
        $setOnInsert: {
          userId: req.user.id,
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
      { upsert: true, new: true },
    );

    session.waitingForNextCode = true;
    session.currentQuestion = null;
    session.explainAnswers = [];
    session.explainCount = 0;
    session.currentCodeSubmission = null;
    session.askedLineNumbers = [];
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
        strengths: (finalEvaluation.strengths || []).map((s) => cleanText(s)),
        weaknesses: (finalEvaluation.weaknesses || []).map((w) => cleanText(w)),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

const nextCodeQuestion = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = getSessionWithOwnershipCheck(sessionId, req.user.id);
    if (!session) {
      return res.status(404).json({ error: "Session not found or expired" });
    }
    if (!session.waitingForNextCode) {
      return res.status(400).json({ error: "Current round not completed yet" });
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
      { singleCall: true },
    );

    const codeWithLines = llmProvider.formatCodeWithLineNumbers(
      newCodeQuestion.functionSignature || newCodeQuestion.problemStatement,
    );

    session.currentQuestion = {
      ...newCodeQuestion,
      problemStatement:
        newCodeQuestion.problemStatement ||
        newCodeQuestion.description ||
        "Problem statement not provided",
      codeWithLines: codeWithLines,
      type: "code",
      answered: false,
    };
    sessionStore.setSession(sessionId, session);

    res.json({ nextQuestion: session.currentQuestion });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

const getLastEvaluation = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await LiveCodingSession.findOne({
      id: sessionId,
      userId: req.user.id,
    });
    if (!session) return res.status(404).json({ error: "Session not found" });
    const lastEntry = session.codeHistory[session.codeHistory.length - 1];
    if (!lastEntry || !lastEntry.evaluation) {
      return res.json({ evaluation: null, message: "No evaluation yet" });
    }
    res.json({ evaluation: lastEntry.evaluation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getSessionHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await LiveCodingSession.findOne({
      id: sessionId,
      userId: req.user.id,
    });
    if (!session) return res.status(404).json({ error: "Session not found" });
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

const getSessionList = async (req, res) => {
  try {
    const sessions = await LiveCodingSession.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    const history = sessions.map((session) => ({
      id: session.id,
      language: session.language,
      domain: session.domain,
      topic: session.topic,
      difficulty: session.difficulty,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      totalQuestions: session.codeHistory?.length || 0,
    }));
    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getSessionDetail = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await LiveCodingSession.findOne({
      id: sessionId,
      userId: req.user.id,
    }).lean();
    if (!session) {
      return res.status(404).json({ success: false, session: null });
    }
    return res.json({
      success: true,
      session: {
        id: session.id,
        language: session.language,
        domain: session.domain,
        topic: session.topic,
        difficulty: session.difficulty,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        codeHistory: session.codeHistory,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, session: null, error: error.message });
  }
};

// ========== ADMIN CONTROLLERS ==========
const getAllCodingSessions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    let limit = req.query.limit;
    let skip = (page - 1) * (parseInt(limit) || 10);
    let usePagination = true;

    if (limit === "all" || limit === "0") {
      usePagination = false;
      limit = null;
      skip = null;
    } else {
      limit = parseInt(limit) || 10;
      skip = (page - 1) * limit;
    }

    const { search, language, difficulty, fromDate, toDate } = req.query;
    let query = {};

    if (search) {
      const User = require("../models/User");
      const users = await User.find({
        $or: [
          { fullName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { userName: { $regex: search, $options: "i" } },
        ],
      }).select("_id");
      query.userId = { $in: users.map((u) => u._id) };
    }

    if (language) query.language = { $regex: language, $options: "i" };
    if (difficulty) query.difficulty = difficulty;
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate + "T23:59:59");
    }

    const total = await LiveCodingSession.countDocuments(query);
    let sessionsQuery = LiveCodingSession.find(query).sort({ createdAt: -1 });
    if (usePagination) {
      sessionsQuery = sessionsQuery.skip(skip).limit(limit);
    }
    const sessions = await sessionsQuery.lean();

    const User = require("../models/User");
    const sessionsWithUser = await Promise.all(
      sessions.map(async (session) => {
        const user = await User.findById(session.userId).select(
          "fullName email userName",
        );
        const totalQuestions = session.codeHistory?.length || 0;
        const lastScore =
          session.codeHistory?.length > 0
            ? session.codeHistory[session.codeHistory.length - 1]?.evaluation
                ?.summary || "N/A"
            : "N/A";
        return {
          id: session.id,
          userId: session.userId,
          userName: user?.fullName || user?.userName || "Unknown",
          userEmail: user?.email || "Unknown",
          language: session.language,
          domain: session.domain,
          topic: session.topic,
          difficulty: session.difficulty,
          totalQuestions,
          lastScore,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
        };
      }),
    );

    const totalSessions = await LiveCodingSession.countDocuments();
    const uniqueUsers = await LiveCodingSession.distinct("userId");
    const languagesStats = await LiveCodingSession.aggregate([
      { $group: { _id: "$language", count: { $sum: 1 } } },
    ]);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const thisWeek = await LiveCodingSession.countDocuments({
      createdAt: { $gte: oneWeekAgo },
    });

    res.json({
      success: true,
      sessions: sessionsWithUser,
      total,
      pages: usePagination ? Math.ceil(total / limit) : 1,
      currentPage: usePagination ? page : 1,
      stats: {
        total: totalSessions,
        uniqueUsers: uniqueUsers.length,
        languages: languagesStats,
        thisWeek,
      },
    });
  } catch (error) {
    console.error("Get all coding sessions error:", error);
    res.status(500).json({ message: "Failed to fetch coding sessions" });
  }
};

const getCodingSessionByIdForAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await LiveCodingSession.findOne({ id }).lean();
    if (!session) {
      return res.status(404).json({ message: "Coding session not found" });
    }
    const User = require("../models/User");
    const user = await User.findById(session.userId).select(
      "fullName email userName",
    );
    const codeHistory = (session.codeHistory || []).map((entry, idx) => ({
      index: idx + 1,
      code: entry.code,
      problemStatement: entry.problemStatement,
      submittedAt: entry.submittedAt,
      explainAnswers: entry.explainAnswers || [],
      evaluation: {
        summary: entry.evaluation?.summary || "No summary",
        feedback: entry.evaluation?.feedback || "No feedback",
        strengths: entry.evaluation?.strengths || [],
        weaknesses: entry.evaluation?.weaknesses || [],
      },
    }));
    res.json({
      success: true,
      session: {
        id: session.id,
        userId: session.userId,
        userName: user?.fullName || user?.userName || "Unknown",
        userEmail: user?.email || "Unknown",
        language: session.language,
        domain: session.domain,
        topic: session.topic,
        difficulty: session.difficulty,
        codeHistory,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get coding session by id error:", error);
    res.status(500).json({ message: "Failed to fetch coding session" });
  }
};

const deleteCodingSessionById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await LiveCodingSession.findOneAndDelete({ id });
    if (!result) {
      return res.status(404).json({ message: "Coding session not found" });
    }
    res.json({ success: true, message: "Coding session deleted successfully" });
  } catch (error) {
    console.error("Delete coding session error:", error);
    res.status(500).json({ message: "Failed to delete coding session" });
  }
};

module.exports = {
  getDomainsByLanguage,
  getTopicsByLanguageAndDomain,
  startInterview,
  getCurrentQuestion,
  submitCode,
  submitExplanation,
  nextCodeQuestion,
  getLastEvaluation,
  getSessionHistory,
  getSessionList,
  getSessionDetail,
  getAllCodingSessions,
  getCodingSessionByIdForAdmin,
  deleteCodingSessionById,
};
