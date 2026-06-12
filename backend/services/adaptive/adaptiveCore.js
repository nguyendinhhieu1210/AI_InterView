// adaptiveCore.js
const {
  safeParseJson,
  repairTruncatedJson,
} = require("../ai/parsers/jsonParser");

const EXPECTED_CONCEPTS = {
  "useEffect (deps, cleanup)": [
    "dependency array",
    "cleanup function",
    "re-render",
    "infinite loop",
    "side effects",
  ],
  closures: [
    "lexical scope",
    "outer function",
    "persistent state",
    "closure variable",
  ],
  "event loop": [
    "call stack",
    "task queue",
    "microtask",
    "non-blocking",
    "single thread",
  ],
  promises: ["resolve", "reject", "then", "catch", "pending", "fulfilled"],
  "async/await": ["promise", "try catch", "error handling", "non-blocking"],
  usestate: ["re-render", "immutable", "setter function", "initial value"],
  "usememo & usecallback": [
    "memoization",
    "dependency array",
    "re-render",
    "performance",
    "referential equality",
  ],
  "props vs state": [
    "unidirectional",
    "parent",
    "child",
    "mutable",
    "immutable",
  ],
  "hoisting & scope": [
    "var",
    "let",
    "const",
    "temporal dead zone",
    "function hoisting",
  ],
  prototypes: ["prototype chain", "inheritance", "__proto__", "object.create"],
  "this binding": ["call", "apply", "bind", "arrow function", "context"],
  inheritance: ["extends", "super", "override", "parent class", "child class"],
  polymorphism: [
    "method overriding",
    "interface",
    "dynamic dispatch",
    "runtime",
  ],
  encapsulation: ["private", "public", "getter", "setter", "access modifier"],
  "solid principles": [
    "single responsibility",
    "open closed",
    "liskov",
    "interface segregation",
    "dependency inversion",
  ],
  middleware: ["next()", "request", "response", "chain", "order"],
  jwt: ["header", "payload", "signature", "expiry", "verify"],
  "binary trees": ["node", "left", "right", "leaf", "root"],
  bst: ["left smaller", "right larger", "search", "insert", "balance"],
};

const QUESTION_TYPES_BY_DIFFICULTY = {
  easy: ["conceptual", "comparison", "scenario"],
  medium: [
    "conceptual",
    "comparison",
    "scenario",
    "debugging",
    "best_practice",
  ],
  hard: ["conceptual", "comparison", "scenario", "debugging", "best_practice"],
};

const TOPIC_ROADMAPS = {
  react: {
    fundamentals: [
      "jsx & components",
      "props vs state",
      "event handling",
      "conditional rendering",
      "lists & keys",
    ],
    hooks: [
      "useState",
      "useEffect (deps, cleanup)",
      "custom hooks",
      "useMemo & useCallback",
    ],
    performance: [
      "memoization (React.memo)",
      "avoiding re-renders",
      "lazy loading & code splitting",
    ],
    architecture: [
      "context API",
      "state management (Redux/Zustand)",
      "component composition patterns",
    ],
  },
  oop: {
    fundamentals: [
      "classes & objects",
      "encapsulation",
      "inheritance",
      "polymorphism",
      "abstraction",
    ],
    advanced: [
      "interface vs abstract class",
      "composition vs inheritance",
      "solid principles",
    ],
    patterns: ["dependency injection", "factory", "singleton", "observer"],
  },
  javascript: {
    fundamentals: [
      "data types",
      "hoisting & scope",
      "closures",
      "prototypes",
      "this binding",
    ],
    modern: ["arrow functions", "destructuring", "spread/rest", "modules"],
    async: ["promises", "async/await", "event loop", "error handling"],
    functional: ["map/filter/reduce", "immutability", "currying"],
  },
  nodejs: {
    fundamentals: [
      "event loop",
      "commonjs vs es modules",
      "file system",
      "http server",
    ],
    express: ["middleware", "routing", "error handling", "authentication"],
    advanced: ["streams", "child processes", "cluster", "performance tuning"],
    security: ["helmet", "rate limiting", "input validation", "JWT"],
  },
  dsa: {
    basics: ["arrays & strings", "linked lists", "stacks & queues", "hashmaps"],
    trees: ["binary trees", "BST", "tree traversals"],
    graphs: ["BFS", "DFS", "shortest path"],
    algorithms: [
      "sorting (quick, merge)",
      "searching (binary)",
      "recursion",
      "DP basics",
    ],
  },
  java: {
    fundamentals: [
      "data types & variables",
      "control flow",
      "methods",
      "arrays",
      "OOP basics",
    ],
    oop: [
      "classes & objects",
      "inheritance",
      "polymorphism",
      "abstraction",
      "interfaces",
    ],
    advanced: [
      "generics",
      "collections framework",
      "exception handling",
      "lambda & streams",
    ],
    concurrency: [
      "threads",
      "synchronized",
      "executor service",
      "CompletableFuture",
    ],
  },
  python: {
    fundamentals: [
      "data types",
      "functions",
      "loops & conditionals",
      "list comprehension",
    ],
    oop: ["classes", "inheritance", "dunder methods", "decorators"],
    advanced: ["generators", "context managers", "metaclasses", "asyncio"],
    libraries: ["numpy basics", "pandas basics", "testing with pytest"],
  },
};

