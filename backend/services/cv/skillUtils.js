// ─── KEYWORD LISTS ────────────────────────────────────────────────────────────
// Nguyên tắc phân loại:
//   frontend     → ngôn ngữ/framework UI
//   backend      → runtime, framework server, auth lib, protocol
//   database     → DB engine, ORM
//   theory       → khái niệm/nguyên lý kỹ thuật
//   devops       → công cụ hạ tầng, CI/CD, cloud, deployment

const FRONTEND_KEYWORDS = [
  'react', 'react js', 'reactjs', 'react.js',
  'next.js', 'nextjs',
  'vue.js', 'vuejs', 'vue',
  'angular',
  'html', 'html5',
  'css', 'css3',
  'tailwind css', 'tailwind',
  'javascript', 'js',
  'typescript', 'ts',
  'redux', 'zustand', 'recoil',
  'figma',
  'sass', 'scss',
  'vite', 'webpack',
  'svelte',
];

const BACKEND_KEYWORDS = [
  'node.js', 'nodejs', 'node',
  'express.js', 'expressjs', 'express',
  'nestjs', 'nest.js',
  'fastify',
  'django', 'flask', 'fastapi',
  'spring boot', 'springboot',
  'laravel',
  'rest api', 'restful api', 'restful apis',
  'graphql',
  'websocket', 'web socket',
  'socket.io',
  'jwt', 'json web token',
  'bcrypt',
  'oauth', 'oauth2',
  'grpc',
  'kafka', 'rabbitmq',
  'redis',
];

const DATABASE_KEYWORDS = [
  'mongodb', 'mongo',
  'mongoose',
  'mysql',
  'postgresql', 'postgres',
  'sql server', 'mssql',
  'sqlite',
  'firebase', 'firestore',
  'supabase',
  'prisma',
  'typeorm', 'sequelize',
  'elasticsearch',
];

// Lý thuyết / nguyên lý kỹ thuật — KHÔNG phải tool, KHÔNG phải framework
const THEORY_KEYWORDS = [
  'oop', 'object oriented',
  'solid',
  'clean code',
  'design pattern', 'design patterns',
  'mvc', 'mvvm',
  'microservices',
  'tdd', 'bdd',
  'algorithm', 'algorithms',
  'data structure', 'data structures',
  'dsa',
  'system design',
  'rest', 'restful',
  'ci cd', 'ci/cd principles',
  'agile', 'scrum',
];

// Công cụ hạ tầng, CI/CD, cloud, deployment platform
const DEVOPS_KEYWORDS = [
  'git', 'github', 'gitlab', 'bitbucket',
  'docker',
  'kubernetes', 'k8s',
  'ci/cd',
  'github actions',
  'jenkins',
  'aws', 'amazon web services',
  'gcp', 'google cloud',
  'azure',
  'vercel',
  'render',
  'heroku',
  'netlify',
  'postman',
  'nginx',
  'linux',
  'bash', 'shell',
];

// ─── NORMALIZE ────────────────────────────────────────────────────────────────

