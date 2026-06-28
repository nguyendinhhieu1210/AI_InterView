// services/adaptive/adaptiveCore.js

// Cấu hình số câu hỏi mặc định
const TOTAL_QUESTIONS = 5;

// Cấu hình timeout
const SESSION_TIMEOUT_HOURS = 2;

// Đào sâu tối đa 2 câu/chủ đề
const MAX_DEEP_DIVE_PER_TOPIC = 2;

// Số câu trả lời tốt liên tiếp để chuyển topic
const GOOD_ANSWERS_THRESHOLD = 1;

// Các loại câu hỏi đa dạng
const QUESTION_TYPES = {
  CONCEPTUAL: 'conceptual',
  APPLICATION: 'application',
  SCENARIO: 'scenario',
  ADVANCED: 'advanced',
  BEST_PRACTICES: 'best_practices',
  EDGE_CASES: 'edge_cases',
  FUNDAMENTAL: 'fundamental',
};

// ==================== SCORING CONFIGURATION (THÊM MỚI) ====================

const SCORING = {
  // Điểm tối đa theo chất lượng câu trả lời
  MAX_SCORE_BY_QUALITY: {
    poor: 3, // Quá ngắn, không rõ ràng
    fair: 5, // Ngắn, thiếu chi tiết
    good: 8, // Đúng nhưng thiếu depth
    excellent: 10, // Đầy đủ, có ví dụ, depth
  },

  // Điểm trừ cho các lỗi
  PENALTIES: {
    OFF_TOPIC: 4,
    NO_EXAMPLE: 2,
    INCORRECT_INFO: 3,
    VAGUE: 2,
    MISSING_KEY_CONCEPT: 1.5,
    TOO_SHORT: 3,
    NO_DEPTH: 2,
    WRONG_CONCEPT: 5,
  },

  // Ngưỡng điểm
  THRESHOLDS: {
    EXCELLENT: 9,
    GOOD: 7,
    ADEQUATE: 5,
    POOR: 3,
  },

  // Độ dài tối thiểu để đạt điểm cao
  MIN_WORDS: {
    EXCELLENT: 50,
    GOOD: 30,
    ADEQUATE: 20,
    POOR: 10,
  },
};

// ==================== LANGUAGE SPECIFIC CONCEPTS ====================

const LANGUAGE_SPECIFIC_CONCEPTS = {
  javascript: {
    valid: [
      'Syntax',
      'Data Types',
      'Functions',
      'DOM',
      'OOP',
      'Error Handling',
      'Closures',
      'Hoisting',
      'Event Loop',
      'Promises',
      'Async/Await',
      'Prototypes',
      'This Binding',
      'Modules',
      'Classes',
      'Arrow Functions',
      'Destructuring',
      'Spread Operator',
      'Rest Parameters',
      'Template Literals',
      'Map',
      'Set',
      'WeakMap',
      'WeakSet',
      'Symbol',
      'Iterators',
      'Generators',
      'Proxy',
      'Reflect',
      'Strict Mode',
      'Type Coercion',
      'Equality',
    ],
    invalid: [
      'Interfaces',
      'Abstract Classes',
      'Generics',
      'Annotations',
      'Enums',
    ],
  },
  typescript: {
    valid: [
      'Syntax',
      'Data Types',
      'Functions',
      'Interfaces',
      'Classes',
      'Type Basics',
      'Generics',
      'Type Guards',
      'Advanced Types',
      'Decorators',
      'Type Manipulation',
      'Utility Types',
      'Modules',
      'Namespaces',
      'Enums',
      'Union Types',
      'Intersection Types',
      'Conditional Types',
      'Mapped Types',
      'Template Literal Types',
      'Type Inference',
    ],
    invalid: [],
  },
  java: {
    valid: [
      'Syntax',
      'Data Types',
      'Methods',
      'OOP',
      'Interfaces',
      'Exception Handling',
      'Generics',
      'Collections',
      'Streams',
      'Lambdas',
      'Concurrency',
      'JVM',
      'Memory Model',
      'Annotations',
      'Abstract Classes',
      'Enums',
      'Records',
      'Sealed Classes',
      'Pattern Matching',
      'Optional',
    ],
    invalid: [],
  },
  python: {
    valid: [
      'Syntax',
      'Data Types',
      'Functions',
      'Modules',
      'OOP',
      'Error Handling',
      'Decorators',
      'Generators',
      'Context Managers',
      'Metaclasses',
      'Asyncio',
      'Type Hints',
      'GIL',
      'Packaging',
      'List Comprehensions',
      'Duck Typing',
      'Dunder Methods',
      'Properties',
      'Descriptors',
      'Context Managers',
      'Iterators',
      'Coroutines',
      'Context Variables',
    ],
    invalid: ['Interfaces'],
  },
  'c++': {
    valid: [
      'Syntax',
      'Data Types',
      'Functions',
      'Memory Management',
      'OOP',
      'STL',
      'Pointers',
      'References',
      'Templates',
      'Smart Pointers',
      'Move Semantics',
      'RAII',
      'Concurrency',
      'Virtual Functions',
      'Abstract Classes',
      'Operator Overloading',
      'Friend Functions',
      'Namespaces',
      'Exception Handling',
      'Const Correctness',
    ],
    invalid: ['Interfaces'],
  },
  go: {
    valid: [
      'Syntax',
      'Data Types',
      'Functions',
      'Packages',
      'Structs',
      'Interfaces',
      'Goroutines',
      'Channels',
      'Reflection',
      'Error Handling',
      'Context',
      'Garbage Collection',
      'Testing',
      'Defer',
      'Panic',
      'Recover',
      'Methods',
      'Empty Interface',
      'Type Assertions',
      'Select',
    ],
    invalid: ['Generics', 'Inheritance', 'Exceptions'],
  },
  rust: {
    valid: [
      'Syntax',
      'Data Types',
      'Functions',
      'Modules',
      'Structs',
      'Enums',
      'Ownership',
      'Borrowing',
      'Lifetimes',
      'Traits',
      'Closures',
      'Error Handling',
      'Concurrency',
      'Macros',
      'Pattern Matching',
      'Option',
      'Result',
      'Generics',
      'Unsafe',
      'Smart Pointers',
      'Box',
      'Rc',
      'Arc',
    ],
    invalid: ['Interfaces', 'Inheritance', 'Null'],
  },
  'c#': {
    valid: [
      'Syntax',
      'Data Types',
      'Methods',
      'OOP',
      'Properties',
      'Exception Handling',
      'LINQ',
      'Delegates',
      'Events',
      'Async/Await',
      'Generics',
      'Reflection',
      'Attributes',
      'Interfaces',
      'Abstract Classes',
      'Structs',
      'Records',
      'Pattern Matching',
      'Nullable Types',
      'Extension Methods',
    ],
    invalid: [],
  },
  php: {
    valid: [
      'Syntax',
      'Data Types',
      'Functions',
      'Arrays',
      'OOP',
      'Error Handling',
      'Traits',
      'Namespaces',
      'Composer',
      'Type System',
      'Performance',
      'Interfaces',
      'Abstract Classes',
      'Generators',
      'Attributes',
      'Enums',
    ],
    invalid: [],
  },
  ruby: {
    valid: [
      'Syntax',
      'Data Types',
      'Methods',
      'Blocks',
      'OOP',
      'Modules',
      'Metaprogramming',
      'Mixins',
      'DSL',
      'Concurrency',
      'Gems',
      'Procs',
      'Lambdas',
      'Symbols',
      'Enumerable',
      'RSpec',
      'Yield',
      'Splats',
      'Hashes',
      'Open Classes',
    ],
    invalid: ['Interfaces'],
  },
};

