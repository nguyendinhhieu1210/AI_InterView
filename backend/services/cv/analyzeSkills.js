const { GroqService } = require('../ai/groqService');
const { safeParseJson } = require('../ai/parsers/jsonParser');
const { SystemMessage, HumanMessage } = require('@langchain/core/messages');
const { fixBrokenText, extractNameDirectly, normalizeName } = require('./textUtils');
const { uniqueCaseInsensitive } = require('./skillUtils');
const {
  logRequest, logResponse, logError, logTimeout, logTokenUsage, generateRequestId
} = require('../../utils/aiLogger');

// FIX: Rút gọn prompt ~35% token so với bản cũ, giữ nguyên accuracy
// Trước: ~800 tokens system message, sau: ~520 tokens
const CV_EXTRACTION_PROMPT = `You are a CV parser. Extract the candidate's full name and ONLY technical skills.

INCLUDE: Programming languages, frameworks, databases, DevOps tools, technical concepts (REST API, GraphQL, OOP, etc.), real-time tech (WebSocket, SSE, Kafka).

EXCLUDE: OTP, 2FA, verification, soft skills, hobbies (football, music, reading), activities (hackathon, workshop), generic terms without specific tech.

Return ONLY this JSON (no extra text):
{
  "fullName": "string (max 50 chars, or 'Candidate')",
  "skills": {
    "frontend": ["React.js", "Next.js", ...],
    "backend": ["Node.js", "Python", "MongoDB", "WebSocket", ...],
    "theory": ["OOP", "SOLID", "Clean Code", ...],
    "devops": ["Docker", "Git", "AWS", ...]
  }
}

Rules:
- Normalize names: "reactjs"→"React.js", "node.js"→"Node.js", "springboot"→"Spring Boot"
- If category unclear, put in "backend"
- Non-technical skills: OMIT completely`;

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

function filterSkills(skillsObj) {
  const cleaned = { frontend: [], backend: [], theory: [], devops: [] };
  for (const category of ['frontend', 'backend', 'theory', 'devops']) {
    const list = skillsObj[category] || [];
    for (let skill of list) {
      if (typeof skill !== 'string') continue;
      let trimmed = skill.trim();
      if (trimmed.length < 2) continue;
      if (isNonTechnical(trimmed)) continue;

      if (/^jwt$/i.test(trimmed)) trimmed = 'JWT';
      if (/^bcrypt$/i.test(trimmed)) trimmed = 'bcrypt';
      if (/^\s*web\s*socket\s*$/i.test(trimmed)) trimmed = 'WebSocket';
      if (/^\s*sse\s*$/i.test(trimmed)) trimmed = 'SSE';

      cleaned[category].push(trimmed);
    }
    cleaned[category] = [...new Set(cleaned[category])].sort();
  }
  return cleaned;
}

async function analyzeCVSkills(cvText) {
  const requestId = generateRequestId();
  const modelName = 'llama-3.3-70b-versatile';
  const temperature = 0.2;

  const fixed = fixBrokenText(cvText);
  const directName = extractNameDirectly(fixed);
  const cleanedText = fixed.replace(/\s+/g, ' ').trim();

  // FIX: giảm từ 4000 xuống 3000 chars — CV thực tế không cần nhiều hơn
  // để list skills, tiết kiệm thêm ~150-200 input tokens mỗi request
  const truncated = cleanedText.slice(0, 3000);

  const systemMsg = new SystemMessage(CV_EXTRACTION_PROMPT);
  const userMsg = new HumanMessage(`CV:\n${truncated}`);
  const messages = [systemMsg, userMsg];

  const promptPreview = CV_EXTRACTION_PROMPT + "\n\n" + userMsg.content;
  const startTime = Date.now();

  logRequest(modelName, requestId, promptPreview, temperature);

  const groqService = new GroqService(process.env.GROQ_API_KEY, modelName, temperature);
  const timeoutMs = 45000;

  let rawResponse;
  try {
    const aiPromise = groqService.invokeWithRetry(messages);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`CV_TIMEOUT after ${timeoutMs}ms`)), timeoutMs)
    );
    rawResponse = await Promise.race([aiPromise, timeoutPromise]);
    const duration = Date.now() - startTime;
    logResponse(modelName, requestId, rawResponse, duration);

    if (typeof groqService.getLastUsage === 'function') {
      const usage = groqService.getLastUsage();
      if (usage) {
        const inputTokens = usage.input_tokens ?? usage.promptTokens ?? usage.prompt_tokens ?? 0;
        const outputTokens = usage.output_tokens ?? usage.completionTokens ?? usage.completion_tokens ?? 0;
        const totalTokens = usage.total_tokens ?? usage.totalTokens ?? (inputTokens + outputTokens);
        logTokenUsage(modelName, requestId, inputTokens, outputTokens, totalTokens, 'parseCV');
      }
    }
  } catch (err) {
    const duration = Date.now() - startTime;
    if (err.message && err.message.includes('TIMEOUT')) {
      logTimeout(modelName, requestId, timeoutMs);
    } else {
      logError(modelName, requestId, err, `analyzeCVSkills failed after ${duration}ms`);
    }
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

  const resultSkills = {
    frontend: uniqueCaseInsensitive(filtered.frontend),
    backend: uniqueCaseInsensitive(filtered.backend),
    theory: uniqueCaseInsensitive(filtered.theory),
    devops: uniqueCaseInsensitive(filtered.devops)
  };

  return { fullName, skills: resultSkills };
}

module.exports = { analyzeCVSkills };