function normalizeSkill(skill) {
  if (!skill) return '';
  return skill
    .toLowerCase()
    .normalize('NFC')
    .replace(/[^\p{L}\p{N}\s.+#/-]/gu, ' ')
    .replace(/\s+/g, ' ')
    // fix broken spacing
    .replace(/\bjw\s*t\b/g, 'jwt')
    .replace(/\breact\s*j\s*s\b/g, 'react.js')
    .replace(/\bmongo\s*db\b/g, 'mongodb')
    .replace(/\bnode\s*js\b/g, 'node.js')
    .replace(/\bexpress\s*js\b/g, 'express.js')
    .replace(/\bnest\s*js\b/g, 'nestjs')
    .replace(/\bnext\s*js\b/g, 'next.js')
    .replace(/\btailwind\s*css\b/g, 'tailwind css')
    .replace(/\bjava\s*script\b/g, 'javascript')
    .replace(/\btype\s*script\b/g, 'typescript')
    .replace(/\bgit\s*hub\b/g, 'github')
    .replace(/\bgit\s*lab\b/g, 'gitlab')
    .replace(/\brest\s*ful?\s*api[s]?\b/g, 'restful apis')
    .replace(/\brest\s*api[s]?\b/g, 'rest api')
    .replace(/\bgraph\s*ql\b/g, 'graphql')
    .replace(/\bspring\s*boot\b/g, 'spring boot')
    .replace(/\bsql\s*server\b/g, 'sql server')
    .replace(/\bgithub\s*actions\b/g, 'github actions')
    .replace(/\bdata\s*structures?\b/g, 'data structure')
    .replace(/\bdesign\s*patterns?\b/g, 'design pattern')
    .replace(/\bci\s*\/?\s*cd\b/g, 'ci/cd')
    .trim();
}

// ─── FORMAT (display name) ────────────────────────────────────────────────────

const FORMAT_MAP = {
  'react': 'React.js', 'react js': 'React.js', 'reactjs': 'React.js', 'react.js': 'React.js',
  'next.js': 'Next.js', 'nextjs': 'Next.js',
  'vue.js': 'Vue.js', 'vuejs': 'Vue.js', 'vue': 'Vue.js',
  'angular': 'Angular',
  'html': 'HTML', 'html5': 'HTML5',
  'css': 'CSS', 'css3': 'CSS3',
  'tailwind css': 'Tailwind CSS', 'tailwind': 'Tailwind CSS',
  'javascript': 'JavaScript', 'js': 'JavaScript',
  'typescript': 'TypeScript', 'ts': 'TypeScript',
  'redux': 'Redux',
  'figma': 'Figma',
  'node.js': 'Node.js', 'nodejs': 'Node.js', 'node': 'Node.js',
  'express.js': 'Express.js', 'expressjs': 'Express.js', 'express': 'Express.js',
  'nestjs': 'NestJS', 'nest.js': 'NestJS',
  'spring boot': 'Spring Boot',
  'django': 'Django', 'flask': 'Flask', 'fastapi': 'FastAPI',
  'rest api': 'REST API', 'restful api': 'RESTful API', 'restful apis': 'RESTful APIs',
  'graphql': 'GraphQL',
  'websocket': 'WebSocket', 'web socket': 'WebSocket',
  'socket.io': 'Socket.IO',
  'jwt': 'JWT', 'json web token': 'JWT',
  'bcrypt': 'bcrypt',
  'oauth': 'OAuth', 'oauth2': 'OAuth2',
  'kafka': 'Kafka', 'rabbitmq': 'RabbitMQ',
  'redis': 'Redis',
  'mongodb': 'MongoDB', 'mongo': 'MongoDB',
  'mongoose': 'Mongoose',
  'mysql': 'MySQL',
  'postgresql': 'PostgreSQL', 'postgres': 'PostgreSQL',
  'sql server': 'SQL Server', 'mssql': 'SQL Server',
  'sqlite': 'SQLite',
  'firebase': 'Firebase', 'firestore': 'Firestore',
  'prisma': 'Prisma',
  'typeorm': 'TypeORM', 'sequelize': 'Sequelize',
  'oop': 'OOP', 'object oriented': 'OOP',
  'solid': 'SOLID',
  'clean code': 'Clean Code',
  'design pattern': 'Design Patterns', 'design patterns': 'Design Patterns',
  'mvc': 'MVC', 'mvvm': 'MVVM',
  'microservices': 'Microservices',
  'tdd': 'TDD', 'bdd': 'BDD',
  'algorithm': 'Algorithms', 'algorithms': 'Algorithms',
  'data structure': 'Data Structures', 'data structures': 'Data Structures',
  'dsa': 'DSA',
  'system design': 'System Design',
  'rest': 'REST', 'restful': 'RESTful',
  'agile': 'Agile', 'scrum': 'Scrum',
  'git': 'Git',
  'github': 'GitHub', 'gitlab': 'GitLab', 'bitbucket': 'Bitbucket',
  'docker': 'Docker',
  'kubernetes': 'Kubernetes', 'k8s': 'Kubernetes',
  'ci/cd': 'CI/CD',
  'github actions': 'GitHub Actions',
  'jenkins': 'Jenkins',
  'aws': 'AWS',
  'gcp': 'GCP', 'google cloud': 'GCP',
  'azure': 'Azure',
  'vercel': 'Vercel',
  'render': 'Render',
  'heroku': 'Heroku',
  'netlify': 'Netlify',
  'postman': 'Postman',
  'nginx': 'Nginx',
  'linux': 'Linux',
};

function formatSkillName(skill) {
  const norm = normalizeSkill(skill);
  return FORMAT_MAP[norm] || skill.trim();
}

// ─── CLASSIFY ─────────────────────────────────────────────────────────────────

function exactMatch(skill, keywordList) {
  const normalized = normalizeSkill(skill);
  return keywordList.some(kw => normalized === normalizeSkill(kw));
}

/**
 * Classify một mảng skill strings vào 5 category.
 * Skills không match category nào sẽ bị bỏ qua (không phải technical core).
 */
function classifySkills(skillsArray) {
  const result = {
    frontend: new Set(),
    backend: new Set(),
    database: new Set(),
    theory: new Set(),
    devops: new Set(),
  };

  for (const skill of skillsArray) {
    const fmt = formatSkillName(skill);
    if      (exactMatch(skill, FRONTEND_KEYWORDS))  result.frontend.add(fmt);
    else if (exactMatch(skill, BACKEND_KEYWORDS))   result.backend.add(fmt);
    else if (exactMatch(skill, DATABASE_KEYWORDS))  result.database.add(fmt);
    else if (exactMatch(skill, THEORY_KEYWORDS))    result.theory.add(fmt);
    else if (exactMatch(skill, DEVOPS_KEYWORDS))    result.devops.add(fmt);
    // không match → bỏ (nodemailer, monaco editor, stockfish, v.v.)
  }

  return {
    frontend: [...result.frontend],
    backend:  [...result.backend],
    database: [...result.database],
    theory:   [...result.theory],
    devops:   [...result.devops],
  };
}

/**
 * Extract skills từ raw text (JD hoặc CV text thô) bằng regex.
 */
function extractSkillsByRegex(text) {
  const lower = text.toLowerCase();
  const found = {
    frontend: new Set(), backend: new Set(), database: new Set(),
    theory: new Set(), devops: new Set(),
  };

  const test = (kw, set) => {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(lower)) set.add(formatSkillName(kw));
  };

  FRONTEND_KEYWORDS.forEach(kw => test(kw, found.frontend));
  BACKEND_KEYWORDS.forEach(kw  => test(kw, found.backend));
  DATABASE_KEYWORDS.forEach(kw => test(kw, found.database));
  THEORY_KEYWORDS.forEach(kw   => test(kw, found.theory));
  DEVOPS_KEYWORDS.forEach(kw   => test(kw, found.devops));

  return {
    frontend: [...found.frontend],
    backend:  [...found.backend],
    database: [...found.database],
    theory:   [...found.theory],
    devops:   [...found.devops],
  };
}

// ─── UTILS ────────────────────────────────────────────────────────────────────

function isValidSkill(skill) {
  if (!skill || skill.length < 2) return false;
  const invalid = ['sol', 'apis', 'restap is', 'agile work ow'];
  if (invalid.includes(skill.toLowerCase())) return false;
  return /[\p{L}]/u.test(skill);
}

function uniqueCaseInsensitive(arr) {
  const map = new Map();
  for (const item of arr) {
    const norm = normalizeSkill(item);
    if (!map.has(norm)) map.set(norm, formatSkillName(item));
  }
  return [...map.values()];
}

module.exports = {
  FRONTEND_KEYWORDS,
  BACKEND_KEYWORDS,
  DATABASE_KEYWORDS,
  THEORY_KEYWORDS,
  DEVOPS_KEYWORDS,
  normalizeSkill,
  exactMatch,
  classifySkills,
  extractSkillsByRegex,
  formatSkillName,
  isValidSkill,
  uniqueCaseInsensitive,
};