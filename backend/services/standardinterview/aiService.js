// backend/services/standardinterview/aiService.js
const { HumanMessage } = require('@langchain/core/messages');
const { GroqService } = require('../ai/groqService');
const { extractJson } = require('../../utils/jsonExtractor');
const {
  logRequest,
  logResponse,
  logError,
  logRateLimit,
  logTokenUsage,
  generateRequestId,
} = require('../../utils/aiLogger');

const MODEL = 'llama-3.3-70b-versatile';

// ─────────────────────────────────────────────
// Helper nội bộ: gọi Groq + log đầy đủ
// ─────────────────────────────────────────────
async function callGroq(
  groqInstance,
  messages,
  feature = 'general',
  temperature = 0
) {
  const requestId = generateRequestId();

  const promptText = messages
    .map(
      (m) =>
        m?.lc_kwargs?.content || m?.content || (typeof m === 'string' ? m : '')
    )
    .join('\n');

  logRequest(MODEL, requestId, promptText, temperature);

  const startTime = Date.now();
  try {
    const responseText = await groqInstance.invokeWithRetry(messages);
    const durationMs = Date.now() - startTime;

    logResponse(MODEL, requestId, responseText, durationMs);

    const inputTokens = Math.ceil(promptText.length / 4);
    const outputTokens = Math.ceil((responseText || '').length / 4);
    logTokenUsage(
      MODEL,
      requestId,
      inputTokens,
      outputTokens,
      inputTokens + outputTokens,
      feature
    );

    return responseText;
  } catch (error) {
    if (error?.status === 429 || error?.message?.includes('rate limit')) {
      logRateLimit(
        MODEL,
        requestId,
        error?.headers?.['retry-after'] || null,
        error
      );
    } else {
      logError(MODEL, requestId, error, feature);
    }
    throw error;
  }
}

// ─────────────────────────────────────────────
// Difficulty config
// ─────────────────────────────────────────────
const difficultyConfig = {
  easy: {
    levelDescription: `- beginner level\n- junior/intern level\n- focus on fundamentals\n- simple debugging\n- basic syntax\n- easy real-world usage`,
    questionStyle: `- conceptual questions\n- beginner friendly scenarios\n- basic debugging scenarios\n- simple code understanding`,
    examples: `Example types:\n- What does this code do?\n- Identify the bug in this simple function\n- Basic concept explanation`,
  },
  medium: {
    levelDescription: `- intermediate developer level\n- practical coding knowledge\n- debugging and optimization\n- real-world development scenarios`,
    questionStyle: `- scenario based questions\n- practical debugging with code\n- performance optimization\n- architecture and design decisions`,
    examples: `Example types:\n- How would you optimize this code?\n- What's wrong with this implementation?\n- Choose the best approach for this scenario`,
  },
  hard: {
    levelDescription: `- advanced mid-level developer\n- deeper problem solving\n- optimization\n- algorithms\n- system thinking\n- edge cases`,
    questionStyle: `- complex scenarios\n- system design decisions\n- performance optimization\n- advanced debugging\n- architecture trade-offs`,
    examples: `Example types:\n- Design a solution for this complex problem\n- What are the trade-offs of these approaches?\n- How would you handle this edge case?`,
  },
};