const DIFFICULTY_RULES = {
  easy: {
    description: `DIFFICULTY: Easy (Beginner level)
- Ask ONE straightforward question about definition, basic usage, or simple concepts
- Pattern: "What is X?", "What does X do?", "Give an example of X"
- NO performance analysis, NO architectural tradeoffs, NO edge cases
- Target: someone who just started learning the topic`,

    answerDepth: `DEPTH: Easy — definition + one simple example is enough. No internals, no tradeoffs.`,

    scoreNote: `Easy: Accept correct definitions + basic examples. Do NOT penalize brevity — a short accurate answer beats a long vague one.`,
  },

  medium: {
    description: `DIFFICULTY: Medium (Mid-level developer)
- Ask about how something works, practical usage, or key differences
- Pattern: "How does X work?", "What's the difference between X and Y?", "When would you use X over Y?"
- May involve one common pitfall or trade-off
- Target: developer with 1-2 years experience`,

    answerDepth: `DEPTH: Medium — explain how/why + one practical example + one common mistake if relevant. Don't over-explain simple parts.`,

    scoreNote: `Medium: Expect how/why understanding, not just definitions. Penalize answers that only define without explaining usage.`,
  },

  hard: {
    description: `DIFFICULTY: Hard (Senior developer level)
- Ask about internals, edge cases, performance implications, or architectural decisions
- Pattern: "How does X work under the hood?", "What are the tradeoffs of X vs Y at scale?", "What happens when...?"
- Questions should expose gaps in deep understanding
- Target: developer with 3+ years experience`,

    answerDepth: `DEPTH: Hard — address the specific angle asked (internals / tradeoffs / edge case). Include technical specifics, not buzzwords. A short precise answer can score well if it directly hits the point.`,

    scoreNote: `Hard: Penalize surface-level or purely definitional answers. Require the specific depth the question asks for.`,
  },
};