// ==================== LANGUAGE FRAMEWORKS ====================

const LANGUAGE_FRAMEWORKS = {
  javascript: {
    frameworks: [
      'React',
      'Node.js',
      'Express',
      'Vue',
      'Angular',
      'Next.js',
      'NestJS',
      'Svelte',
      'Nuxt',
      'Gatsby',
    ],
    libraries: [
      'jQuery',
      'Axios',
      'Lodash',
      'Moment',
      'D3',
      'Three.js',
      'Redux',
      'Zustand',
      'React Router',
    ],
    invalid: [
      'Spring',
      'Django',
      'Flask',
      'Rails',
      'Laravel',
      'ASP.NET',
      'Hibernate',
      'JPA',
      'Struts',
      'JSF',
    ],
  },
  typescript: {
    frameworks: ['React', 'Node.js', 'Express', 'NestJS', 'Angular', 'Next.js'],
    libraries: ['TypeORM', 'Prisma', 'RxJS', 'Zod', 'class-validator'],
    invalid: [
      'Spring',
      'Django',
      'Flask',
      'Rails',
      'Laravel',
      'ASP.NET',
      'Hibernate',
    ],
  },
  java: {
    frameworks: [
      'Spring',
      'Spring Boot',
      'Hibernate',
      'JPA',
      'JSF',
      'Struts',
      'Play',
      'Grails',
    ],
    libraries: [
      'Lombok',
      'Guava',
      'Apache Commons',
      'Mockito',
      'JUnit',
      'Log4j',
    ],
    invalid: [
      'React',
      'Node.js',
      'Express',
      'Django',
      'Flask',
      'Rails',
      'Laravel',
    ],
  },
  python: {
    frameworks: ['Django', 'Flask', 'FastAPI', 'Pyramid', 'Tornado', 'Web2Py'],
    libraries: [
      'NumPy',
      'Pandas',
      'Requests',
      'SQLAlchemy',
      'Pytest',
      'Celery',
    ],
    invalid: ['Spring', 'React', 'Node.js', 'Express', 'Rails', 'Laravel'],
  },
  'c++': {
    frameworks: ['Qt', 'Boost', 'POCO', 'C++ REST SDK', 'CppCMS'],
    libraries: ['STL', 'OpenCV', 'Eigen'],
    invalid: ['Spring', 'Django', 'Rails', 'React', 'Node.js'],
  },
  'c#': {
    frameworks: [
      'ASP.NET',
      'Entity Framework',
      'WinForms',
      'WPF',
      'Xamarin',
      'Blazor',
      'MAUI',
    ],
    libraries: ['Newtonsoft.Json', 'AutoMapper', 'FluentValidation', 'MediatR'],
    invalid: ['Spring', 'React', 'Node.js', 'Django', 'Flask', 'Rails'],
  },
  go: {
    frameworks: ['Gin', 'Echo', 'Beego', 'Revel', 'Fiber', 'Chi'],
    libraries: ['Viper', 'Cobra', 'GORM', 'sqlx', 'Testify'],
    invalid: ['Spring', 'Django', 'Rails', 'React', 'Node.js', 'Laravel'],
  },
  rust: {
    frameworks: ['Actix', 'Rocket', 'Warp', 'Tokio', 'Axum', 'Tide'],
    libraries: ['Serde', 'Clap', 'Tokio', 'Hyper', 'Reqwest'],
    invalid: ['Spring', 'Django', 'Rails', 'React', 'Node.js', 'Laravel'],
  },
  php: {
    frameworks: [
      'Laravel',
      'Symfony',
      'CodeIgniter',
      'Zend',
      'CakePHP',
      'Slim',
    ],
    libraries: ['Composer', 'PHPUnit', 'Guzzle', 'Monolog', 'Carbon'],
    invalid: ['Spring', 'Django', 'React', 'Node.js', 'Rails', 'ASP.NET'],
  },
  ruby: {
    frameworks: ['Rails', 'Sinatra', 'Hanami', 'Padrino', 'Grape'],
    libraries: ['RSpec', 'Sidekiq', 'Devise', 'ActiveRecord', 'Pundit'],
    invalid: ['Spring', 'Django', 'React', 'Node.js', 'Laravel', 'ASP.NET'],
  },
};