// ─────────────────────────────────────────────
// Build Prompt
// ─────────────────────────────────────────────
const buildPrompt = (topic, difficulty) => {
  const config =
    difficultyConfig[difficulty?.toLowerCase()] || difficultyConfig.medium;

  // Xác định loại câu hỏi dựa trên topic
  const theoryKeywords = [
    'oop',
    'solid',
    'design pattern',
    'architecture',
    'principle',
    'algorithm',
    'data structure',
  ];
  const languageKeywords = [
    'javascript',
    'typescript',
    'c++',
    'c#',
    'java',
    'python',
    'go',
    'rust',
    'php',
    'ruby',
    'swift',
    'kotlin',
  ];

  const isTheory = theoryKeywords.some((k) => topic.toLowerCase().includes(k));
  const isLanguage = languageKeywords.some((k) =>
    topic.toLowerCase().includes(k)
  );

  let specificRules = '';

  if (isLanguage) {
    specificRules = `
==================================================
LANGUAGE-SPECIFIC RULES FOR "${topic}"
==================================================
- Create DIVERSE question types for ${topic}:
  1. THEORY: Core language concepts and syntax
  2. CODE ANALYSIS: Show code snippets and ask about behavior
  3. SCENARIO: Real-world usage and best practices
  4. DEBUGGING: Find and fix bugs in code snippets
  5. OPTIMIZATION: Improve performance or memory usage
  6. DESIGN: Architecture and design pattern decisions
  7. TRADE-OFFS: Compare different approaches

- Include ${topic}-SPECIFIC features and common patterns
- Include modern ${topic} features (ES6+, etc.)
- Questions should test practical problem-solving
    `;
  } else if (isTheory) {
    specificRules = `
==================================================
THEORY/CONCEPT RULES FOR "${topic}"
==================================================
- Create DIVERSE question types:
  1. CONCEPTUAL: Core principles and definitions
  2. APPLICATION: How to apply in real projects
  3. COMPARISON: Compare with alternatives
  4. SCENARIO: Apply theory to solve problems
  5. MISCONCEPTIONS: Common misunderstandings
    `;
  } else {
    specificRules = `
==================================================
GENERAL RULES FOR "${topic}"
==================================================
- Mix of practical and theoretical questions
- Include industry best practices
- Cover both fundamentals and advanced concepts
- Include scenario-based and debugging questions
    `;
  }

  return `You are a SENIOR TECHNICAL INTERVIEWER creating a comprehensive technical assessment.

Your task: Generate a REALISTIC and DIVERSE technical interview for topic: "${topic}" Difficulty: "${difficulty}"

${specificRules}

==================================================
DIFFICULTY REQUIREMENTS
==================================================
${config.levelDescription}

==================================================
QUESTION STYLE
==================================================
${config.questionStyle}

==================================================
IMPORTANT RULES FOR MCQ (7 questions)
==================================================
- EXACTLY 7 MCQ questions
- EXACTLY 4 options each (labeled A, B, C, D)
- ONLY ONE correct answer
- DISTRIBUTE question types (don't make all conceptual):
  * At least 2-3 questions with code snippets
  * At least 1-2 scenario-based questions
  * Mix of theory and practical application
- Make options PLAUSIBLE and challenging
- Provide DETAILED explanation for correct answer AND why others are wrong

==================================================
IMPORTANT RULES FOR ESSAY (3 questions)
==================================================
- EXACTLY 3 essay questions
- Each should require detailed, practical answers
- Mix theory and practical application
- Answerable within 150-300 words
- Include scenario-based questions that test problem-solving

==================================================
OUTPUT FORMAT (ONLY VALID JSON, no extra text)
==================================================
{
  "mcq": [
    {
      "question": "string (can include code snippets in backticks)",
      "difficulty": "easy|medium|hard",
      "options": ["A. option text", "B. option text", "C. option text", "D. option text"],
      "correctAnswer": "must exactly match one option text (including the letter prefix)",
      "explanation": "detailed explanation including why others are wrong"
    }
  ],
  "text": [
    {
      "question": "string (detailed, practical, scenario-based)",
      "difficulty": "easy|medium|hard",
      "idealAnswerKeywords": ["keyword1", "keyword2", "keyword3"],
      "sampleAnswer": "comprehensive professional answer (150-300 words)"
    }
  ]
}

CRITICAL: 
- Options MUST include the letter prefix (A., B., C., D.)
- correctAnswer MUST exactly match one of the option strings including the prefix
- Example: if option is "A. This is correct", correctAnswer must be exactly "A. This is correct"

Return ONLY the JSON object, no additional text.`;
};

