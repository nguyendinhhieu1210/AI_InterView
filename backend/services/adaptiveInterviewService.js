const AdaptiveSession = require('../models/AdaptiveSession');
const { GroqService } = require('./ai/groqService');

// ========== MODEL & TEMPERATURE ==========
const groqService = new GroqService(
  process.env.GROQ_API_KEY,
  'llama-3.3-70b-versatile',
  0.1
);

const TOTAL_QUESTIONS = 8;

// ========== ĐỘ KHÓ ==========
const DIFFICULTY_RULES = {
  easy: {
    description: `DIFFICULTY: Easy (Beginner level)
- Ask ONE straightforward question about definition, basic usage, or simple concepts
- Pattern: "What is X?", "What does X do?", "Give an example of X"
- NO performance analysis, NO architectural tradeoffs, NO edge cases
- Target: someone who just started learning the topic`,

    answerDepth: `DEPTH: Easy — definition + one simple example is enough. No internals, no tradeoffs.`,

    scoreNote: `Easy: Accept correct definitions + basic examples. Do NOT penalize brevity — a short accurate answer beats a long vague one.`
  },

  medium: {
    description: `DIFFICULTY: Medium (Mid-level developer)
- Ask about how something works, practical usage, or key differences
- Pattern: "How does X work?", "What's the difference between X and Y?", "When would you use X over Y?"
- May involve one common pitfall or trade-off
- Target: developer with 1-2 years experience`,

    answerDepth: `DEPTH: Medium — explain how/why + one practical example + one common mistake if relevant. Don't over-explain simple parts.`,

    scoreNote: `Medium: Expect how/why understanding, not just definitions. Penalize answers that only define without explaining usage.`
  },

  hard: {
    description: `DIFFICULTY: Hard (Senior developer level)
- Ask about internals, edge cases, performance implications, or architectural decisions
- Pattern: "How does X work under the hood?", "What are the tradeoffs of X vs Y at scale?", "What happens when...?"
- Questions should expose gaps in deep understanding
- Target: developer with 3+ years experience`,

    answerDepth: `DEPTH: Hard — address the specific angle asked (internals / tradeoffs / edge case). Include technical specifics, not buzzwords. A short precise answer can score well if it directly hits the point.`,

    scoreNote: `Hard: Penalize surface-level or purely definitional answers. Require the specific depth the question asks for.`
  }
};

// ========== ROADMAP ==========
const TOPIC_ROADMAPS = {
  react: {
    fundamentals: ['jsx & components', 'props vs state', 'event handling', 'conditional rendering', 'lists & keys'],
    hooks: ['useState', 'useEffect (deps, cleanup)', 'custom hooks', 'useMemo & useCallback'],
    performance: ['memoization (React.memo)', 'avoiding re-renders', 'lazy loading & code splitting'],
    architecture: ['context API', 'state management (Redux/Zustand)', 'component composition patterns']
  },
  oop: {
    fundamentals: ['classes & objects', 'encapsulation', 'inheritance', 'polymorphism', 'abstraction'],
    advanced: ['interface vs abstract class', 'composition vs inheritance', 'solid principles'],
    patterns: ['dependency injection', 'factory', 'singleton', 'observer']
  },
  javascript: {
    fundamentals: ['data types', 'hoisting & scope', 'closures', 'prototypes', 'this binding'],
    modern: ['arrow functions', 'destructuring', 'spread/rest', 'modules'],
    async: ['promises', 'async/await', 'event loop', 'error handling'],
    functional: ['map/filter/reduce', 'immutability', 'currying']
  },
  nodejs: {
    fundamentals: ['event loop', 'commonjs vs es modules', 'file system', 'http server'],
    express: ['middleware', 'routing', 'error handling', 'authentication'],
    advanced: ['streams', 'child processes', 'cluster', 'performance tuning'],
    security: ['helmet', 'rate limiting', 'input validation', 'JWT']
  },
  dsa: {
    basics: ['arrays & strings', 'linked lists', 'stacks & queues', 'hashmaps'],
    trees: ['binary trees', 'BST', 'tree traversals'],
    graphs: ['BFS', 'DFS', 'shortest path'],
    algorithms: ['sorting (quick, merge)', 'searching (binary)', 'recursion', 'DP basics']
  },
  java: {
    fundamentals: ['data types & variables', 'control flow', 'methods', 'arrays', 'OOP basics'],
    oop: ['classes & objects', 'inheritance', 'polymorphism', 'abstraction', 'interfaces'],
    advanced: ['generics', 'collections framework', 'exception handling', 'lambda & streams'],
    concurrency: ['threads', 'synchronized', 'executor service', 'CompletableFuture']
  },
  python: {
    fundamentals: ['data types', 'functions', 'loops & conditionals', 'list comprehension'],
    oop: ['classes', 'inheritance', 'dunder methods', 'decorators'],
    advanced: ['generators', 'context managers', 'metaclasses', 'asyncio'],
    libraries: ['numpy basics', 'pandas basics', 'testing with pytest']
  }
};