// ==================== FRAMEWORK ROADMAPS (mới) ====================

const FRAMEWORK_ROADMAPS = {
  react: {
    fundamentals: [
      'Components (Functional & Class)',
      'JSX Syntax',
      'Props & PropTypes',
      'State & setState',
      'Lifecycle Methods & useEffect',
      'Hooks (useState, useEffect, useContext, useReducer)',
      'Event Handling',
      'Conditional Rendering',
      'Lists & Keys',
    ],
    advanced: [
      'Context API',
      'Redux & State Management',
      'Performance Optimization (memo, useCallback, useMemo)',
      'Custom Hooks',
      'React Router',
      'Error Boundaries',
      'Code Splitting & Lazy Loading',
      'Testing (Jest, React Testing Library)',
      'Server Side Rendering (Next.js)',
      'React Native',
    ],
  },
  angular: {
    fundamentals: [
      'Components',
      'Templates & Data Binding',
      'Directives',
      'Services & Dependency Injection',
      'Modules',
      'Routing',
      'Forms (Template-driven & Reactive)',
    ],
    advanced: [
      'Change Detection',
      'RxJS & Observables',
      'NgRx',
      'Custom Directives & Pipes',
      'Lazy Loading',
      'Angular Universal',
      'Testing (Jasmine, Karma)',
    ],
  },
  vue: {
    fundamentals: [
      'Vue Instance',
      'Template Syntax',
      'Data & Methods',
      'Computed Properties & Watchers',
      'Components & Props',
      'Events',
      'Lifecycle Hooks',
    ],
    advanced: [
      'Vuex (State Management)',
      'Vue Router',
      'Composition API',
      'Custom Directives',
      'Mixins',
      'Plugins',
      'SSR (Nuxt.js)',
      'Testing (Vue Test Utils)',
    ],
  },
  node: {
    fundamentals: [
      'Event Loop & Non-blocking I/O',
      'Modules (CommonJS, ES Modules)',
      'NPM & Package Management',
      'File System (fs)',
      'HTTP Module',
      'Streams & Buffers',
      'Event Emitters',
    ],
    advanced: [
      'Clustering & Child Processes',
      'Express.js Framework',
      'Middleware',
      'RESTful API Design',
      'Authentication (JWT, OAuth)',
      'Database Integration (MongoDB, SQL)',
      'Error Handling & Logging',
      'Testing (Mocha, Chai, Jest)',
      'Performance & Caching',
      'Deployment & DevOps',
    ],
  },
  // Thêm các framework khác nếu cần
  django: {
    fundamentals: [
      'Models & ORM',
      'Views & Templates',
      'URL Routing',
      'Forms & Validation',
      'Admin Interface',
      'Authentication',
    ],
    advanced: [
      'Class-based Views',
      'Middleware',
      'REST Framework',
      'Signals',
      'Celery & Async Tasks',
      'Caching',
      'Testing',
      'Deployment',
    ],
  },
  spring: {
    fundamentals: [
      'IoC & Dependency Injection',
      'Beans & Configuration',
      'Spring MVC',
      'Data Access (JPA)',
      'Transaction Management',
    ],
    advanced: [
      'Spring Boot',
      'Spring Security',
      'Microservices with Spring Cloud',
      'Reactive Programming (WebFlux)',
      'Testing (Mockito, JUnit)',
    ],
  },
  laravel: {
    fundamentals: [
      'Routing & Controllers',
      'Blade Templates',
      'Eloquent ORM',
      'Migrations & Seeders',
      'Authentication',
    ],
    advanced: [
      'Service Container',
      'Middlewares',
      'Queues & Jobs',
      'Events & Listeners',
      'Caching',
      'Testing (PHPUnit)',
    ],
  },
  rails: {
    fundamentals: [
      'MVC Architecture',
      'Active Record',
      'Routing',
      'Views (ERB)',
      'Controllers',
    ],
    advanced: [
      'Associations & Validations',
      'Callbacks',
      'RESTful API',
      'Action Cable (WebSockets)',
      'Testing (RSpec)',
      'Active Job',
    ],
  },
  'asp.net': {
    fundamentals: [
      'ASP.NET Core',
      'MVC Pattern',
      'Razor Pages',
      'Entity Framework Core',
      'Dependency Injection',
    ],
    advanced: [
      'Authentication & Authorization',
      'SignalR',
      'RESTful API',
      'Microservices',
      'Azure Integration',
      'Testing',
    ],
  },
};