// ─────────────────────────────────────────────
// Validation - FIXED
// ─────────────────────────────────────────────
const validateMCQ = (mcq) => {
  if (!Array.isArray(mcq)) {
    console.warn('mcq is not an array, type:', typeof mcq);
    return [];
  }

  return mcq.filter((q) => {
    if (!q || typeof q !== 'object') return false;
    if (!q.question || typeof q.question !== 'string') return false;
    if (!Array.isArray(q.options) || q.options.length !== 4) return false;
    if (!q.correctAnswer || typeof q.correctAnswer !== 'string') return false;

    // Check if correctAnswer exists in options (exact match or partial)
    const optionExists = q.options.some((opt) => {
      if (!opt || typeof opt !== 'string') return false;
      // Exact match
      if (opt === q.correctAnswer) return true;
      // Check if correctAnswer is part of option (for cases like "A." prefix)
      const cleanOpt = opt.replace(/^[A-D]\.\s*/, '').trim();
      const cleanCorrect = q.correctAnswer.replace(/^[A-D]\.\s*/, '').trim();
      return (
        cleanOpt === cleanCorrect ||
        opt.includes(q.correctAnswer) ||
        q.correctAnswer.includes(opt)
      );
    });

    if (!optionExists) {
      console.warn('correctAnswer not found in options:', {
        correctAnswer: q.correctAnswer,
        options: q.options,
      });
      return false;
    }

    if (q.explanation && typeof q.explanation !== 'string') return false;
    return true;
  });
};

const validateEssay = (text) => {
  if (!Array.isArray(text)) {
    console.warn('text is not an array, type:', typeof text);
    return [];
  }

  return text.filter((q) => {
    if (!q || typeof q !== 'object') return false;
    if (!q.question || typeof q.question !== 'string') return false;
    if (!Array.isArray(q.idealAnswerKeywords)) return false;
    if (q.sampleAnswer && typeof q.sampleAnswer !== 'string') return false;
    if (q.difficulty && !['easy', 'medium', 'hard'].includes(q.difficulty))
      return false;
    return true;
  });
};