// ========== EXPECTED CONCEPTS ==========
const EXPECTED_CONCEPTS = {
  'useEffect (deps, cleanup)': ['dependency array', 'cleanup function', 're-render', 'infinite loop', 'side effects'],
  'closures': ['lexical scope', 'outer function', 'persistent state', 'closure variable'],
  'event loop': ['call stack', 'task queue', 'microtask', 'non-blocking', 'single thread'],
  'promises': ['resolve', 'reject', 'then', 'catch', 'pending', 'fulfilled'],
  'async/await': ['promise', 'try catch', 'error handling', 'non-blocking'],
  'usestate': ['re-render', 'immutable', 'setter function', 'initial value'],
  'usememo & usecallback': ['memoization', 'dependency array', 're-render', 'performance', 'referential equality'],
  'props vs state': ['unidirectional', 'parent', 'child', 'mutable', 'immutable'],
  'hoisting & scope': ['var', 'let', 'const', 'temporal dead zone', 'function hoisting'],
  'prototypes': ['prototype chain', 'inheritance', '__proto__', 'object.create'],
  'this binding': ['call', 'apply', 'bind', 'arrow function', 'context'],
  'inheritance': ['extends', 'super', 'override', 'parent class', 'child class'],
  'polymorphism': ['method overriding', 'interface', 'dynamic dispatch', 'runtime'],
  'encapsulation': ['private', 'public', 'getter', 'setter', 'access modifier'],
  'solid principles': ['single responsibility', 'open closed', 'liskov', 'interface segregation', 'dependency inversion'],
  'middleware': ['next()', 'request', 'response', 'chain', 'order'],
  'jwt': ['header', 'payload', 'signature', 'expiry', 'verify'],
  'binary trees': ['node', 'left', 'right', 'leaf', 'root'],
  'bst': ['left smaller', 'right larger', 'search', 'insert', 'balance'],
};

// ========== FALLBACK QUESTIONS theo difficulty ==========
const QUESTION_BANK = {
  easy: {
    conceptual:    (sub, topic) => `What is "${sub}" and what problem does it solve in ${topic}?`,
    comparison:    (sub, topic) => `What is the basic difference between "${sub}" and a simpler alternative in ${topic}?`,
    scenario:      (sub, topic) => `Give a simple real-world example of when you would use "${sub}" in a ${topic} project.`,
  },
  medium: {
    conceptual:    (sub, topic) => `How does "${sub}" work in ${topic}? Explain with a practical example.`,
    comparison:    (sub, topic) => `What are the key differences between "${sub}" and its alternatives in ${topic}? When would you choose one over the other?`,
    scenario:      (sub, topic) => `Describe a scenario where "${sub}" would be the right choice in a ${topic} project and explain why.`,
    debugging:     (sub, topic) => `What common bugs do developers hit with "${sub}" in ${topic}? Walk through how you'd debug one.`,
    best_practice: (sub, topic) => `What best practices should you follow when working with "${sub}" in ${topic}?`,
  },
  hard: {
    conceptual:    (sub, topic) => `Explain how "${sub}" works internally in ${topic}. What are the performance implications?`,
    comparison:    (sub, topic) => `What are the architectural tradeoffs of "${sub}" vs its alternatives in ${topic} at scale?`,
    scenario:      (sub, topic) => `Describe an edge case or production issue caused by "${sub}" in ${topic} and how you resolved it.`,
    debugging:     (sub, topic) => `What subtle bugs or performance issues can "${sub}" cause in ${topic}? Walk through your debugging approach.`,
    best_practice: (sub, topic) => `What advanced patterns and anti-patterns exist around "${sub}" in ${topic}? When should you avoid it entirely?`,
  }
};

// Easy hỏi simple types, Hard mở rộng tất cả
const QUESTION_TYPES_BY_DIFFICULTY = {
  easy:   ['conceptual', 'comparison', 'scenario'],
  medium: ['conceptual', 'comparison', 'scenario', 'debugging', 'best_practice'],
  hard:   ['conceptual', 'comparison', 'scenario', 'debugging', 'best_practice']
};

