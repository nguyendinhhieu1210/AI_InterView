// services/cv/analyzeSkills.js
const { GroqService } = require('../ai/groqService');
const { CV_EXTRACTION_PROMPT } = require('../ai/prompts/cvExtraction');
const { safeParseJson } = require('../ai/parsers/jsonParser');
const { SystemMessage, HumanMessage } = require('@langchain/core/messages');
const {
  fixBrokenText,
  extractNameDirectly,
  normalizeName
} = require('./textUtils');
const {
  classifySkills,
  extractSkillsByRegex,
  isValidSkill,
  uniqueCaseInsensitive,
  normalizeSkill
} = require('./skillUtils');

const groqService = new GroqService(process.env.GROQ_API_KEY);

async function analyzeCVSkills(cvText) {
  let fixed = fixBrokenText(cvText);
  const directName = extractNameDirectly(fixed);
  const cleaned = fixed.replace(/\s+/g, ' ').trim();
  const truncated = cleaned.slice(0, 3500);

  const messages = [
    new SystemMessage(CV_EXTRACTION_PROMPT),
    new HumanMessage(`CV text:\n${truncated}\n\nExtract JSON.`)
  ];

  let rawResponse;
  try {
    rawResponse = await groqService.invokeWithRetry(messages);
  } catch (err) {
    console.error("AI extraction failed, fallback to regex only", err);
    return {
      fullName: directName || "Candidate",
      skills: extractSkillsByRegex(truncated)
    };
  }

  let parsed;
  try {
    parsed = await safeParseJson(rawResponse);
  } catch (err) {
    console.error("JSON parse error, fallback to regex", err);
    return {
      fullName: directName || "Candidate",
      skills: extractSkillsByRegex(truncated)
    };
  }

  let fullName = (parsed.fullName && parsed.fullName.length > 2 && parsed.fullName.length < 50)
    ? normalizeName(parsed.fullName)
    : (directName || "Candidate");

  let aiRawSkills = parsed.rawSkills || [];
  const cleanedLower = cleaned.toLowerCase();
  const verifiedSkills = aiRawSkills.filter(skill => {
    if (!isValidSkill(skill)) return false;
    const normalizedCV = normalizeSkill(cleanedLower);
    const normalizedSkill = normalizeSkill(skill);
    return new RegExp(`\\b${normalizedSkill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
      .test(normalizedCV);
  });

  let classified = classifySkills(verifiedSkills);
  const regexSkills = extractSkillsByRegex(cleaned);
  classified.frontend = uniqueCaseInsensitive([...classified.frontend, ...regexSkills.frontend]);
  classified.backend = uniqueCaseInsensitive([...classified.backend, ...regexSkills.backend]);
  classified.theory = uniqueCaseInsensitive([...classified.theory, ...regexSkills.theory]);
  classified.devops = uniqueCaseInsensitive([...classified.devops, ...regexSkills.devops]);

  return {
    fullName,
    skills: {
      frontend: classified.frontend.sort(),
      backend: classified.backend.sort(),
      theory: classified.theory.sort(),
      devops: classified.devops.sort()
    }
  };
}

module.exports = { analyzeCVSkills };