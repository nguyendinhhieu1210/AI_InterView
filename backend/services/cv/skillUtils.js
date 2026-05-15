const FRONTEND_KEYWORDS = ['react', 'react js', 'reactjs', 'react.js', 'next.js', 'vue.js', 'angular', 'html5', 'css3', 'tailwind css', 'javascript', 'typescript', 'redux', 'figma'];
const BACKEND_KEYWORDS = ['node.js', 'nodejs', 'express.js', 'express', 'mongoose', 'jwt', 'bcrypt', 'mongodb', 'mysql', 'postgresql', 'rest api', 'graphql', 'nestjs'];
const THEORY_KEYWORDS = ['oop', 'SOLID', 'clean code', 'design pattern', 'mvc', 'microservices', 'tdd', 'algorithm', 'data structure', 'system design'];
const DEVOPS_KEYWORDS = ['git', 'github', 'docker', 'kubernetes', 'ci/cd', 'aws', 'jenkins', 'heroku', 'postman'];

function normalizeSkill(skill) {
  if (!skill) return '';

  return skill
    .toLowerCase()
    .normalize('NFC')
    .replace(/[^\p{L}\p{N}\s.+#/-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\bjw\s*t\b/g, 'jwt')
    .replace(/\breact\s*j\s*s\b/g, 'reactjs')
    .replace(/\bmongo\s*db\b/g, 'mongodb')
    .replace(/\bnode\s*js\b/g, 'node.js')
    .replace(/\bexpress\s*js\b/g, 'express.js')
    .replace(/\btailwind\s*css\b/g, 'tailwind css')
    .replace(/\bjava\s*script\b/g, 'javascript')
    .replace(/\bgit\s*hub\b/g, 'github')
    .replace(/\brest\s*api\b/g, 'rest api')
    .replace(/\bgraph\s*ql\b/g, 'graphql')
    .replace(/\bnext\s*js\b/g, 'next.js')
    .trim();
}

function exactMatch(skill, keywordList) {
  const normalized = normalizeSkill(skill);
  return keywordList.some(kw => normalized === normalizeSkill(kw));
}

function classifySkills(skillsArray) {
  const result = { frontend: new Set(), backend: new Set(), theory: new Set(), devops: new Set() };
  for (let skill of skillsArray) {
    if (exactMatch(skill, FRONTEND_KEYWORDS)) result.frontend.add(formatSkillName(skill));
    else if (exactMatch(skill, BACKEND_KEYWORDS)) result.backend.add(formatSkillName(skill));
    else if (exactMatch(skill, THEORY_KEYWORDS)) result.theory.add(formatSkillName(skill));
    else if (exactMatch(skill, DEVOPS_KEYWORDS)) result.devops.add(formatSkillName(skill));
  }
  return {
    frontend: [...result.frontend],
    backend: [...result.backend],
    theory: [...result.theory],
    devops: [...result.devops]
  };
}

function extractSkillsByRegex(text) {
  const lower = text.toLowerCase();
  const found = { frontend: new Set(), backend: new Set(), theory: new Set(), devops: new Set() };
  const test = (kw, set) => {
    const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(lower)) set.add(formatSkillName(kw));
  };
  FRONTEND_KEYWORDS.forEach(kw => test(kw, found.frontend));
  BACKEND_KEYWORDS.forEach(kw => test(kw, found.backend));
  THEORY_KEYWORDS.forEach(kw => test(kw, found.theory));
  DEVOPS_KEYWORDS.forEach(kw => test(kw, found.devops));
  return {
    frontend: [...found.frontend],
    backend: [...found.backend],
    theory: [...found.theory],
    devops: [...found.devops]
  };
}

function formatSkillName(skill) {
  const normalized = normalizeSkill(skill);
  const map = {
    'react': 'React.js', 'react js': 'React.js', 'reactjs': 'React.js', 'react.js': 'React.js',
    'next.js': 'Next.js', 'node.js': 'Node.js', 'nodejs': 'Node.js', 'express': 'Express.js',
    'mongodb': 'MongoDB', 'mongoose': 'Mongoose', 'javascript': 'JavaScript',
    'typescript': 'TypeScript', 'rest api': 'REST API', 'html5': 'HTML5', 'css3': 'CSS3',
    'jwt': 'JWT', 'bcrypt': 'bcrypt', 'tailwind css': 'Tailwind CSS', 'git': 'Git',
    'github': 'GitHub', 'docker': 'Docker', 'oop': 'OOP', 'solid': 'SOLID', 'clean code': 'Clean Code'
  };
  return map[normalized] || skill.trim();
}

function isValidSkill(skill) {
  if (!skill || skill.length < 2) return false;
  const invalid = ['sol', 'apis', 'restap is', 'agile work ow'];
  if (invalid.includes(skill.toLowerCase())) return false;
  return /[\p{L}]/u.test(skill);
}

function uniqueCaseInsensitive(arr) {
  const map = new Map();
  arr.forEach(item => {
    const norm = normalizeSkill(item);
    if (!map.has(norm)) map.set(norm, formatSkillName(norm));
  });
  return [...map.values()];
}

module.exports = {
  FRONTEND_KEYWORDS, BACKEND_KEYWORDS, THEORY_KEYWORDS, DEVOPS_KEYWORDS,
  normalizeSkill, exactMatch, classifySkills, extractSkillsByRegex, formatSkillName, isValidSkill, uniqueCaseInsensitive
};