// ========== SUBTOPICS CÓ THỂ CẦN CODE ==========
const CODE_SUBTOPICS = [
  'usestate', 'useeffect', 'usememo', 'usecallback', 'useref', 'custom hooks',
  'closures', 'promises', 'async/await', 'event loop', 'this binding', 'prototypes',
  'map/filter/reduce', 'destructuring', 'spread/rest', 'arrow functions', 'currying',
  'middleware', 'jwt', 'streams', 'sorting', 'bst', 'binary trees',
  'generics', 'lambda & streams', 'asyncio', 'generators'
];
const CODE_QUESTION_TYPES = ['scenario', 'debugging', 'best_practice'];

// ========== UTILITIES ==========
function getRoadmapForTopic(topic) {
  const lower = (topic || '').toLowerCase().trim();
  const roadmapObj = TOPIC_ROADMAPS[lower] || {
    fundamentals: ['core fundamentals'],
    intermediate: ['practical concepts'],
    advanced: ['advanced patterns']
  };
  const flattened = [];
  for (const phase of Object.values(roadmapObj)) flattened.push(...phase);
  return { structured: roadmapObj, flattened: flattened.slice(0, TOTAL_QUESTIONS) };
}

// FIX 1: Chọn subtopic đầu tiên ngẫu nhiên trong phase đầu thay vì luôn lấy index 0
function pickFirstSubtopic(roadmapObj) {
  const phases = Object.values(roadmapObj);
  if (!phases.length) return null;

  // Lấy phase đầu (fundamentals), random trong đó
  const firstPhase = phases[0];
  if (!firstPhase || !firstPhase.length) return null;

  // Random trong 3 subtopic đầu để không bao giờ cứng là cái đầu tiên
  const pool = firstPhase.slice(0, Math.min(3, firstPhase.length));
  return pool[Math.floor(Math.random() * pool.length)];
}

function normalizeQuestion(text) {
  if (!text || typeof text !== 'string') return '';
  return text.toLowerCase().replace(/[^\w\s]/g, '').trim();
}

function isValidAiQuestion(text) {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (trimmed.length < 10 || trimmed.length > 400) return false;
  if (trimmed.toLowerCase().includes('undefined') || trimmed.toLowerCase().includes('null')) return false;
  return true;
}

function isQuestionTooSimilar(question, history = []) {
  if (!question || !history.length) return false;
  const normalized = normalizeQuestion(question);
  const words = new Set(normalized.split(/\s+/).filter(w => w.length > 3));
  if (words.size === 0) return false;
  return history.some(ex => {
    if (!ex) return false;
    const exWords = new Set(ex.split(/\s+/).filter(w => w.length > 3));
    if (exWords.size === 0) return false;
    const intersection = [...words].filter(w => exWords.has(w)).length;
    return intersection / Math.min(words.size, exWords.size) > 0.6;
  });
}

function getFallbackQuestion(subtopic, questionType, topic, difficulty = 'medium') {
  const safeSub = (subtopic && subtopic !== 'undefined' && subtopic !== 'null')
    ? subtopic : (topic || 'this technology');
  const bank = QUESTION_BANK[difficulty] || QUESTION_BANK.medium;
  const fn = bank[questionType] || bank.conceptual;
  return fn(safeSub, topic || 'software development');
}

function getNextQuestionType(difficulty = 'medium', history = []) {
  const types = QUESTION_TYPES_BY_DIFFICULTY[difficulty] || QUESTION_TYPES_BY_DIFFICULTY.medium;
  const last = history[history.length - 1];
  const available = types.filter(t => t !== last);
  return available[Math.floor(Math.random() * available.length)];
}

function detectMissingConcepts(subtopic, answer = '') {
  const key = (subtopic || '').toLowerCase().trim();
  const expected = EXPECTED_CONCEPTS[key] || [];
  if (!expected.length) return [];
  const lower = answer.toLowerCase();
  return expected.filter(c => !lower.includes(c.toLowerCase()));
}

function analyzeAnswerQuality(answer = '') {
  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;
  return {
    wordCount,
    tooShort: wordCount < 12,
    medium: wordCount >= 12 && wordCount < 40,
    detailed: wordCount >= 40
  };
}

function needsCodeExample(subtopic, questionType) {
  const subLower = (subtopic || '').toLowerCase();
  return CODE_QUESTION_TYPES.includes(questionType)
    || CODE_SUBTOPICS.some(s => subLower.includes(s));
}

