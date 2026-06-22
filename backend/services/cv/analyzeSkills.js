const { GroqService } = require("../ai/groqService");
const { safeParseJson } = require("../ai/parsers/jsonParser");
const { SystemMessage, HumanMessage } = require("@langchain/core/messages");
const {
  fixBrokenText,
  extractNameDirectly,
  normalizeName,
} = require("./textUtils");
const { uniqueCaseInsensitive } = require("./skillUtils");
const {
  logRequest,
  logResponse,
  logError,
  logTimeout,
  logTokenUsage,
  generateRequestId,
} = require("../../utils/aiLogger");

// ─── PROMPT ───────────────────────────────────────────────────────────────────
// Thay đổi so với bản cũ:
//   1. Định nghĩa rõ từng category bằng ví dụ cụ thể → LLM không nhầm chỗ
//   2. "theory" có IMPORTANT note → không bị bỏ trống
//   3. integrations chỉ là external AI/payment API → chặn nodemailer, monaco
//   4. Yêu cầu scan toàn bộ CV kể cả phần project description
const CV_EXTRACTION_PROMPT = `You are a CV parser. Extract the candidate's full name and ALL technical skills from the CV.

CATEGORY RULES — assign each skill to exactly one category:

"frontend"     → UI languages & frameworks: HTML, HTML5, CSS, CSS3, JavaScript, TypeScript, React.js, Next.js, Vue.js, Angular, Tailwind CSS, Redux, Sass
"backend"      → server runtimes, frameworks, protocols, auth libs: Node.js, Express.js, NestJS, WebSocket, REST API, GraphQL, JWT, bcrypt, OAuth
"database"     → databases & ORMs: MongoDB, MySQL, PostgreSQL, SQL Server, Redis, Mongoose, Prisma, Sequelize
"devops"       → infrastructure, CI/CD, cloud, deployment tools: Git, GitHub, Docker, Kubernetes, GitHub Actions, CI/CD, Vercel, Render, Netlify, AWS, Postman, Nginx
"integrations" → ONLY external AI/LLM/payment/map APIs: Google Gemini API, Groq, OpenAI API, Stripe, Twilio, Mapbox
"theory"       → CS principles and software engineering concepts. IMPORTANT: always check the CV for these and extract them: OOP, SOLID, DSA, Clean Code, Design Patterns, MVC, Microservices, TDD, System Design, Algorithms, Data Structures, Agile, Scrum

EXCLUDE: soft skills, hobbies, email clients, text editors, UI component names, npm utility packages (nodemailer, axios, lodash, monaco-editor, etc.)

IMPORTANT:
- Extract ALL skills mentioned anywhere in the CV, including skill sections, project descriptions, and experience
- "theory" must never be empty if the CV mentions OOP / SOLID / DSA / Clean Code / algorithms

Return ONLY valid JSON (no markdown, no explanation):
{
  "fullName": "string",
  "skills": {
    "frontend": [],
    "backend": [],
    "database": [],
    "devops": [],
    "integrations": [],
    "theory": []
  }
}`;

// ─── NON-TECH FILTER ──────────────────────────────────────────────────────────
const NON_TECH_KEYWORDS = [
  "soft skill", "communication", "leadership", "problem solving",
  "hobbies", "football", "music", "cooking", "travel",
  "team-based", "participated", "organized",
];

function isNonTechnical(skill) {
  const lower = skill.toLowerCase().trim();
  return NON_TECH_KEYWORDS.some((kw) =>
    lower === kw || lower.startsWith(kw + " ") || lower.endsWith(" " + kw)
  );
}

// ─── INTEGRATIONS BLACKLIST ───────────────────────────────────────────────────
// npm utility packages & local tools bị LLM hay nhét nhầm vào integrations
const INTEGRATIONS_BLACKLIST = new Set([
  "nodemailer", "axios", "lodash", "moment", "dayjs", "uuid",
  "monaco editor", "monaco-editor", "codemirror",
  "multer", "sharp", "jimp", "cheerio", "puppeteer",
  "jsonwebtoken", "passport", "passport.js",
  "socket.io", "stockfish",
]);

// ─── NORMALIZE ────────────────────────────────────────────────────────────────
const NORMALIZE_MAP = [
  [/^jwt$/i,                        "JWT"],
  [/^bcrypt$/i,                     "bcrypt"],
  [/^\s*web\s*socket\s*$/i,         "WebSocket"],
  [/^\s*sse\s*$/i,                  "SSE"],
  [/^html\s*5?$/i,                  "HTML5"],
  [/^css\s*3?$/i,                   "CSS3"],
  [/^restful?\s*api[s]?$/i,         "RESTful APIs"],
  [/^ci\s*\/?\s*cd$/i,              "CI/CD"],
  [/^github\s*actions$/i,           "GitHub Actions"],
  [/^sql\s*server$/i,               "SQL Server"],
  [/^next\.?js$/i,                  "Next.js"],
  [/^react\.?js$/i,                 "React.js"],
  [/^node\.?js$/i,                  "Node.js"],
  [/^express\.?js$/i,               "Express.js"],
  [/^tailwind(\s*css)?$/i,          "Tailwind CSS"],
  [/^mongo\s*db$/i,                 "MongoDB"],
  [/^spring\s*boot$/i,              "Spring Boot"],
  [/^google\s*gemini(\s*api)?$/i,   "Google Gemini API"],
  [/^(dsa|data\s*structures?\s*(&|and)\s*algorithms?)$/i, "DSA"],
  [/^oop$/i,                        "OOP"],
  [/^solid$/i,                      "SOLID"],
  [/^clean\s*code$/i,               "Clean Code"],
];