const QUESTION_BANK = {
  easy: {
    conceptual: (sub, topic) =>
      `What is "${sub}" and what problem does it solve in ${topic}?`,
    comparison: (sub, topic) =>
      `What is the basic difference between "${sub}" and a simpler alternative in ${topic}?`,
    scenario: (sub, topic) =>
      `Give a simple real-world example of when you would use "${sub}" in a ${topic} project.`,
  },
  medium: {
    conceptual: (sub, topic) =>
      `How does "${sub}" work in ${topic}? Explain with a practical example.`,
    comparison: (sub, topic) =>
      `What are the key differences between "${sub}" and its alternatives in ${topic}? When would you choose one over the other?`,
    scenario: (sub, topic) =>
      `Describe a scenario where "${sub}" would be the right choice in a ${topic} project and explain why.`,
    debugging: (sub, topic) =>
      `What common bugs do developers hit with "${sub}" in ${topic}? Walk through how you'd debug one.`,
    best_practice: (sub, topic) =>
      `What best practices should you follow when working with "${sub}" in ${topic}?`,
  },
  hard: {
    conceptual: (sub, topic) =>
      `Explain how "${sub}" works internally in ${topic}. What are the performance implications?`,
    comparison: (sub, topic) =>
      `What are the architectural tradeoffs of "${sub}" vs its alternatives in ${topic} at scale?`,
    scenario: (sub, topic) =>
      `Describe an edge case or production issue caused by "${sub}" in ${topic} and how you resolved it.`,
    debugging: (sub, topic) =>
      `What subtle bugs or performance issues can "${sub}" cause in ${topic}? Walk through your debugging approach.`,
    best_practice: (sub, topic) =>
      `What advanced patterns and anti-patterns exist around "${sub}" in ${topic}? When should you avoid it entirely?`,
  },
};

// ========== SUBTOPICS CÓ THỂ CẦN CODE ==========
const CODE_SUBTOPICS = [
  "usestate",
  "useeffect",
  "usememo",
  "usecallback",
  "useref",
  "custom hooks",
  "closures",
  "promises",
  "async/await",
  "event loop",
  "this binding",
  "prototypes",
  "map/filter/reduce",
  "destructuring",
  "spread/rest",
  "arrow functions",
  "currying",
  "middleware",
  "jwt",
  "streams",
  "sorting",
  "bst",
  "binary trees",
  "generics",
  "lambda & streams",
  "asyncio",
  "generators",
];
const CODE_QUESTION_TYPES = ["scenario", "debugging", "best_practice"];

// const TOTAL_QUESTIONS = 8;
const TOTAL_QUESTIONS = 5;
const SESSION_TIMEOUT_HOURS = 24; // [FIX 4] abandoned session timeout
const DIFFICULTY_ORDER = ["easy", "medium", "hard"];

function getRoadmapForTopic(topic) {
  const lower = (topic || "").toLowerCase().trim();
  const roadmapObj = TOPIC_ROADMAPS[lower] || {
    fundamentals: ["core fundamentals"],
    intermediate: ["practical concepts"],
    advanced: ["advanced patterns"],
  };
  const flattened = [];
  for (const phase of Object.values(roadmapObj)) flattened.push(...phase);
  return {
    structured: roadmapObj,
    flattened: flattened.slice(0, TOTAL_QUESTIONS),
  };
}

function pickFirstSubtopic(roadmapObj) {
  const phases = Object.values(roadmapObj);
  if (!phases.length) return null;
  const firstPhase = phases[0];
  if (!firstPhase || !firstPhase.length) return null;
  const pool = firstPhase.slice(0, Math.min(3, firstPhase.length));
  return pool[Math.floor(Math.random() * pool.length)];
}
function normalizeQuestion(text) {
  if (!text || typeof text !== "string") return "";
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .trim();
}

function isValidAiQuestion(text) {
  if (!text || typeof text !== "string") return false;
  const trimmed = text.trim();
  if (trimmed.length < 10 || trimmed.length > 400) return false;
  if (
    trimmed.toLowerCase().includes("undefined") ||
    trimmed.toLowerCase().includes("null")
  )
    return false;
  return true;
}

function isQuestionTooSimilar(question, history = []) {
  if (!question || !history.length) return false;
  const normalized = normalizeQuestion(question);
  const words = new Set(normalized.split(/\s+/).filter((w) => w.length > 3));
  if (words.size === 0) return false;
  return history.some((ex) => {
    if (!ex) return false;
    const exWords = new Set(ex.split(/\s+/).filter((w) => w.length > 3));
    if (exWords.size === 0) return false;
    const intersection = [...words].filter((w) => exWords.has(w)).length;
    return intersection / Math.min(words.size, exWords.size) > 0.6;
  });
}