// ========== JSON REPAIR ==========
function repairAndParseJSON(raw) {
  if (!raw || typeof raw !== 'string') throw new Error('Empty response');
  let text = raw.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  const start = text.indexOf('{');
  if (start === -1) throw new Error('No JSON object found');
  text = text.slice(start);
  try { return JSON.parse(text); } catch (_) {}

  let depth = 0, inString = false, escape = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{' || ch === '[') depth++;
    if (ch === '}' || ch === ']') depth--;
  }

  if (depth > 0) {
    let truncated = text;
    const last = Math.max(truncated.lastIndexOf(',"'), truncated.lastIndexOf('}'), truncated.lastIndexOf(']'));
    if (last > 0) truncated = truncated.slice(0, last + 1);
    const stack = [];
    let inS = false, esc = false;
    for (let i = 0; i < truncated.length; i++) {
      const ch = truncated[i];
      if (esc) { esc = false; continue; }
      if (ch === '\\' && inS) { esc = true; continue; }
      if (ch === '"') { inS = !inS; continue; }
      if (inS) continue;
      if (ch === '{') stack.push('}');
      if (ch === '[') stack.push(']');
      if (ch === '}' || ch === ']') stack.pop();
    }
    try { return JSON.parse(truncated + stack.reverse().join('')); } catch (_) {}
  }
  throw new Error('Cannot repair JSON');
}

// ========== VALIDATE REPORT ==========
function validateDetailedReport(report) {
  if (!report || !Array.isArray(report.questionBreakdown) || report.questionBreakdown.length === 0) return false;
  for (const q of report.questionBreakdown) {
    if (!q.feedback || q.feedback.length < 30) return false;
    if (!q.idealAnswer || q.idealAnswer.length < 20) return false;
    if (!Array.isArray(q.missingConcepts)) return false;
    if (typeof q.score !== 'number' || q.score < 0 || q.score > 10) return false;
  }
  return typeof report.overallScore === 'number' && !!report.grade;
}

// ========== SYSTEM PROMPT ==========
function buildSystemPrompt(difficulty) {
  const diffConfig = DIFFICULTY_RULES[difficulty] || DIFFICULTY_RULES.medium;
  return `You are a senior software engineer conducting technical interviews.
Evaluate candidate answers fairly but rigorously. Return ONLY valid JSON — no markdown, no backticks, no text outside JSON.

SCORING GUIDE:
- 0-2: Wrong or completely off-topic
- 3-4: Very basic, missing core concepts
- 5-6: Understands the basics, lacks depth
- 7-8: Good practical understanding, minor gaps
- 9-10: Expert-level, covers all aspects

${diffConfig.scoreNote}

IMPORTANT:
- Penalize vague or one-line answers
- Detect missing key concepts
- Prefer technical accuracy over politeness`;
}

// ========== PHASE 1: Chấm điểm theo batch ==========
async function scoreQAPairs(qaPairs, topic, difficulty) {
  const systemPrompt = buildSystemPrompt(difficulty);
  const BATCH_SIZE = 4;
  const allScored = [];

  for (let i = 0; i < qaPairs.length; i += BATCH_SIZE) {
    const batch = qaPairs.slice(i, i + BATCH_SIZE);
    const qaText = batch.map(qa => {
      const qualityNote = qa.answerQuality.tooShort ? ' [Very short answer]'
        : qa.answerQuality.medium ? ' [Brief answer]' : '';
      const missingHint = qa.ruleMissingConcepts.length
        ? ` [May be missing: ${qa.ruleMissingConcepts.join(', ')}]` : '';
      return `Q${qa.questionNumber} [${qa.subtopic}]: ${qa.question}\nAnswer: ${qa.answer}${qualityNote}${missingHint}`;
    }).join('\n\n');

    const userPrompt = `Topic: ${topic} | Difficulty: ${difficulty}

${qaText}

Return a JSON array (${batch.length} items):
[
  {
    "questionNumber": <number>,
    "score": <0-10 integer>,
    "verdict": "Excellent|Good|Adequate|Poor|Missing",
    "correctConcepts": ["..."],
    "missingConcepts": ["..."],
    "feedback": "2-3 sentences: what was good, what was missing, why score given"
  }
]
Rules: feedback must mention exact missing concepts. Short/vague answers max 3-5. Return ONLY the JSON array.`;

    let batchResult = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await groqService.invokeWithRetry([
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]);
        const text = response.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
        const arrStart = text.indexOf('[');
        const arrEnd = text.lastIndexOf(']');
        if (arrStart === -1 || arrEnd === -1) throw new Error('No JSON array found');
        batchResult = JSON.parse(text.slice(arrStart, arrEnd + 1));
        break;
      } catch (err) {
        console.warn(`[scoreQAPairs] Batch ${Math.floor(i / BATCH_SIZE) + 1}, attempt ${attempt + 1} failed: ${err.message}`);
      }
    }

    if (batchResult && Array.isArray(batchResult)) {
      allScored.push(...batchResult);
    } else {
      for (const qa of batch) {
        allScored.push({
          questionNumber: qa.questionNumber,
          score: 3, verdict: 'Poor',
          correctConcepts: [], missingConcepts: qa.ruleMissingConcepts || [],
          feedback: 'Could not evaluate automatically. Please review manually.'
        });
      }
    }
  }
  return allScored;
}