// ─────────────────────────────────────────────
// Generate fallback questions với đa dạng loại
// ─────────────────────────────────────────────
const generateFallbackMCQ = (topic, difficulty, index) => {
  const topics = {
    javascript: {
      questions: [
        {
          question: `What is the output of this code?
\`\`\`javascript
console.log(typeof null);
console.log(typeof undefined);
\`\`\``,
          options: [
            'A. "object" and "undefined"',
            'B. "null" and "undefined"',
            'C. "object" and "object"',
            'D. "undefined" and "undefined"',
          ],
          correctAnswer: 'A. "object" and "undefined"',
          explanation:
            'In JavaScript, typeof null returns "object" (this is a historical bug that cannot be fixed). typeof undefined returns "undefined". This is a classic JavaScript quirk that interviewers often ask about to test understanding of JavaScript\'s type system.',
        },
        {
          question: `Consider this code:
\`\`\`javascript
const arr = [1, 2, 3];
const newArr = arr.map(x => x * 2);
arr[0] = 10;
console.log(arr[0], newArr[0]);
\`\`\`
What will be logged?`,
          options: ['A. 10 and 2', 'B. 10 and 10', 'C. 1 and 2', 'D. 1 and 10'],
          correctAnswer: 'A. 10 and 2',
          explanation:
            'map() creates a new array without mutating the original. arr[0] = 10 modifies the original array. newArr remains [2, 4, 6]. This demonstrates that array methods like map are immutable and create new arrays.',
        },
        {
          question: `What is the difference between == and === in JavaScript?`,
          options: [
            'A. == compares values, === compares values and types',
            'B. == compares values and types, === compares only values',
            'C. They are identical in behavior',
            'D. === is stricter and always returns false for different types',
          ],
          correctAnswer: 'A. == compares values, === compares values and types',
          explanation:
            '== performs type coercion before comparison (e.g., "5" == 5 is true). === does not perform type coercion and requires both value and type to match (e.g., "5" === 5 is false). Using === is generally recommended to avoid unexpected type coercion bugs.',
        },
        {
          question: `You\'re building a React component that fetches data. What\'s the correct way to handle the async operation?`,
          options: [
            'A. Use useEffect with async/await directly',
            'B. Define an async function inside useEffect and call it',
            'C. Use componentDidMount only',
            'D. Fetch data in the render function',
          ],
          correctAnswer:
            'B. Define an async function inside useEffect and call it',
          explanation:
            'In React, you cannot make the useEffect callback itself async. Instead, define an async function inside useEffect and call it. This ensures proper cleanup and error handling. Example: useEffect(() => { const fetchData = async () => { ... }; fetchData(); }, []);',
        },
        {
          question: `What will this code output?
\`\`\`javascript
const obj = {
  name: "John",
  greet: () => {
    console.log(this.name);
  }
};
obj.greet();
\`\`\``,
          options: [
            'A. "John"',
            'B. undefined',
            'C. "name"',
            'D. Throws an error',
          ],
          correctAnswer: 'B. undefined',
          explanation:
            "Arrow functions inherit the this value from the enclosing scope. In this case, the arrow function is defined in the global scope, so this refers to the global object (or undefined in strict mode). obj.name is not accessible through this. Use regular function declarations for methods that need to access the object's this context.",
        },
        {
          question: `\`\`\`javascript
for (var i = 0; i < 5; i++) {
  setTimeout(() => console.log(i), 100);
}
\`\`\`
What will this output?`,
          options: [
            'A. 0, 1, 2, 3, 4',
            'B. 5, 5, 5, 5, 5',
            'C. undefined, undefined, undefined, undefined, undefined',
            'D. 0, 0, 0, 0, 0',
          ],
          correctAnswer: 'B. 5, 5, 5, 5, 5',
          explanation:
            "var is function-scoped, and the loop doesn't create a new scope for each iteration. By the time setTimeout executes, the loop has finished and i is 5. All closures reference the same i variable. To fix, use let instead of var, which creates block-scoped variables with separate bindings for each iteration.",
        },
        {
          question: `When would you use a Set vs an Array in JavaScript?`,
          options: [
            'A. Set for unique values, Array for ordered collections',
            'B. Array for unique values, Set for ordered collections',
            'C. They are interchangeable',
            'D. Set is faster for all operations',
          ],
          correctAnswer:
            'A. Set for unique values, Array for ordered collections',
          explanation:
            'Sets are optimized for storing unique values with O(1) lookup time for existence checks. Arrays maintain order and allow duplicates, with O(n) lookup. Use Set when you need to enforce uniqueness, check membership frequently, or perform set operations (union, intersection). Use Array when order matters, you need duplicates, or you need array-specific methods like map, filter, reduce.',
        },
      ],
    },
    'c++': {
      questions: [
        {
          question: `What is the output of this code?
\`\`\`cpp
int x = 5;
int& ref = x;
int* ptr = &x;
ref = 10;
*ptr = 15;
cout << x;
\`\`\``,
          options: ['A. 5', 'B. 10', 'C. 15', 'D. Compile error'],
          correctAnswer: 'C. 15',
          explanation:
            'Both ref (reference) and ptr (pointer) refer to the same memory location as x. Changing through either modifies x directly. First ref = 10 sets x to 10, then *ptr = 15 sets x to 15. This demonstrates how references and pointers provide different ways to alias variables in C++.',
        },
        {
          question: `\`\`\`cpp
std::vector<int> v = {1, 2, 3, 4, 5};
for (auto it = v.begin(); it != v.end(); ++it) {
    if (*it == 3) {
        v.erase(it);
    }
}
\`\`\`
What's the bug in this code?`,
          options: [
            'A. No bug, works correctly',
            'B. Iterator invalidation after erase',
            'C. Should use std::remove instead',
            "D. Vector doesn't support erase in loops",
          ],
          correctAnswer: 'B. Iterator invalidation after erase',
          explanation:
            "After calling erase(), the iterator 'it' becomes invalid, and incrementing it in the for loop causes undefined behavior. Correct approach: v.erase(std::remove(v.begin(), v.end(), 3), v.end()) or use the return value of erase: it = v.erase(it). This is a common C++ pitfall when modifying containers while iterating.",
        },
        {
          question: `When should you use std::unique_ptr vs std::shared_ptr?`,
          options: [
            'A. unique_ptr for single ownership, shared_ptr for multiple ownership',
            "B. shared_ptr is always better because it's safer",
            "C. unique_ptr is faster but can't be used with polymorphism",
            "D. There's no difference in modern C++",
          ],
          correctAnswer:
            'A. unique_ptr for single ownership, shared_ptr for multiple ownership',
          explanation:
            'unique_ptr has zero overhead and is for exclusive ownership - only one pointer owns the object. shared_ptr uses reference counting for shared ownership but has overhead from the control block. Use unique_ptr by default, and only use shared_ptr when you truly need shared ownership.',
        },
        {
          question: `What is RAII and why is it important?`,
          options: [
            'A. Resource Acquisition Is Initialization - C++ idiom for resource management',
            'B. Random Access In Interface - pattern for containers',
            'C. Return Always Int - function signature rule',
            'D. Runtime Array Initialization - dynamic allocation technique',
          ],
          correctAnswer:
            'A. Resource Acquisition Is Initialization - C++ idiom for resource management',
          explanation:
            'RAII is a C++ programming idiom where resource acquisition happens during object construction and release during destruction. This ensures resource cleanup even when exceptions occur. Examples: smart pointers manage memory, lock_guard manages mutexes, file streams manage file handles. RAII is fundamental to C++ exception safety and resource management.',
        },
        {
          question: `\`\`\`cpp
class Base { public: virtual void foo() { cout << "Base"; } };
class Derived : public Base { public: void foo() override { cout << "Derived"; } };

Base* b = new Derived();
b->foo();
\`\`\`
What will this output?`,
          options: [
            'A. "Base"',
            'B. "Derived"',
            'C. Compile error',
            'D. Undefined behavior',
          ],
          correctAnswer: 'B. "Derived"',
          explanation:
            'Because foo() is virtual, dynamic dispatch occurs based on the actual object type (Derived), not the pointer type (Base). This is how polymorphism works in C++. The override keyword (C++11) ensures correct overriding and catches errors.',
        },
        {
          question: `What's the difference between delete and delete[] in C++?`,
          options: [
            'A. delete frees a single object, delete[] frees an array',
            'B. They are interchangeable',
            'C. delete[] is deprecated',
            'D. delete is for stack objects, delete[] for heap objects',
          ],
          correctAnswer:
            'A. delete frees a single object, delete[] frees an array',
          explanation:
            'delete calls the destructor of a single object and frees its memory. delete[] calls the destructor for each element in an array and frees the array memory. Using delete on an array or delete[] on a single object causes undefined behavior. Modern C++ recommends using smart pointers or containers instead of raw new/delete.',
        },
        {
          question: `You're implementing a thread-safe singleton. Which approach is correct in modern C++?`,
          options: [
            'A. Double-checked locking with mutex',
            "B. Static local variable (Meyer's Singleton)",
            'C. Global variable initialized at program start',
            'D. Atomic operations with spinlock',
          ],
          correctAnswer: "B. Static local variable (Meyer's Singleton)",
          explanation:
            "Meyer's Singleton (static local variable) is thread-safe in C++11 and later, guaranteed by the standard. It's simple, efficient, and has no synchronization overhead until first access. Example: Singleton& getInstance() { static Singleton instance; return instance; }. This is the recommended approach for singletons in modern C++.",
        },
      ],
    },
    oop: {
      questions: [
        {
          question: `Which OOP principle states that a class should have only one reason to change?`,
          options: [
            'A. Single Responsibility Principle',
            'B. Open/Closed Principle',
            'C. Liskov Substitution Principle',
            'D. Dependency Inversion Principle',
          ],
          correctAnswer: 'A. Single Responsibility Principle',
          explanation:
            "SRP (Single Responsibility Principle) states that a class should have only one reason to change, meaning it should have only one job or responsibility. This makes the code more maintainable, easier to understand, and less brittle to changes. It's often the first SOLID principle to consider when designing classes.",
        },
        {
          question: `\`\`\`java
class Rectangle {
    void setWidth(int w) { width = w; }
    void setHeight(int h) { height = h; }
}
class Square extends Rectangle {
    void setWidth(int w) { width = w; height = w; }
    void setHeight(int h) { height = h; width = h; }
}
\`\`\`
What principle is violated?`,
          options: [
            'A. Single Responsibility',
            'B. Open/Closed',
            'C. Liskov Substitution',
            'D. Interface Segregation',
          ],
          correctAnswer: 'C. Liskov Substitution',
          explanation:
            'LSP is violated because Square cannot be substituted for Rectangle without changing behavior. If you set width and height separately on a Rectangle, they can differ, but Square forces them equal. This breaks the Rectangle invariant. The solution is to favor composition over inheritance or use a Shape interface.',
        },
        {
          question: `When should you favor composition over inheritance?`,
          options: [
            'A. Always - inheritance should never be used',
            'B. When you need to avoid tight coupling and deep hierarchies',
            'C. Only in small projects',
            'D. Inheritance is always better for code reuse',
          ],
          correctAnswer:
            'B. When you need to avoid tight coupling and deep hierarchies',
          explanation:
            'Composition provides more flexibility and loose coupling. Use composition when: 1) You want to avoid deep inheritance hierarchies, 2) Behavior might change at runtime, 3) You want to minimize coupling between classes, 4) You need to combine behaviors from multiple sources (since multiple inheritance is often problematic).',
        },
        {
          question: `What's the purpose of encapsulation in OOP?`,
          options: [
            'A. To hide internal implementation and protect data integrity',
            'B. To allow inheritance between classes',
            'C. To improve performance',
            'D. To enable multiple inheritance',
          ],
          correctAnswer:
            'A. To hide internal implementation and protect data integrity',
          explanation:
            'Encapsulation bundles data and methods that operate on that data, hiding internal state and implementation details. It provides controlled access through public methods, protecting data integrity and reducing coupling. This makes the code more maintainable and allows internal implementation to change without affecting clients.',
        },
        {
          question: `\`\`\`java
interface Printer {
    void print();
    void scan();
    void fax();
}
class BasicPrinter implements Printer {
    // Has to implement all three methods
}
\`\`\`
What principle is violated?`,
          options: [
            'A. Single Responsibility',
            'B. Open/Closed',
            'C. Liskov Substitution',
            'D. Interface Segregation',
          ],
          correctAnswer: 'D. Interface Segregation',
          explanation:
            'ISP is violated because clients are forced to implement methods they don\'t need. A basic printer shouldn\'t have to implement scan() and fax(). Better to separate into Print, Scan, and Fax interfaces. This is called the "fat interface" problem and leads to less cohesive, more coupled designs.',
        },
        {
          question: `What is the difference between abstraction and encapsulation?`,
          options: [
            'A. Abstraction simplifies complexity, encapsulation hides implementation',
            'B. They are the same concept',
            'C. Encapsulation simplifies complexity, abstraction hides implementation',
            'D. They are opposites in OOP',
          ],
          correctAnswer:
            'A. Abstraction simplifies complexity, encapsulation hides implementation',
          explanation:
            'Abstraction focuses on essential characteristics and behavior, hiding unnecessary details through interfaces and abstract classes. Encapsulation physically bundles data and methods, controlling access. Abstraction is about "what" (interface), encapsulation is about "how" (implementation). They work together to create clean, maintainable code.',
        },
        {
          question: `You have a PaymentProcessor class that handles multiple payment types. Which design pattern would you use to extend it?`,
          options: [
            'A. Singleton Pattern',
            'B. Strategy Pattern',
            'C. Factory Pattern',
            'D. Observer Pattern',
          ],
          correctAnswer: 'B. Strategy Pattern',
          explanation:
            'Strategy Pattern allows selecting different algorithms (payment methods) at runtime. It defines a family of payment strategies (CreditCard, PayPal, BankTransfer), encapsulates each, and makes them interchangeable. This follows OCP (Open/Closed) because new payment methods can be added without modifying existing code.',
        },
      ],
    },
  };

  const topicLower = topic.toLowerCase();
  let questions = topics.javascript.questions; // default

  // Try to find matching topic
  for (const [key, value] of Object.entries(topics)) {
    if (topicLower.includes(key)) {
      questions = value.questions;
      break;
    }
  }

  const fallback = questions[index % questions.length];

  return {
    question: fallback.question || `What is an important concept in ${topic}?`,
    difficulty: difficulty || 'medium',
    options: fallback.options || [
      'A. Option A',
      'B. Option B',
      'C. Option C',
      'D. Option D',
    ],
    correctAnswer: fallback.correctAnswer || 'A. Option A',
    explanation:
      fallback.explanation ||
      `This is the correct approach based on standard ${topic} practices.`,
  };
};

