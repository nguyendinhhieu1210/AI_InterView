// backend/services/aiService.js

const { HumanMessage } = require('@langchain/core/messages');
const { GroqService } = require('./ai/groqService');

/**
 * Safe JSON parser
 */
const safeParseJSON = (text) => {
  try {
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error('No JSON found');
    }
    const jsonString = text.substring(firstBrace, lastBrace + 1);
    return JSON.parse(jsonString);
  } catch (err) {
    console.error('JSON Parse Error:', err.message);
    throw new Error('Invalid JSON format from AI');
  }
};

/**
 * Difficulty config
 */
const difficultyConfig = {
  easy: {
    levelDescription: `
- beginner level
- junior/intern level
- focus on fundamentals
- simple debugging
- basic syntax
- easy real-world usage
`,
    questionStyle: `
- conceptual
- beginner friendly
- avoid tricky questions
- avoid complex algorithms
`,
    examples: `
Examples:
- What is React state?
- What is a REST API?
- Difference between let and var
`,
  },
  medium: {
    levelDescription: `
- intermediate developer level
- practical coding knowledge
- debugging and optimization
- real-world development scenarios
`,
    questionStyle: `
- scenario based
- practical debugging
- performance basics
- architecture basics
`,
    examples: `
Examples:
- How does useEffect cleanup work?
- How would you optimize API calls?
- Difference between SQL and NoSQL
`,
  },
  hard: {
    levelDescription: `
- advanced mid-level developer
- deeper problem solving
- optimization
- algorithms
- system thinking
- edge cases
`,
    questionStyle: `
- performance optimization
- algorithm complexity
- advanced debugging
- real-world architecture
- edge-case handling
`,
    examples: `
Examples:
- Time complexity of Dijkstra
- Optimize React rendering
- Prevent race conditions
- Design scalable REST APIs
`,
  },
};

/**
 * Generate dynamic system prompt
 */
const buildPrompt = (topic, difficulty) => {
  const config = difficultyConfig[difficulty?.toLowerCase()] || difficultyConfig.medium;

  return `
You are a SENIOR TECHNICAL INTERVIEWER.

Your task:
Generate a REALISTIC technical interview
for this topic:

"${topic}"

Difficulty:
"${difficulty}"

==================================================
DIFFICULTY REQUIREMENTS
==================================================

${config.levelDescription}

==================================================
QUESTION STYLE
==================================================

${config.questionStyle}

==================================================
EXAMPLE QUESTIONS
==================================================

${config.examples}

==================================================
IMPORTANT RULES
==================================================

- Questions MUST match the topic closely.
- Questions MUST match the difficulty level.
- Avoid repeated concepts.
- Avoid duplicate questions.
- Questions should feel like REAL interviews.
- Avoid vague questions.
- Avoid impossible questions.
- Use real-world programming knowledge only.
- No hallucinated technologies.

==================================================
MCQ RULES
==================================================

- EXACTLY 7 MCQ
- EXACTLY 4 options each
- ONLY ONE correct answer
- explanation required
- explanation should explain:
  - why correct answer is correct
  - why others are wrong

==================================================
ESSAY RULES
==================================================

- EXACTLY 3 essay questions
- concise but practical
- realistic interview style
- answerable within 100-250 words
- should test real understanding

==================================================
TOPIC-SPECIFIC REQUIREMENTS
==================================================

If topic contains:

- "DSA"
  => focus on algorithms,
     data structures,
     time complexity,
     problem solving

- "React"
  => focus on hooks,
     rendering,
     optimization,
     state management

- "Node"
  => focus on APIs,
     async handling,
     Express,
     backend concepts

- "Docker"
  => focus on containers,
     images,
     deployment,
     Dockerfile

- "Next.js"
  => focus on SSR,
     SSG,
     routing,
     optimization

==================================================
OUTPUT FORMAT
==================================================

Return ONLY VALID JSON.

{
  "mcq": [
    {
      "question": "string",
      "difficulty": "easy|medium|hard",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "must exactly match one option",
      "explanation": "detailed explanation"
    }
  ],
  "text": [
    {
      "question": "string",
      "difficulty": "easy|medium|hard",
      "idealAnswerKeywords": ["keyword1", "keyword2"],
      "sampleAnswer": "short professional answer"
    }
  ]
}
`;
};

/**
 * Validate MCQ
 */