// ========== PHASE 2: Sinh idealAnswer ==========
// FIX 2: Prompt súc tích hơn, giới hạn rõ "đủ ý, không dài dòng"
// Output: { explanation, codeExample|null, codeLanguage|null }
async function generateIdealAnswer(subtopic, question, topic, difficulty, questionType = 'conceptual') {
  const diffConfig = DIFFICULTY_RULES[difficulty] || DIFFICULTY_RULES.medium;
  const withCode = needsCodeExample(subtopic, questionType);

  // Hướng dẫn focus theo loại câu hỏi — không ấn định số từ/câu
  const focusMap = {
    conceptual:    `what it is + why it exists + one concrete example`,
    comparison:    `key difference(s) + when to use each + one tradeoff`,
    scenario:      `the problem + how this concept solves it + one pitfall`,
    debugging:     `the bug + root cause + how to fix/prevent`,
    best_practice: `the rule + why it matters + what breaks if ignored`
  };
  const focus = focusMap[questionType] || focusMap.conceptual;

  const codeField = withCode
    ? `"codeExample": "<short focused snippet max 8 lines, or null if not needed>"`
    : `"codeExample": null`;

  const prompt = `You are a senior ${topic} developer. Write a concise model answer for this interview question.

Question: "${question}"
Subtopic: ${subtopic} | Difficulty: ${difficulty}

${diffConfig.answerDepth}
Cover: ${focus}

Return ONLY this JSON (no markdown, no backticks):
{
  "explanation": "<plain prose, no bullets, no markdown — answer exactly what's asked, stop when done, do NOT repeat points, do NOT embed code here>",
  ${codeField},
  "codeLanguage": "<javascript|python|java|etc or null>"
}`;

  try {
    const raw = await groqService.invokeWithRetry([{ role: 'user', content: prompt }]);
    const text = (raw || '').replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
    const s = text.indexOf('{');
    const e = text.lastIndexOf('}');
    if (s !== -1 && e !== -1) {
      const parsed = JSON.parse(text.slice(s, e + 1));
      if (parsed.explanation && parsed.explanation.length > 30) {
        return {
          explanation: parsed.explanation.trim(),
          codeExample: parsed.codeExample || null,
          codeLanguage: parsed.codeLanguage || null
        };
      }
    }
  } catch (err) {
    console.warn(`[generateIdealAnswer] Failed for "${subtopic}": ${err.message}`);
  }

  // Fallback
  const fallbacks = {
    easy:   `A correct definition of "${subtopic}" with one simple example is sufficient.`,
    medium: `A good answer explains how "${subtopic}" works, gives a practical example, and mentions one common mistake.`,
    hard:   `A strong answer covers internals, tradeoffs, and at least one edge case for "${subtopic}" in ${topic}.`
  };
  return { explanation: fallbacks[difficulty] || fallbacks.medium, codeExample: null, codeLanguage: null };
}