// ==================== VALIDATION FUNCTIONS ====================

function isValidConceptForLanguage(concept, language) {
  if (!language) return true;

  const langKey = language.toLowerCase();
  const langConfig = LANGUAGE_SPECIFIC_CONCEPTS[langKey];
  if (!langConfig) return true;

  const conceptLower = concept.toLowerCase();

  for (const invalid of langConfig.invalid) {
    if (
      conceptLower.includes(invalid.toLowerCase()) ||
      invalid.toLowerCase().includes(conceptLower)
    ) {
      return false;
    }
  }

  return true;
}

function isValidFrameworkForLanguage(framework, language) {
  if (!language || !framework) return true;

  const langKey = language.toLowerCase();
  const langFrameworks = LANGUAGE_FRAMEWORKS[langKey];
  if (!langFrameworks) return true;

  const frameworkLower = framework.toLowerCase();

  for (const invalid of langFrameworks.invalid) {
    if (
      frameworkLower.includes(invalid.toLowerCase()) ||
      invalid.toLowerCase().includes(frameworkLower)
    ) {
      return false;
    }
  }

  return true;
}

function isQuestionValidForLanguage(question, language) {
  if (!language) return true;

  const langKey = language.toLowerCase();
  const langConfig = LANGUAGE_SPECIFIC_CONCEPTS[langKey];
  const langFrameworks = LANGUAGE_FRAMEWORKS[langKey];

  const questionLower = question.toLowerCase();

  if (langConfig) {
    for (const invalid of langConfig.invalid) {
      if (questionLower.includes(invalid.toLowerCase())) {
        return false;
      }
    }
  }

  if (langFrameworks) {
    for (const invalid of langFrameworks.invalid) {
      if (questionLower.includes(invalid.toLowerCase())) {
        return false;
      }
    }
  }

  return true;
}

// ==================== LANGUAGE DETECTION ====================