const generateFallbackEssay = (topic, difficulty, index) => {
  const essays = [
    {
      question: `Design a real-time notification system for a social media platform. How would you handle scalability, reliability, and user preferences?`,
      idealAnswerKeywords: [
        topic.toLowerCase(),
        'notification',
        'scalability',
        'real-time',
        'architecture',
      ],
      sampleAnswer: `A scalable notification system requires: 1) Message queue (RabbitMQ/Kafka) for decoupling and load balancing. 2) WebSocket connections for real-time delivery. 3) Database for storing preferences and delivery status. 4) Multiple delivery channels (email, push, in-app). 5) Rate limiting to prevent abuse. 6) Retry mechanism with exponential backoff. 7) Analytics for tracking delivery rates. 8) User preference management (opt-in/opt-out). 9) Pagination and batching for bulk notifications. 10) Idempotent processing to prevent duplicates.`,
    },
    {
      question: `You're building an e-commerce platform. How would you implement a shopping cart that works across multiple devices and handles race conditions?`,
      idealAnswerKeywords: [
        topic.toLowerCase(),
        'shopping cart',
        'race conditions',
        'consistency',
        'distributed',
      ],
      sampleAnswer: `A distributed shopping cart requires: 1) Server-side state with session management. 2) Optimistic locking or versioning to handle concurrent updates. 3) Conflict resolution strategy (last-write-wins or merge). 4) Periodic sync between client and server. 5) Cart expiration and cleanup. 6) Atomic operations for critical sections (add/remove items). 7) Persistent storage (Redis for speed, database for durability). 8) Eventual consistency with retry mechanisms. 9) User authentication to merge guest carts. 10) Monitoring for anomalies and fraud detection.`,
    },
    {
      question: `How would you implement a caching strategy for a high-traffic API to reduce database load while maintaining data consistency?`,
      idealAnswerKeywords: [
        topic.toLowerCase(),
        'caching',
        'performance',
        'consistency',
        'redis',
      ],
      sampleAnswer: `A robust caching strategy includes: 1) Multi-level cache (in-memory, Redis, CDN). 2) Cache aside pattern for reading. 3) Write-through/Write-behind for updates. 4) Cache invalidation strategies (TTL, event-based). 5) Cache stampede prevention with locking or probabilistic eviction. 6) Cache warming for peak loads. 7) Stale-while-revalidate pattern. 8) Circuit breakers to handle cache failures. 9) Monitoring cache hit ratios and performance. 10) Consider cache consistency vs performance trade-offs based on business requirements.`,
    },
  ];

  return essays[index % essays.length];
};