// ========== PHASE 3: Overall summary ==========
async function generateOverallSummary(qaPairs, scoredItems, topic, difficulty) {
  const avgScore = scoredItems.length
    ? scoredItems.reduce((a, b) => a + (b.score || 0), 0) / scoredItems.length : 3;

  const scoreText = scoredItems.map(s =>
    `Q${s.questionNumber} (${qaPairs[s.questionNumber - 1]?.subtopic || 'unknown'}): ${s.score}/10`
  ).join(', ');

  const prompt = `Evaluate a technical interview for ${topic} (difficulty: ${difficulty}).
Scores: ${scoreText}
Average: ${avgScore.toFixed(1)}/10

Return ONLY this JSON (no markdown):
{
  "overallScore": <0-100>,
  "grade": "A+|A|B+|B|C+|C|D|F",
  "overallEvaluation": "Beginner|Junior-ready|Mid-level|Strong|Expert",
  "hireRecommendation": "Strong Yes|Yes|Maybe|No|Strong No",
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "learningRoadmap": ["topic 1", "topic 2", "topic 3"],
  "communicationScore": <1-10>,
  "technicalDepth": <1-10>,
  "problemSolving": <1-10>,
  "confidence": <1-10>,
  "summary": "2-3 sentences summarizing the candidate."
}`;

  try {
    const response = await groqService.invokeWithRetry([{ role: 'user', content: prompt }]);
    const parsed = repairAndParseJSON(response);
    if (parsed && parsed.grade) return parsed;
  } catch (err) {
    console.warn(`[generateOverallSummary] Failed: ${err.message}`);
  }

  const overallScore = Math.round(avgScore * 10);
  return {
    overallScore,
    grade: avgScore >= 8 ? 'A' : avgScore >= 6 ? 'B' : avgScore >= 4 ? 'C' : 'D',
    overallEvaluation: avgScore >= 8 ? 'Strong' : avgScore >= 6 ? 'Mid-level' : avgScore >= 4 ? 'Junior-ready' : 'Beginner',
    hireRecommendation: avgScore >= 7 ? 'Yes' : avgScore >= 5 ? 'Maybe' : 'No',
    strengths: ['Participated in the interview'],
    weaknesses: ['Needs improvement in technical depth'],
    learningRoadmap: [`Review ${topic} fundamentals`, 'Practice coding problems', 'Study system design basics'],
    communicationScore: 5, technicalDepth: Math.round(avgScore),
    problemSolving: Math.round(avgScore), confidence: 5,
    summary: `Candidate completed the ${topic} interview with an average score of ${avgScore.toFixed(1)}/10.`
  };
}

// ========== GENERATE FINAL REPORT ==========
async function generateFinalReport(session) {
  const messages = session.conversation;
  const qaPairs = [];
  for (let i = 0; i < messages.length - 1; i++) {
    const msg = messages[i];
    const next = messages[i + 1];
    if (msg.role === 'assistant' && msg.type === 'question' && next.role === 'user' && next.type === 'answer') {
      qaPairs.push({
        questionNumber: qaPairs.length + 1,
        subtopic: msg.subtopic || session.topic,
        question: msg.content,
        answer: next.content,
        questionType: msg.questionType || 'conceptual',
        ruleMissingConcepts: detectMissingConcepts(msg.subtopic, next.content),
        answerQuality: analyzeAnswerQuality(next.content)
      });
    }
  }

  const scoredItems = await scoreQAPairs(qaPairs, session.topic, session.difficulty);

  const idealAnswers = await Promise.all(
    qaPairs.map(qa => generateIdealAnswer(
      qa.subtopic, qa.question, session.topic, session.difficulty, qa.questionType
    ))
  );

  const summary = await generateOverallSummary(qaPairs, scoredItems, session.topic, session.difficulty);

  const questionBreakdown = qaPairs.map((qa, i) => {
    const scored = scoredItems.find(s => s.questionNumber === qa.questionNumber) || {
      score: 3, verdict: 'Poor', correctConcepts: [],
      missingConcepts: qa.ruleMissingConcepts,
      feedback: 'Could not evaluate automatically.'
    };

    const mergedMissing = [...new Set([...(scored.missingConcepts || []), ...qa.ruleMissingConcepts])];

    let finalScore = scored.score;
    let feedback = scored.feedback || '';
    if (qa.answerQuality.tooShort && finalScore > 4) {
      finalScore = Math.max(1, finalScore - 2);
      feedback = `[Answer too brief - score reduced] ${feedback}`;
    } else if (qa.answerQuality.medium && finalScore > 6) {
      finalScore = Math.max(2, finalScore - 1);
      feedback = `[Answer lacks detail - score reduced] ${feedback}`;
    }

    return {
      questionNumber: qa.questionNumber,
      subtopic: qa.subtopic,
      question: qa.question,
      score: finalScore,
      verdict: scored.verdict || 'Adequate',
      correctConcepts: scored.correctConcepts || [],
      missingConcepts: mergedMissing,
      idealAnswer: idealAnswers[i]?.explanation || '',
      idealAnswerCode: idealAnswers[i]?.codeExample || null,
      idealAnswerCodeLanguage: idealAnswers[i]?.codeLanguage || null,
      feedback
    };
  });

  const report = { questionBreakdown, ...summary, topicBreakdown: buildTopicBreakdown(questionBreakdown) };

  for (const q of questionBreakdown) {
    let count = 0;
    for (let i = 0; i < session.conversation.length; i++) {
      const msg = session.conversation[i];
      if (msg.role === 'assistant' && msg.type === 'question') {
        count++;
        if (count === q.questionNumber) {
          const aIdx = i + 1;
          session.conversation[i].score = q.score;
          session.conversation[i].strengths = q.correctConcepts;
          session.conversation[i].weaknesses = q.missingConcepts;
          if (session.conversation[aIdx]?.role === 'user') {
            session.conversation[aIdx].score = q.score;
            session.conversation[aIdx].strengths = q.correctConcepts;
            session.conversation[aIdx].weaknesses = q.missingConcepts;
            session.conversation[aIdx].missingConcepts = q.missingConcepts;
          }
          break;
        }
      }
    }
  }

  const scores = questionBreakdown.map(q => q.score).filter(s => typeof s === 'number');
  const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 3;
  const finalScore = Math.min(10, Math.max(0, parseFloat(avgScore.toFixed(1))));

  session.finalScore = finalScore;
  session.summary = {
    overallScore: report.overallScore, grade: report.grade,
    overallEvaluation: report.overallEvaluation, hireRecommendation: report.hireRecommendation,
    questionBreakdown, topicBreakdown: report.topicBreakdown,
    strengths: report.strengths, weaknesses: report.weaknesses,
    learningRoadmap: report.learningRoadmap, communicationScore: report.communicationScore,
    technicalDepth: report.technicalDepth, problemSolving: report.problemSolving,
    confidence: report.confidence, summary: report.summary
  };

  return { report, finalScore };
}