const validateMCQ = (mcq = []) => {
  return mcq.filter(q => {
    return (
      q.question &&
      Array.isArray(q.options) &&
      q.options.length === 4 &&
      q.correctAnswer &&
      q.options.includes(q.correctAnswer)
    );
  });
};

/**
 * Validate essay
 */
const validateEssay = (text = []) => {
  return text.filter(q => {
    return q.question && Array.isArray(q.idealAnswerKeywords);
  });
};

/**
 * Generate Interview Questions
 */
const generateInterviewQuestions = async (topic, difficulty = 'medium') => {
  const prompt = buildPrompt(topic, difficulty);

  // Determine temperature based on difficulty
  let temperature = 0.3;
  if (difficulty === 'medium') temperature = 0.5;
  if (difficulty === 'hard') temperature = 0.7;

  // Create GroqService instance with the appropriate temperature
  const groqService = new GroqService(
    process.env.GROQ_API_KEY,
    'llama-3.3-70b-versatile',
    temperature
  );

  try {
    const responseText = await groqService.invokeWithRetry([
      new HumanMessage(prompt),
    ]);

    const parsed = safeParseJSON(responseText);

    let mcq = validateMCQ(parsed.mcq || []);
    let text = validateEssay(parsed.text || []);

    // Remove duplicate questions
    const used = new Set();
    mcq = mcq.filter(q => {
      const normalized = q.question.toLowerCase().trim();
      if (used.has(normalized)) return false;
      used.add(normalized);
      return true;
    });

    text = text.filter(q => {
      const normalized = q.question.toLowerCase().trim();
      if (used.has(normalized)) return false;
      used.add(normalized);
      return true;
    });

    // Fallback if AI returns too few
    while (mcq.length < 7) {
      mcq.push({
        question: `What is an important concept in ${topic}?`,
        difficulty,
        options: ['Performance', 'Security', 'Optimization', 'All of the above'],
        correctAnswer: 'All of the above',
        explanation: `${topic} involves performance, security, and optimization concepts.`,
      });
    }

    while (text.length < 3) {
      text.push({
        question: `Explain an important concept in ${topic}.`,
        difficulty,
        idealAnswerKeywords: [topic, 'optimization', 'performance'],
        sampleAnswer: `A good answer should explain core concepts of ${topic} with practical examples.`,
      });
    }

    return {
      mcq: mcq.slice(0, 7),
      text: text.slice(0, 3),
    };
  } catch (error) {
    console.error('Generate Interview Error:', error.message);
    return { mcq: [], text: [] };
  }
};

/**
 * Grade essay answers
 */
const gradeEssay = async (question, userAnswer, idealAnswerKeywords) => {
  const prompt = `
You are a STRICT technical interviewer.

Question:
${question}

Expected keywords:
${idealAnswerKeywords.join(', ')}

User answer:
${userAnswer || 'No answer'}

RULES:
- Score between 0 and 10
- Be fair but strict
- Evaluate:
  - correctness
  - technical understanding
  - keyword coverage
  - clarity

Return ONLY JSON:

{
  "score": number,
  "explanation": "why this score",
  "feedback": "how to improve"
}
`;

  // Use a low temperature for consistent grading
  const groqService = new GroqService(
    process.env.GROQ_API_KEY,
    'llama-3.3-70b-versatile',
    0.2
  );

  try {
    const responseText = await groqService.invokeWithRetry([
      new HumanMessage(prompt),
    ]);

    const result = safeParseJSON(responseText);

    let score = typeof result.score === 'number' ? result.score : 0;
    score = Math.max(0, Math.min(10, score));
    score = Math.round(score * 10) / 10;

    return {
      score,
      explanation: result.explanation || 'No explanation',
      feedback: result.feedback || 'Try adding more technical details.',
    };
  } catch (error) {
    console.error('Grade Essay Error:', error.message);

    // Fallback keyword scoring
    const answer = (userAnswer || '').toLowerCase();
    let matched = 0;
    for (const kw of idealAnswerKeywords || []) {
      if (answer.includes(kw.toLowerCase())) matched++;
    }
    const score = idealAnswerKeywords.length ? (matched / idealAnswerKeywords.length) * 10 : 0;

    return {
      score: Math.round(score * 10) / 10,
      explanation: 'Fallback scoring used.',
      feedback: 'Try including more relevant technical concepts.',
    };
  }
};

module.exports = {
  generateInterviewQuestions,
  gradeEssay,
};