const { GroqService } = require('../ai/groqService');
const { safeParseJson } = require('../ai/parsers/jsonParser');
const { SystemMessage, HumanMessage } = require('@langchain/core/messages');
const { fixBrokenText, extractNameDirectly, normalizeName } = require('./textUtils');
const { uniqueCaseInsensitive } = require('./skillUtils'); // chỉ dùng helper deduplicate

const groqService = new GroqService(process.env.GROQ_API_KEY);

// Prompt chi tiết: chỉ lấy kỹ năng kỹ thuật, bỏ qua OTP, sở thích, hoạt động
const CV_EXTRACTION_PROMPT = `
You are an expert CV parser specializing in technical skill extraction.

Extract the candidate's full name and ONLY technical skills from the CV.

### ✅ INCLUDE these types of skills:
- Programming languages: Python, Java, JavaScript, TypeScript, Go, C++, C#, PHP, Ruby, Swift, Kotlin, etc.
- Frameworks & libraries: React, Next.js, Vue, Angular, Node.js, Express, Spring Boot, Django, FastAPI, Flask, Laravel, ASP.NET, etc.
- Databases: MongoDB, MySQL, PostgreSQL, SQLite, Redis, Cassandra, etc.
- Tools & DevOps: Docker, Kubernetes, Git, GitHub, GitLab, CI/CD, Jenkins, AWS, Azure, GCP, Postman, Figma, etc.
- Concepts & methodologies: REST API, GraphQL, WebSocket, SSE (Server-Sent Events), OOP, SOLID, Clean Code, Design Patterns, TDD, Microservices, etc.
- Real-time & messaging: WebSocket, Socket.io, SSE, Kafka, RabbitMQ.

### ❌ EXCLUDE (do NOT include as skills):
- OTP, two-factor authentication, verification codes, "verification", "2FA"
- Soft skills, interests (Football, Running, Reading, Music, etc.)
- Activities: "participated in hackathon", "organized workshop", "team-based development", "learning community"
- Non-technical words: "interests", "activities", "hobbies", "soft skills"
- Generic terms like "API integration" without specific tech

### Output JSON structure:
{
  "fullName": "string (max 50 chars, or 'Candidate')",
  "skills": {
    "frontend": ["React.js", "Next.js", "Tailwind CSS", ...],
    "backend": ["Node.js", "Express.js", "Python", "Spring Boot", "MongoDB", "WebSocket", ...],
    "theory": ["OOP", "SOLID", "Clean Code", ...],
    "devops": ["Docker", "Git", "GitHub", "Postman", ...]
  }
}

Rules:
- Normalize skill names (e.g., "reactjs" -> "React.js", "node.js" -> "Node.js", "springboot" -> "Spring Boot").
- If a skill doesn't clearly belong to a category, put it in "backend".
- If a skill is not technical (OTP, football, running), OMIT it completely.
- Return ONLY valid JSON, no extra text.
`;

// Danh sách từ khóa cần lọc (hậu xử lý an toàn)
const NON_TECH_KEYWORDS = [
  'otp', 'ot p', 'o t p', '2fa', 'two factor', 'verification',
  'football', 'running', 'reading', 'interests', 'activities',
  'hackathon', 'participated', 'organized', 'team-based', 'workshop',
  'soft skill', 'communication', 'leadership', 'problem solving',
  'hobbies', 'music', 'cooking', 'travel', 'stockfish'
];

function isNonTechnical(skill) {
  const lower = skill.toLowerCase();
  return NON_TECH_KEYWORDS.some(keyword => lower.includes(keyword));
}

// Lọc và làm sạch kỹ năng sau khi AI trả về
function filterSkills(skillsObj) {
  const cleaned = { frontend: [], backend: [], theory: [], devops: [] };
  for (const category of ['frontend', 'backend', 'theory', 'devops']) {
    const list = skillsObj[category] || [];
    for (let skill of list) {
      if (typeof skill !== 'string') continue;
      let trimmed = skill.trim();
      if (trimmed.length < 2) continue;
      if (isNonTechnical(trimmed)) continue;
      
      // Sửa một số lỗi OCR thường gặp
      if (/^jwt$/i.test(trimmed)) trimmed = 'JWT';
      if (/^bcrypt$/i.test(trimmed)) trimmed = 'bcrypt';
      if (/^\s*web\s*socket\s*$/i.test(trimmed)) trimmed = 'WebSocket';
      if (/^\s*sse\s*$/i.test(trimmed)) trimmed = 'SSE';
      
      cleaned[category].push(trimmed);
    }
    // Loại bỏ trùng lặp và sắp xếp
    cleaned[category] = [...new Set(cleaned[category])].sort();
  }
  return cleaned;
}

async function analyzeCVSkills(cvText) {
  const fixed = fixBrokenText(cvText);
  const directName = extractNameDirectly(fixed);
  const cleanedText = fixed.replace(/\s+/g, ' ').trim();
  const truncated = cleanedText.slice(0, 4000); // đủ để lấy hầu hết thông tin

  const messages = [
    new SystemMessage(CV_EXTRACTION_PROMPT),
    new HumanMessage(`CV text:\n${truncated}\n\nExtract JSON as instructed. Only technical skills.`)
  ];

  let rawResponse;
  try {
    rawResponse = await groqService.invokeWithRetry(messages);
  } catch (err) {
    console.error('AI extraction failed, using empty fallback', err);
    return {
      fullName: directName || 'Candidate',
      skills: { frontend: [], backend: [], theory: [], devops: [] }
    };
  }

  let parsed;
  try {
    parsed = await safeParseJson(rawResponse);
  } catch (err) {
    console.error('JSON parse error, using empty fallback', err);
    return {
      fullName: directName || 'Candidate',
      skills: { frontend: [], backend: [], theory: [], devops: [] }
    };
  }

  const fullName = (parsed.fullName && parsed.fullName.length > 2 && parsed.fullName.length < 50)
    ? normalizeName(parsed.fullName)
    : (directName || 'Candidate');

  const rawSkills = parsed.skills || {};
  const filtered = filterSkills(rawSkills);

  // Đảm bảo mỗi category là unique và đã format đẹp
  const resultSkills = {
    frontend: uniqueCaseInsensitive(filtered.frontend),
    backend: uniqueCaseInsensitive(filtered.backend),
    theory: uniqueCaseInsensitive(filtered.theory),
    devops: uniqueCaseInsensitive(filtered.devops)
  };

  return {
    fullName,
    skills: resultSkills
  };
}

module.exports = { analyzeCVSkills };