function buildTopicBreakdown(questionBreakdown) {
  const topicMap = {};
  for (const q of questionBreakdown) {
    if (!topicMap[q.subtopic]) topicMap[q.subtopic] = [];
    topicMap[q.subtopic].push(q.score);
  }
  const result = {};
  for (const [sub, scores] of Object.entries(topicMap)) {
    result[sub] = parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1));
  }
  return result;
}

// ========== SINH CÂU HỎI ĐẦU TIÊN ==========
async function generateFirstQuestion(topic, difficulty, firstSubtopic) {
  const safeSub = firstSubtopic || topic;
  const diffConfig = DIFFICULTY_RULES[difficulty] || DIFFICULTY_RULES.medium;

  const prompt = `You are a senior technical interviewer starting an interview.

${diffConfig.description}

Ask ONE opening question about "${safeSub}" in ${topic}.
- Start with this subtopic's fundamentals at the given difficulty level
- 1-2 sentences max (under 40 words)
- No preamble, no numbering, no markdown`;

  const response = await groqService.invokeWithRetry([{ role: 'user', content: prompt }]);
  const question = (response || '').trim();
  return isValidAiQuestion(question)
    ? question
    : getFallbackQuestion(safeSub, 'conceptual', topic, difficulty);
}

// ========== SINH CÂU HỎI TIẾP THEO ==========
async function generateNextQuestion(session) {
  const roadmapFlat = session.roadmapFlattened;
  const difficulty = session.difficulty || 'medium';
  const diffConfig = DIFFICULTY_RULES[difficulty] || DIFFICULTY_RULES.medium;
  const questionType = getNextQuestionType(difficulty, session.questionTypeHistory || []);
  const recentAsked = (session.askedQuestions || []).slice(-3).join('\n');

  let targetSubtopic = session.currentSubtopic;
  const remaining = roadmapFlat.filter(r => !(session.coveredTopics || []).includes(r));
  if (remaining.length > 0) {
    targetSubtopic = remaining[0];
    session.currentSubtopic = targetSubtopic;
    session.coveredTopics.push(targetSubtopic);
  } else {
    const resetRemaining = roadmapFlat.filter(r => r !== session.currentSubtopic);
    targetSubtopic = resetRemaining[0] || roadmapFlat[0];
    session.currentSubtopic = targetSubtopic;
    session.coveredTopics = [targetSubtopic];
  }

  const safeSub = targetSubtopic || session.topic;

  const prompt = `You are a senior technical interviewer.

${diffConfig.description}

Ask ONE ${questionType} question about "${safeSub}" in ${session.topic}.
- 1-2 sentences max (under 40 words)
- No preamble, no numbering, no markdown
- Do NOT repeat these recent questions:
${recentAsked || '(none)'}`;

  const response = await groqService.invokeWithRetry([{ role: 'user', content: prompt }]);
  let question = (response || '').trim();
  if (!isValidAiQuestion(question) || isQuestionTooSimilar(question, session.askedQuestions)) {
    question = getFallbackQuestion(safeSub, questionType, session.topic, difficulty);
  }

  session.questionTypeHistory = [...(session.questionTypeHistory || []), questionType];
  session.askedQuestions = [...(session.askedQuestions || []), normalizeQuestion(question)];

  return { question, subtopic: safeSub, questionType };
}