// ─────────────────────────────────────────────
// generateInterviewQuestions
// ─────────────────────────────────────────────
const generateInterviewQuestions = async (topic, difficulty = 'medium') => {
  const temperature =
    difficulty === 'easy' ? 0.3 : difficulty === 'medium' ? 0.5 : 0.7;
  const groqService = new GroqService(
    process.env.GROQ_API_KEY,
    MODEL,
    temperature
  );
  const prompt = buildPrompt(topic, difficulty);

  try {
    console.log(
      `Generating interview questions for topic: ${topic}, difficulty: ${difficulty}`
    );

    const responseText = await callGroq(
      groqService,
      [new HumanMessage(prompt)],
      'generateInterviewQuestions',
      temperature
    );

    console.log('Response preview:', responseText.substring(0, 300) + '...');

    const parsed = extractJson(responseText);
    if (!parsed) {
      console.error(
        'extractJson returned null for response:',
        responseText.substring(0, 500)
      );
      throw new Error('extractJson returned null');
    }

    console.log('Parsed object keys:', Object.keys(parsed));
    console.log(
      'parsed.mcq type:',
      typeof parsed.mcq,
      'isArray:',
      Array.isArray(parsed.mcq)
    );
    console.log(
      'parsed.text type:',
      typeof parsed.text,
      'isArray:',
      Array.isArray(parsed.text)
    );

    // Đảm bảo là mảng
    let mcq = Array.isArray(parsed.mcq) ? parsed.mcq : [];
    let text = Array.isArray(parsed.text) ? parsed.text : [];

    // Log sample để debug
    if (mcq.length > 0) {
      console.log('Sample MCQ:', JSON.stringify(mcq[0]).substring(0, 200));
    }

    // Validate
    mcq = validateMCQ(mcq);
    text = validateEssay(text);

    console.log(
      `After validation: ${mcq.length} MCQ, ${text.length} essay questions`
    );

    // Xoá trùng
    const used = new Set();
    mcq = mcq.filter((q) => {
      const norm = q.question?.toLowerCase().trim() || '';
      if (!norm || used.has(norm)) return false;
      used.add(norm);
      return true;
    });
    text = text.filter((q) => {
      const norm = q.question?.toLowerCase().trim() || '';
      if (!norm || used.has(norm)) return false;
      used.add(norm);
      return true;
    });

    console.log(
      `After deduplication: ${mcq.length} MCQ, ${text.length} essay questions`
    );

    // Fallback nếu thiếu câu
    while (mcq.length < 7) {
      const fallback = generateFallbackMCQ(topic, difficulty, mcq.length);
      mcq.push(fallback);
    }
    while (text.length < 3) {
      const fallback = generateFallbackEssay(topic, difficulty, text.length);
      text.push(fallback);
    }

    mcq = mcq.slice(0, 7);
    text = text.slice(0, 3);

    console.log(`Final: ${mcq.length} MCQ, ${text.length} essay questions`);

    return { mcq, text };
  } catch (error) {
    console.error('Generate Interview Error:', error.message);
    console.error('Stack:', error.stack);

    const mcqFallback = Array.from({ length: 7 }, (_, i) =>
      generateFallbackMCQ(topic, difficulty, i)
    );
    const textFallback = Array.from({ length: 3 }, (_, i) =>
      generateFallbackEssay(topic, difficulty, i)
    );

    return {
      mcq: mcqFallback,
      text: textFallback,
    };
  }
};