function detectProgrammingLanguage(answer) {
  const answerLower = answer.toLowerCase();

  const langPatterns = {
    'c++': /\b(c\+\+|cpp|cxx)\b/,
    python: /\b(python|py)\b/,
    java: /\b(java|jvm|spring|maven|gradle)\b/,
    javascript:
      /\b(javascript|js|node|npm|react|vue|angular|svelte|nextjs|nestjs)\b/,
    typescript: /\b(typescript|ts)\b/,
    go: /\b(go|golang|goroutine|channel)\b/,
    rust: /\b(rust|rustlang|ownership|borrowing)\b/,
    'c#': /\b(c#|csharp|dotnet|netcore)\b/,
    php: /\b(php|laravel|symfony|composer)\b/,
    ruby: /\b(ruby|rails|gem|metaprogramming)\b/,
    sql: /\b(sql|mysql|postgresql|query|database)\b/,
  };

  const frameworkPatterns = {
    java: /\b(spring|hibernate|jpa|struts|jsf)\b/,
    python: /\b(django|flask|fastapi|pyramid)\b/,
    javascript: /\b(react|vue|angular|express|nextjs|nestjs|svelte)\b/,
    'c#': /\b(asp\.net|entity framework|winforms|wpf|blazor)\b/,
    php: /\b(laravel|symfony|codeigniter|zend|cakephp)\b/,
    ruby: /\b(rails|sinatra|hanami)\b/,
    go: /\b(gin|echo|beego|revel|fiber)\b/,
    rust: /\b(actix|rocket|warp|tokio|axum)\b/,
    'c++': /\b(qt|boost|poco)\b/,
  };

  for (const [lang, pattern] of Object.entries(langPatterns)) {
    if (pattern.test(answerLower)) {
      return lang;
    }
  }

  for (const [lang, pattern] of Object.entries(frameworkPatterns)) {
    if (pattern.test(answerLower)) {
      return lang;
    }
  }

  return null;
}

// ==================== FRAMEWORK DETECTION ====================

function detectFramework(text) {
  if (!text) return null;
  const lower = text.toLowerCase().trim();
  const frameworks = [
    'react',
    'angular',
    'vue',
    'node',
    'django',
    'spring',
    'laravel',
    'rails',
    'asp.net',
    'next.js',
    'nestjs',
    'svelte',
    'fastapi',
    'flask',
    'express',
    'gin',
    'actix',
  ];
  for (const fw of frameworks) {
    if (lower.includes(fw)) return fw;
  }
  return null;
}

// ==================== ROADMAP FUNCTIONS ====================

function generateDynamicRoadmap(topic) {
  const topicLower = topic.toLowerCase().trim();

  const detectedFramework = detectFramework(topic);
  if (detectedFramework && FRAMEWORK_ROADMAPS[detectedFramework]) {
    const roadmap = FRAMEWORK_ROADMAPS[detectedFramework];
    return {
      structured: {
        Fundamentals: roadmap.fundamentals,
        'Advanced Concepts': roadmap.advanced,
      },
      flattened: [...roadmap.fundamentals, ...roadmap.advanced],
    };
  }

  const detectedLang = detectProgrammingLanguage(topic);
  const langRoadmaps = {
    javascript: {
      fundamentals: [
        'Syntax',
        'Data Types',
        'Functions',
        'DOM',
        'OOP',
        'Error Handling',
      ],
      advanced: [
        'Closures',
        'Hoisting',
        'Event Loop',
        'Promises',
        'Async/Await',
        'Prototypes',
        'This Binding',
        'Modules',
      ],
    },
    typescript: {
      fundamentals: [
        'Syntax',
        'Data Types',
        'Functions',
        'Interfaces',
        'Classes',
        'Type Basics',
      ],
      advanced: [
        'Generics',
        'Type Guards',
        'Advanced Types',
        'Decorators',
        'Type Manipulation',
        'Utility Types',
      ],
    },
    java: {
      fundamentals: [
        'Syntax',
        'Data Types',
        'Methods',
        'OOP',
        'Interfaces',
        'Exception Handling',
      ],
      advanced: [
        'Generics',
        'Collections',
        'Streams',
        'Lambdas',
        'Concurrency',
        'JVM',
        'Memory Model',
      ],
    },
    python: {
      fundamentals: [
        'Syntax',
        'Data Types',
        'Functions',
        'Modules',
        'OOP',
        'Error Handling',
      ],
      advanced: [
        'Decorators',
        'Generators',
        'Context Managers',
        'Metaclasses',
        'Asyncio',
        'Type Hints',
        'GIL',
      ],
    },
    'c++': {
      fundamentals: [
        'Syntax',
        'Data Types',
        'Functions',
        'Memory Management',
        'OOP',
        'STL',
      ],
      advanced: [
        'Pointers',
        'References',
        'Templates',
        'Smart Pointers',
        'Move Semantics',
        'RAII',
        'Concurrency',
      ],
    },
    go: {
      fundamentals: [
        'Syntax',
        'Data Types',
        'Functions',
        'Packages',
        'Structs',
        'Interfaces',
      ],
      advanced: [
        'Goroutines',
        'Channels',
        'Reflection',
        'Error Handling',
        'Context',
        'Garbage Collection',
      ],
    },
    rust: {
      fundamentals: [
        'Syntax',
        'Data Types',
        'Functions',
        'Modules',
        'Structs',
        'Enums',
      ],
      advanced: [
        'Ownership',
        'Borrowing',
        'Lifetimes',
        'Traits',
        'Closures',
        'Error Handling',
        'Concurrency',
      ],
    },
    'c#': {
      fundamentals: [
        'Syntax',
        'Data Types',
        'Methods',
        'OOP',
        'Properties',
        'Exception Handling',
      ],
      advanced: [
        'LINQ',
        'Delegates',
        'Events',
        'Async/Await',
        'Generics',
        'Reflection',
        'Attributes',
      ],
    },
    php: {
      fundamentals: [
        'Syntax',
        'Data Types',
        'Functions',
        'Arrays',
        'OOP',
        'Error Handling',
      ],
      advanced: [
        'Traits',
        'Namespaces',
        'Composer',
        'Type System',
        'Performance',
      ],
    },
    ruby: {
      fundamentals: [
        'Syntax',
        'Data Types',
        'Methods',
        'Blocks',
        'OOP',
        'Modules',
      ],
      advanced: ['Metaprogramming', 'Mixins', 'DSL', 'Concurrency', 'Gems'],
    },
  };

  if (detectedLang && langRoadmaps[detectedLang]) {
    const roadmap = langRoadmaps[detectedLang];
    const validFundamentals = roadmap.fundamentals.filter((concept) =>
      isValidConceptForLanguage(concept, detectedLang)
    );
    const validAdvanced = roadmap.advanced.filter((concept) =>
      isValidConceptForLanguage(concept, detectedLang)
    );

    return {
      structured: {
        Fundamentals: validFundamentals,
        'Advanced Concepts': validAdvanced,
      },
      flattened: [...validFundamentals, ...validAdvanced],
    };
  }

  return generateGenericRoadmap(topic);
}

function generateGenericRoadmap(topic) {
  const categories = {
    fundamentals: [
      `Basics of ${topic}`,
      `Core Concepts of ${topic}`,
      `Essential ${topic} Principles`,
    ],
    applications: [
      `Practical Applications of ${topic}`,
      `${topic} in Real-World Scenarios`,
    ],
    advanced: [
      `Advanced ${topic} Techniques`,
      `${topic} Best Practices`,
      `Optimizing ${topic}`,
    ],
    tools: [`${topic} Tools and Ecosystem`, `Debugging ${topic} Applications`],
  };

  const flattened = [
    ...categories.fundamentals.slice(0, 2),
    ...categories.applications.slice(0, 2),
    ...categories.advanced.slice(0, 2),
    ...categories.tools.slice(0, 1),
  ].slice(0, 8);

  return {
    structured: {
      Fundamentals: categories.fundamentals.slice(0, 2),
      Applications: categories.applications.slice(0, 2),
      Advanced: categories.advanced.slice(0, 2),
      'Tools & Ecosystem': categories.tools.slice(0, 1),
    },
    flattened: flattened,
  };
}

function getRoadmapForTopic(topic) {
  if (!topic) return generateGenericRoadmap('Programming');
  return generateDynamicRoadmap(topic);
}

function pickFirstSubtopic(structured) {
  const keys = Object.keys(structured);
  if (keys.length === 0) return 'Introduction';
  const firstKey = keys[0];
  const children = structured[firstKey];
  if (Array.isArray(children) && children.length > 0) {
    return children[0];
  }
  return firstKey;
}

// ==================== QUESTION FUNCTIONS ====================

function getFallbackQuestion(
  subtopic,
  questionType,
  topic,
  difficulty = 'medium'
) {
  const detectedLang = detectProgrammingLanguage(topic);

  if (detectedLang) {
    if (
      !isValidConceptForLanguage(subtopic, detectedLang) ||
      !isValidFrameworkForLanguage(subtopic, detectedLang)
    ) {
      const roadmap = getRoadmapForTopic(topic);
      const validConcepts = roadmap.flattened.filter(
        (c) =>
          isValidConceptForLanguage(c, detectedLang) &&
          isValidFrameworkForLanguage(c, detectedLang)
      );
      if (validConcepts.length > 0) {
        subtopic =
          validConcepts[Math.floor(Math.random() * validConcepts.length)];
      }
    }
  }

  const langSpecificQuestions = {
    javascript: {
      conceptual: [
        `Can you explain ${subtopic} in JavaScript and its ecosystem?`,
      ],
      application: [
        `How would you implement ${subtopic} in a JavaScript application?`,
      ],
      scenario: [
        `You're debugging a JavaScript application where ${subtopic} is causing problems. How would you fix it?`,
      ],
      advanced: [
        `What are advanced patterns for ${subtopic} in modern JavaScript?`,
      ],
    },
    // ... các ngôn ngữ khác tương tự
  };

  if (detectedLang && langSpecificQuestions[detectedLang]) {
    const langQuestions = langSpecificQuestions[detectedLang];
    const questions = langQuestions[questionType] || langQuestions.conceptual;
    return questions[Math.floor(Math.random() * questions.length)];
  }

  const genericFallbacks = {
    conceptual: [
      `Can you explain what ${subtopic} is and why it's important in ${topic}?`,
    ],
    application: [
      `How would you implement ${subtopic} in a real-world ${topic} project?`,
    ],
    scenario: [
      `Imagine you're building a ${topic} application and need ${subtopic}. How would you approach it?`,
    ],
    advanced: [`What are advanced techniques for ${subtopic} in ${topic}?`],
    best_practices: [
      `What are the best practices for ${subtopic} in ${topic}?`,
    ],
    edge_cases: [
      `What are the edge cases you need to consider with ${subtopic} in ${topic}?`,
    ],
    fundamental: [`What is ${subtopic} and why is it fundamental in ${topic}?`],
  };

  const questions =
    genericFallbacks[questionType] || genericFallbacks.conceptual;
  return questions[Math.floor(Math.random() * questions.length)];
}

// ==================== FALLBACK IDEAL ANSWER ====================

function getFallbackIdealAnswer(subtopic, topic) {
  return `${subtopic} is a fundamental concept in ${topic} that every developer should understand thoroughly. To master this concept, you need to grasp its core principles, how it works under the hood, and when to apply it effectively in real-world projects.

The key to understanding ${subtopic} lies in recognizing its role in solving specific problems and improving code quality. When you implement ${subtopic}, you should consider factors like performance implications, maintainability, and how it integrates with other parts of your system.

In practice, ${subtopic} is used extensively in building scalable applications, handling complex logic, and optimizing system performance. For example, you might use it to manage state, handle asynchronous operations, or structure your code for better reusability.

One common mistake developers make with ${subtopic} is overcomplicating the implementation or using it in scenarios where simpler solutions would suffice. To avoid this, always consider the specific requirements of your use case and whether ${subtopic} is the right tool for the job.

When working with ${subtopic}, follow these best practices: keep your implementation clean and focused, document your code clearly, and test thoroughly to ensure reliability. Pay attention to edge cases and potential failure points.

Ultimately, mastering ${subtopic} will make you a more effective ${topic} developer, enabling you to write cleaner, more maintainable code and solve complex problems with confidence.`;
}

// ==================== ANSWER ANALYSIS ====================

function isAnswerUnknownOrTooShort(answer) {
  if (!answer) return true;
  const trimmed = answer.trim().toLowerCase();

  const unknownPatterns = [
    'không biết',
    'ko biết',
    'khong biet',
    "i don't know",
    'dont know',
    'not sure',
    'tôi không biết',
    'tôi ko biết',
    'no idea',
    'no clue',
    'not know',
    '???',
    '...',
  ];

  for (const pattern of unknownPatterns) {
    if (trimmed.includes(pattern)) return true;
  }

  const wordCount = trimmed.split(/\s+/).length;
  if (wordCount < 5) return true;

  return false;
}

// ==================== CORE FUNCTIONS ====================

function normalizeQuestion(q) {
  return q
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .toLowerCase();
}

function isSessionTimedOut(session) {
  const lastUpdate = session.updatedAt || session.startedAt;
  const hoursInactive = (new Date() - new Date(lastUpdate)) / (1000 * 60 * 60);
  return hoursInactive > SESSION_TIMEOUT_HOURS;
}

function analyzeAnswerQuality(answer) {
  const words = answer.trim().split(/\s+/).length;
  const hasCodeBlock = /```/.test(answer);
  const hasTechnicalTerms =
    /function|class|const|let|var|return|import|export|async|await|promise|callback|closure|prototype|component|props|state|hook|effect|render|virtual dom|bundle|module|stream|buffer|event loop|cluster|middleware|pointer|reference|template|generic|goroutine|channel|ownership|borrowing|trait|macro|linq|delegate|metaprogramming|gem|rails/i.test(
      answer
    );

  return {
    wordCount: words,
    tooShort: words < 15,
    medium: words >= 15 && words < 30,
    detailed: words >= 30,
    hasCodeBlock,
    hasTechnicalTerms,
    quality:
      words >= 50 && hasTechnicalTerms
        ? 'excellent'
        : words >= 30
          ? 'good'
          : words >= 15
            ? 'fair'
            : 'poor',
  };
}

function detectMissingConcepts(subtopic, answer) {
  const missing = [];
  const lowerAnswer = answer.toLowerCase();

  const commonConcepts = [
    'syntax',
    'data type',
    'variable',
    'function',
    'class',
    'object',
    'inheritance',
    'polymorphism',
    'encapsulation',
    'abstraction',
    'memory management',
    'garbage collection',
    'error handling',
    'exception',
    'debugging',
    'testing',
    'performance',
  ];

  const langSpecificConcepts = {
    'c++': [
      'pointer',
      'reference',
      'template',
      'stl',
      'smart pointer',
      'move semantics',
      'raii',
    ],
    python: [
      'decorator',
      'generator',
      'context manager',
      'duck typing',
      'list comprehension',
      'asyncio',
      'gil',
    ],
    java: [
      'generic',
      'stream',
      'lambda',
      'annotation',
      'interface',
      'abstract class',
      'jvm',
    ],
    javascript: [
      'closure',
      'prototype',
      'promise',
      'async/await',
      'event loop',
      'this binding',
    ],
    typescript: [
      'generic',
      'type guard',
      'utility type',
      'decorator',
      'interface',
      'enum',
    ],
    go: ['goroutine', 'channel', 'interface', 'defer', 'panic', 'recover'],
    rust: ['ownership', 'borrowing', 'lifetime', 'trait', 'match', 'unsafe'],
  };

  let conceptCount = 0;
  for (const concept of commonConcepts) {
    if (lowerAnswer.includes(concept)) conceptCount++;
  }
  if (conceptCount < 3) {
    missing.push('core concepts');
  }

  const detectedLang = detectProgrammingLanguage(answer);
  if (detectedLang && langSpecificConcepts[detectedLang]) {
    let langConceptCount = 0;
    for (const concept of langSpecificConcepts[detectedLang]) {
      if (lowerAnswer.includes(concept)) langConceptCount++;
    }
    if (langConceptCount < 2) {
      missing.push(`${detectedLang}-specific concepts`);
    }
  }

  return missing.slice(0, 3);
}

function getNextQuestionType(
  answerQuality,
  questionTypeHistory = [],
  consecutiveDeepDives = 0,
  goodAnswersCount = 0,
  isUnknown = false
) {
  const quality = answerQuality?.quality || 'fair';

  if (isUnknown) {
    return QUESTION_TYPES.FUNDAMENTAL;
  }

  let conceptualCount = 0;
  for (let i = questionTypeHistory.length - 1; i >= 0; i--) {
    if (questionTypeHistory[i] === QUESTION_TYPES.CONCEPTUAL) {
      conceptualCount++;
    } else {
      break;
    }
  }

  if (conceptualCount >= 2 && Math.random() < 0.7) {
    return QUESTION_TYPES.APPLICATION;
  }

  if (consecutiveDeepDives >= MAX_DEEP_DIVE_PER_TOPIC) {
    return QUESTION_TYPES.CONCEPTUAL;
  }

  if (goodAnswersCount >= GOOD_ANSWERS_THRESHOLD) {
    if (Math.random() < 0.6 && consecutiveDeepDives < MAX_DEEP_DIVE_PER_TOPIC) {
      const deepTypes = [QUESTION_TYPES.APPLICATION, QUESTION_TYPES.SCENARIO];
      return deepTypes[Math.floor(Math.random() * deepTypes.length)];
    }
    return QUESTION_TYPES.CONCEPTUAL;
  }

  if (quality === 'excellent') {
    if (Math.random() < 0.7) return QUESTION_TYPES.CONCEPTUAL;
    if (consecutiveDeepDives < MAX_DEEP_DIVE_PER_TOPIC) {
      const deepTypes = [
        QUESTION_TYPES.APPLICATION,
        QUESTION_TYPES.SCENARIO,
        QUESTION_TYPES.ADVANCED,
      ];
      return deepTypes[Math.floor(Math.random() * deepTypes.length)];
    }
    return QUESTION_TYPES.CONCEPTUAL;
  }

  if (quality === 'good') {
    if (Math.random() < 0.6) return QUESTION_TYPES.CONCEPTUAL;
    if (consecutiveDeepDives < MAX_DEEP_DIVE_PER_TOPIC) {
      return QUESTION_TYPES.APPLICATION;
    }
    return QUESTION_TYPES.CONCEPTUAL;
  }

  if (quality === 'fair') {
    if (Math.random() < 0.5) return QUESTION_TYPES.CONCEPTUAL;
    return QUESTION_TYPES.FUNDAMENTAL;
  }

  return QUESTION_TYPES.FUNDAMENTAL;
}

function getAdaptiveDifficulty(answerQuality) {
  const quality = answerQuality?.quality || 'fair';
  if (quality === 'excellent') return 'hard';
  if (quality === 'good') return 'medium';
  if (quality === 'fair') return 'medium';
  return 'easy';
}

function isValidAiQuestion(question) {
  if (!question || question.length < 5) return false;
  const trimmed = question.trim();
  if (trimmed.endsWith('?') || trimmed.includes('?')) return true;
  return false;
}

function calculateSimilarity(str1, str2) {
  const set1 = new Set(str1.split(' '));
  const set2 = new Set(str2.split(' '));
  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size;
}

function isQuestionTooSimilar(question, askedQuestions, threshold = 0.6) {
  const normalized = normalizeQuestion(question);
  for (const asked of askedQuestions || []) {
    const sim = calculateSimilarity(normalized, asked);
    if (sim > threshold) return true;
  }
  return false;
}

function buildTopicBreakdown(questionBreakdown) {
  const topics = {};
  for (const q of questionBreakdown) {
    const subtopic = q.subtopic || 'General';
    if (!topics[subtopic]) {
      topics[subtopic] = { questions: [], totalScore: 0, count: 0 };
    }
    topics[subtopic].questions.push(q);
    topics[subtopic].totalScore += q.score || 0;
    topics[subtopic].count += 1;
  }

  const result = {};
  for (const [topic, data] of Object.entries(topics)) {
    result[topic] = {
      averageScore:
        data.count > 0
          ? parseFloat((data.totalScore / data.count).toFixed(1))
          : 0,
      questionCount: data.count,
      questions: data.questions,
    };
  }
  return result;
}

// ==================== EXPORTS ====================

module.exports = {
  TOTAL_QUESTIONS,
  SESSION_TIMEOUT_HOURS,
  MAX_DEEP_DIVE_PER_TOPIC,
  GOOD_ANSWERS_THRESHOLD,
  QUESTION_TYPES,
  SCORING, // EXPORT MỚI
  LANGUAGE_SPECIFIC_CONCEPTS,
  LANGUAGE_FRAMEWORKS,
  FRAMEWORK_ROADMAPS,
  getRoadmapForTopic,
  pickFirstSubtopic,
  normalizeQuestion,
  isSessionTimedOut,
  analyzeAnswerQuality,
  detectMissingConcepts,
  getNextQuestionType,
  getAdaptiveDifficulty,
  isValidAiQuestion,
  getFallbackQuestion,
  isQuestionTooSimilar,
  calculateSimilarity,
  buildTopicBreakdown,
  detectProgrammingLanguage,
  detectFramework,
  generateDynamicRoadmap,
  generateGenericRoadmap,
  isValidConceptForLanguage,
  isValidFrameworkForLanguage,
  isQuestionValidForLanguage,
  getFallbackIdealAnswer,
  isAnswerUnknownOrTooShort,
};