function getFallbackQuestion(
  subtopic,
  questionType,
  topic,
  difficulty = "medium",
) {
  const safeSub =
    subtopic && subtopic !== "undefined" && subtopic !== "null"
      ? subtopic
      : topic || "this technology";
  const bank = QUESTION_BANK[difficulty] || QUESTION_BANK.medium;
  const fn = bank[questionType] || bank.conceptual;
  return fn(safeSub, topic || "software development");
}

function getNextQuestionType(difficulty = "medium", history = []) {
  const types =
    QUESTION_TYPES_BY_DIFFICULTY[difficulty] ||
    QUESTION_TYPES_BY_DIFFICULTY.medium;
  const last = history[history.length - 1];
  const available = types.filter((t) => t !== last);
  return available[Math.floor(Math.random() * available.length)];
}
function detectMissingConcepts(subtopic, answer = "") {
  const key = (subtopic || "").toLowerCase().trim();
  const expected = EXPECTED_CONCEPTS[key] || [];
  if (!expected.length) return [];
  const lower = answer.toLowerCase();
  return expected.filter((c) => !lower.includes(c.toLowerCase()));
}

function analyzeAnswerQuality(answer = "") {
  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;
  return {
    wordCount,
    tooShort: wordCount < 12,
    medium: wordCount >= 12 && wordCount < 40,
    detailed: wordCount >= 40,
  };
}

function needsCodeExample(subtopic, questionType) {
  const subLower = (subtopic || "").toLowerCase();
  return (
    CODE_QUESTION_TYPES.includes(questionType) ||
    CODE_SUBTOPICS.some((s) => subLower.includes(s))
  );
}

function isSessionTimedOut(session) {
  if (!session.updatedAt) return false;
  const hoursInactive =
    (new Date() - new Date(session.updatedAt)) / (1000 * 60 * 60);
  return hoursInactive > SESSION_TIMEOUT_HOURS;
}

function getAdaptiveDifficulty(baseDifficulty, lastScore) {
  if (lastScore === null || lastScore === undefined) return baseDifficulty;
  const idx = DIFFICULTY_ORDER.indexOf(baseDifficulty);
  if (lastScore <= 4 && idx > 0) return DIFFICULTY_ORDER[idx - 1]; // hỏi dễ hơn
  if (lastScore >= 8 && idx < DIFFICULTY_ORDER.length - 1)
    return DIFFICULTY_ORDER[idx + 1]; // hỏi sâu hơn
  return baseDifficulty;
}

function buildTopicBreakdown(questionBreakdown) {
  const topicMap = {};
  for (const q of questionBreakdown) {
    if (!topicMap[q.subtopic]) topicMap[q.subtopic] = [];
    topicMap[q.subtopic].push(q.score);
  }
  const result = {};
  for (const [sub, scores] of Object.entries(topicMap)) {
    result[sub] = parseFloat(
      (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1),
    );
  }
  return result;
}

module.exports = {
  TOTAL_QUESTIONS,
  SESSION_TIMEOUT_HOURS,
  DIFFICULTY_RULES,
  DIFFICULTY_ORDER,
  TOPIC_ROADMAPS,
  EXPECTED_CONCEPTS,
  QUESTION_BANK,
  QUESTION_TYPES_BY_DIFFICULTY,
  CODE_SUBTOPICS,
  CODE_QUESTION_TYPES,
  getRoadmapForTopic,
  pickFirstSubtopic,
  normalizeQuestion,
  isValidAiQuestion,
  isQuestionTooSimilar,
  getFallbackQuestion,
  getNextQuestionType,
  detectMissingConcepts,
  analyzeAnswerQuality,
  needsCodeExample,
  isSessionTimedOut,
  getAdaptiveDifficulty,
  buildTopicBreakdown,
  safeParseJson,
  repairTruncatedJson,
};