// ========== BẮT ĐẦU PHIÊN PHỎNG VẤN ==========
async function startSession(userId, topic, difficulty = 'medium', interviewStyle = 'friendly', mode = 'adaptive') {
  if (!topic || !topic.trim()) throw new Error('Topic is required.');

  const { structured, flattened } = getRoadmapForTopic(topic);

  // FIX 1 APPLIED: random trong 3 subtopic đầu thay vì luôn lấy index 0
  const firstSubtopic = pickFirstSubtopic(structured) || flattened[0] || topic;

  // coveredTopics bắt đầu với firstSubtopic đã chọn
  // Đảm bảo flattened vẫn đủ subtopics cho các câu tiếp theo
  const remainingFlattened = flattened.includes(firstSubtopic)
    ? flattened : [firstSubtopic, ...flattened].slice(0, TOTAL_QUESTIONS);

  const firstQuestion = await generateFirstQuestion(topic, difficulty, firstSubtopic);

  const session = new AdaptiveSession({
    userId,
    topic: topic.trim(),
    difficulty,
    interviewStyle,
    mode,
    status: 'active',
    conversation: [{
      role: 'assistant',
      type: 'question',
      content: firstQuestion,
      subtopic: firstSubtopic,
      questionType: 'conceptual',
      createdAt: new Date()
    }],
    coveredTopics: [firstSubtopic],
    currentSubtopic: firstSubtopic,
    roadmapStructured: structured,
    roadmapFlattened: remainingFlattened,
    askedQuestions: [normalizeQuestion(firstQuestion)],
    questionTypeHistory: ['conceptual'],
    startedAt: new Date()
  });

  await session.save();
  return {
    sessionId: session._id,
    firstQuestion,
    progress: { current: 1, total: TOTAL_QUESTIONS }
  };
}

// ========== XỬ LÝ CÂU TRẢ LỜI ==========
async function processAnswer(sessionId, userId, answer) {
  const session = await AdaptiveSession.findOne({ _id: sessionId, userId });
  if (!session) throw new Error('Session not found');
  if (session.status !== 'active') throw new Error('Interview already completed');

  if (!Array.isArray(session.askedQuestions)) session.askedQuestions = [];
  if (!Array.isArray(session.questionTypeHistory)) session.questionTypeHistory = [];
  if (!Array.isArray(session.coveredTopics)) session.coveredTopics = [];
  if (!Array.isArray(session.roadmapFlattened) || session.roadmapFlattened.length === 0) {
    const roadmap = getRoadmapForTopic(session.topic);
    session.roadmapFlattened = roadmap.flattened;
    session.roadmapStructured = roadmap.structured;
  }
  if (!session.currentSubtopic) session.currentSubtopic = session.roadmapFlattened[0] || session.topic;

  session.conversation.push({
    role: 'user', type: 'answer',
    content: answer || '',
    createdAt: new Date()
  });

  const answersGiven = session.conversation.filter(m => m.role === 'user' && m.type === 'answer').length;
  const questionsAsked = session.conversation.filter(m => m.role === 'assistant' && m.type === 'question').length;

  if (answersGiven >= TOTAL_QUESTIONS) {
    session.status = 'completed';
    session.endedAt = new Date();
    const { report, finalScore } = await generateFinalReport(session);
    session.finalScore = finalScore;
    await session.save();

    return {
      isFinished: true,
      sessionId: session._id,
      finalScore: session.finalScore,
      summary: session.summary,
      conversation: session.conversation.map(msg => ({
        role: msg.role, type: msg.type, content: msg.content,
        subtopic: msg.subtopic || null, questionType: msg.questionType || null,
        score: msg.score || null, strengths: msg.strengths || [],
        weaknesses: msg.weaknesses || [], missingConcepts: msg.missingConcepts || [],
        createdAt: msg.createdAt
      }))
    };
  }

  const { question: nextQuestion, subtopic: nextSubtopic, questionType } = await generateNextQuestion(session);

  session.conversation.push({
    role: 'assistant', type: 'question',
    content: nextQuestion,
    subtopic: nextSubtopic,
    questionType,
    createdAt: new Date()
  });
  await session.save();

  return {
    isFinished: false,
    sessionId: session._id,
    nextQuestion,
    currentSubtopic: nextSubtopic,
    progress: { current: questionsAsked + 1, total: TOTAL_QUESTIONS }
  };
}

module.exports = { startSession, processAnswer };