function normalizeSkill(skill) {
  for (const [pattern, replacement] of NORMALIZE_MAP) {
    if (pattern.test(skill)) return replacement;
  }
  return skill;
}

// ─── FILTER ───────────────────────────────────────────────────────────────────
const VALID_CATEGORIES = ["frontend", "backend", "database", "devops", "integrations", "theory"];

function filterSkills(skillsObj) {
  const cleaned = { frontend: [], backend: [], database: [], devops: [], integrations: [], theory: [] };

  for (const category of VALID_CATEGORIES) {
    const list = skillsObj[category] || [];
    for (let skill of list) {
      if (typeof skill !== "string") continue;
      let trimmed = skill.trim();
      if (trimmed.length < 2) continue;
      if (isNonTechnical(trimmed)) continue;
      if (category === "integrations" && INTEGRATIONS_BLACKLIST.has(trimmed.toLowerCase())) continue;

      trimmed = normalizeSkill(trimmed);
      cleaned[category].push(trimmed);
    }
    cleaned[category] = [...new Set(cleaned[category])].sort();
  }
  return cleaned;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function analyzeCVSkills(cvText) {
  const requestId = generateRequestId();
  const modelName = "llama-3.3-70b-versatile";
  const temperature = 0.1; // giảm từ 0.2 → 0.1 để output ổn định hơn

  const fixed = fixBrokenText(cvText);
  const directName = extractNameDirectly(fixed);
  const cleanedText = fixed.replace(/\s+/g, " ").trim();

  // Tăng từ 3000 → 4000 để không bị truncate mất phần Projects (hay chứa theory skills)
  const truncated = cleanedText.slice(0, 4000);

  const systemMsg = new SystemMessage(CV_EXTRACTION_PROMPT);
  const userMsg = new HumanMessage(`CV:\n${truncated}`);
  const messages = [systemMsg, userMsg];

  const promptPreview = CV_EXTRACTION_PROMPT + "\n\n" + userMsg.content;
  const startTime = Date.now();

  logRequest(modelName, requestId, promptPreview, temperature);

  const groqService = new GroqService(
    process.env.GROQ_API_KEY,
    modelName,
    temperature,
  );
  const timeoutMs = 45000;

  const emptyFallback = {
    fullName: directName || "Candidate",
    skills: { frontend: [], backend: [], database: [], devops: [], integrations: [], theory: [] },
  };

  let rawResponse;
  try {
    const aiPromise = groqService.invokeWithRetry(messages);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`CV_TIMEOUT after ${timeoutMs}ms`)), timeoutMs)
    );
    rawResponse = await Promise.race([aiPromise, timeoutPromise]);

    const duration = Date.now() - startTime;
    logResponse(modelName, requestId, rawResponse, duration);

    if (typeof groqService.getLastUsage === "function") {
      const usage = groqService.getLastUsage();
      if (usage) {
        const inputTokens  = usage.input_tokens  ?? usage.promptTokens     ?? usage.prompt_tokens     ?? 0;
        const outputTokens = usage.output_tokens ?? usage.completionTokens ?? usage.completion_tokens ?? 0;
        const totalTokens  = usage.total_tokens  ?? usage.totalTokens      ?? inputTokens + outputTokens;
        logTokenUsage(modelName, requestId, inputTokens, outputTokens, totalTokens, "parseCV");
      }
    }
  } catch (err) {
    const duration = Date.now() - startTime;
    if (err.message?.includes("TIMEOUT")) logTimeout(modelName, requestId, timeoutMs);
    else logError(modelName, requestId, err, `analyzeCVSkills failed after ${duration}ms`);
    console.error("AI extraction failed, using empty fallback", err);
    return emptyFallback;
  }

  let parsed;
  try {
    parsed = await safeParseJson(rawResponse);
  } catch (err) {
    console.error("JSON parse error, using empty fallback", err);
    return emptyFallback;
  }

  const fullName =
    parsed.fullName && parsed.fullName.length > 2 && parsed.fullName.length < 50
      ? normalizeName(parsed.fullName)
      : directName || "Candidate";

  const filtered = filterSkills(parsed.skills || {});

  return {
    fullName,
    skills: {
      frontend:     uniqueCaseInsensitive(filtered.frontend),
      backend:      uniqueCaseInsensitive(filtered.backend),
      database:     uniqueCaseInsensitive(filtered.database),
      devops:       uniqueCaseInsensitive(filtered.devops),
      integrations: uniqueCaseInsensitive(filtered.integrations),
      theory:       uniqueCaseInsensitive(filtered.theory),
    },
  };
}

module.exports = { analyzeCVSkills };