// ─────────────────────────────────────────────
// gradeEssay
// ─────────────────────────────────────────────
const gradeEssay = async (question, userAnswer, idealAnswerKeywords) => {
  const prompt = `
You are a STRICT technical interviewer grading a detailed essay response.

Question:
${question}

Expected keywords/concepts:
${idealAnswerKeywords.join(', ')}

User answer:
${userAnswer || 'No answer'}

RUBRIC:
- Score between 0 and 10
- 0-3: Missing key concepts, incorrect understanding
- 4-6: Basic understanding, missing depth
- 7-8: Good understanding with some depth
- 9-10: Excellent, comprehensive, and insightful

EVALUATE:
- Technical correctness and depth
- Real-world applicability
- Practical examples provided
- Clarity and structure of answer
- Coverage of expected keywords
- Original thinking and insights

Return ONLY JSON:
{
  "score": number (0-10, one decimal place),
  "explanation": "detailed scoring rationale with specific points from user's answer",
  "feedback": "actionable advice for improvement"
}
`;

  const groqService = new GroqService(process.env.GROQ_API_KEY, MODEL, 0.2);
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('AI_TIMEOUT')), 30000)
  );

  try {
    const responseText = await Promise.race([
      callGroq(groqService, [new HumanMessage(prompt)], 'gradeEssay', 0.2),
      timeoutPromise,
    ]);

    console.log(
      'Grade essay response:',
      responseText.substring(0, 200) + '...'
    );

    const result = extractJson(responseText);
    if (!result || typeof result.score !== 'number') {
      console.warn('Invalid grading response, using fallback');
      throw new Error('Invalid JSON');
    }

    return {
      score: Math.round(Math.min(10, Math.max(0, result.score)) * 10) / 10,
      explanation: result.explanation || 'No explanation provided',
      feedback:
        result.feedback ||
        'Review the key concepts and provide more specific technical details.',
    };
  } catch (error) {
    console.error('gradeEssay error:', error.message);

    const answer = (userAnswer || '').toLowerCase();
    const matched = (idealAnswerKeywords || []).filter((kw) => {
      if (typeof kw !== 'string') return false;
      return answer.includes(kw.toLowerCase());
    }).length;

    const totalKeywords = Array.isArray(idealAnswerKeywords)
      ? idealAnswerKeywords.filter((k) => typeof k === 'string').length
      : 0;

    const score =
      totalKeywords > 0 ? Math.round((matched / totalKeywords) * 100) / 10 : 0;

    return {
      score: Math.min(10, Math.max(0, score)),
      explanation:
        'Fallback scoring used due to AI error. Score based on keyword coverage.',
      feedback:
        'Include relevant keywords and provide more detailed technical explanations for better score.',
    };
  }
};

module.exports = { generateInterviewQuestions, gradeEssay };
