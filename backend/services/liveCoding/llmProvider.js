const { GroqService } = require('../ai/groqService');
const { extractJson } = require('../../utils/jsonExtractor');

require('dotenv').config();

const groq = new GroqService(
  process.env.GROQ_API_KEY,
  'llama-3.3-70b-versatile',
  0.2
);

async function callAI(prompt, systemMessage = `
You are an AI programming expert.

IMPORTANT RULES:
1. Always return valid JSON only. No markdown. No explanations outside JSON.
2. Never invent or hallucinate methods, variables, classes that don't exist in the provided code.
3. Only ask questions about code that actually appears in the source.
4. When writing a model answer, write a COMPLETE, self-contained explanation. Keep it SHORT (2-4 sentences maximum). 
5. Do NOT use ellipsis ("...") anywhere. Write full sentences.
6. The model answer should be natural, easy to understand, and not truncated.
`) {
  try {
    const messages = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: prompt },
    ];
    const response = await groq.invokeWithRetry(messages);
    console.log('\n================ AI RESPONSE ================');
    console.log(response);
    console.log('=============================================\n');
    return response;
  } catch (error) {
    console.error('LLM Provider Error:', error);
    return fallbackResponse(prompt);
  }
}

function validateQuestion(question, code) {
  const functionMatches = question.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\s*\(/g) || [];
  for (const match of functionMatches) {
    const fn = match.replace('(', '').trim();
    if (!code.includes(fn)) {
      console.warn(`⚠️  Question references non-existent function: ${fn}`);
      return false;
    }
  }

  const hallucinations = [
    'addCargo', 'removeCargo', 'loadCargo', 'unloadCargo',
    'getCapacity', 'setCapacity', 'isFull', 'isEmpty',
    'thread', 'mutex', 'semaphore', 'async', 'await',
    'spawn', 'fork', 'join', 'synchronize'
  ];

  for (const hallucination of hallucinations) {
    if (question.toLowerCase().includes(hallucination)) {
      if (!code.includes(hallucination)) {
        console.warn(`⚠️  Question mentions hallucinated method: ${hallucination}`);
        return false;
      }
    }
  }
  return true;
}

function fallbackResponse(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  if (lowerPrompt.includes('coding question') || lowerPrompt.includes('coding problem')) {
    return JSON.stringify({
      problemStatement: 'Write a bubbleSort function to sort an array of integers in ascending order.',
      content: 'Write a bubbleSort function to sort an array of integers in ascending order.',
      testCriteria: 'The function must sort correctly in ascending order and must not use built-in sort methods.',
      exampleInput: '[5,2,1,4]',
      exampleOutput: '[1,2,4,5]'
    });
  }
  if (lowerPrompt.includes('explain') || lowerPrompt.includes('explanation')) {
    return JSON.stringify({
      type: 'explain',
      question: 'Explain the purpose of the constructor in your code.'
    });
  }
  if (lowerPrompt.includes('next explain') || lowerPrompt.includes('next explanation')) {
    return JSON.stringify({
      type: 'explain',
      question: 'How does your code handle edge cases like empty input or single elements?'
    });
  }
  if (lowerPrompt.includes('evaluate explanation') || lowerPrompt.includes('evaluate answer')) {
    return JSON.stringify({
      correct: false,
      feedback: 'AI is temporarily overloaded. Please try again later.',
      modelAnswer: 'No model answer available due to system error.'
    });
  }
  if (lowerPrompt.includes('evaluate code') || lowerPrompt.includes('overall evaluation')) {
    return JSON.stringify({
      summary: 'Unable to evaluate due to system error. Please try again.',
      feedback: 'AI encountered an issue and cannot analyze the submission.',
      strengths: [],
      weaknesses: []
    });
  }
  return JSON.stringify({ error: 'Fallback response failed' });
}

// ===============================
// GENERATE CODE QUESTION (đa dạng theo ngôn ngữ, domain, topic, độ khó)
// ===============================
async function generateCodeQuestion(language, domain, topic, difficulty) {
  const prompt = `Generate a coding problem in ${language}.
Domain: ${domain}
Topic: ${topic}
Difficulty: ${difficulty}

Requirements:
- The problem must be relevant to the domain and topic.
- Provide a detailed problem statement.
- Include example input and output.
- Specify test criteria/constraints.

Return ONLY valid JSON, no markdown:
{
  "problemStatement": "Detailed problem description (multiple sentences)",
  "content": "Brief description",
  "testCriteria": "Constraints or edge cases",
  "exampleInput": "Example input",
  "exampleOutput": "Example output",
  "description": "Short summary"
}`;
  const result = await callAI(prompt);
  const parsed = extractJson(result);
  if (parsed && typeof parsed === 'object') {
    if (!parsed.problemStatement) parsed.problemStatement = parsed.content || parsed.description || "Problem statement not provided";
    return parsed;
  }
  return extractJson(fallbackResponse(prompt));
}

// ===============================
// GENERATE EXPLANATION QUESTION (first)
// ===============================
async function generateExplanationQuestion(language, userCode, originalQuestion, difficulty = 'beginner') {
  let difficultyRules = '';
  if (difficulty.toLowerCase() === 'beginner') {
    difficultyRules = `
BEGINNER RULES:
- Ask ONLY simple questions about what the code does.
- Do not ask about optimization, design patterns, or advanced concepts.
- Do not ask about thread safety, concurrency, or async operations.
- Do not ask about edge cases beyond obvious ones.
- Ask about: What does this variable store? What does this method do? How does this loop work?
- Example: "On line 5, what does the 'name' variable store?"
- Example: "What is the purpose of this constructor?"
`;
  } else if (difficulty.toLowerCase() === 'intermediate') {
    difficultyRules = `
INTERMEDIATE RULES:
- Ask about implementation details and logic flow.
- Can ask about why certain approaches were chosen.
- Can ask about basic performance considerations.
- Can ask about how the code handles common edge cases.
- Do not ask about advanced design patterns or complex optimization.
`;
  } else {
    difficultyRules = `
ADVANCED RULES:
- Ask about design patterns, architecture, and optimization.
- Can ask about edge cases and error handling comprehensively.
- Can ask about time/space complexity.
- Can ask about scalability and performance improvements.
- Can ask about design trade-offs and limitations.
`;
  }

  const prompt = `Language: ${language}
Difficulty: ${difficulty}

SOURCE CODE:
\`\`\`${language}
${userCode}
\`\`\`

IMPORTANT RULES:
1. ONLY ask about code that actually exists in SOURCE CODE.
2. NEVER invent methods, variables, properties, classes, loops, conditions, arrays or functions.
3. If a method name does not appear in SOURCE CODE, do not mention it.
4. If a variable name does not appear in SOURCE CODE, do not mention it.
5. Questions must reference actual code lines or blocks that exist.
6. Be specific - reference line numbers or code blocks when possible.

${difficultyRules}

TASK: Ask ONE specific, in-depth explanation question about this code.

RETURN JSON:
{
  "type": "explain",
  "question": "Your question (in English, specific, include line numbers when possible)"
}`;

  const result = await callAI(prompt);
  const parsed = extractJson(result);
  
  if (parsed && parsed.type === 'explain' && parsed.question && validateQuestion(parsed.question, userCode)) {
    return { type: 'explain', question: parsed.question };
  }
  
  console.warn('⚠️  Question validation failed, using fallback...');
  const lines = userCode.split('\n');
  let fallbackQuestion = `Explain the main logic and purpose of the code above.`;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (/^\s*(constructor|function|async\s+function)/.test(lines[i])) {
      fallbackQuestion = `On line ${i + 1}: ${line.substring(0, 50)}..., what is the purpose of this function?`;
      break;
    }
    if (/for|while/.test(line) && line.includes('(')) {
      fallbackQuestion = `On line ${i + 1}: ${line.substring(0, 60)}..., what is the role of this loop in your algorithm?`;
      break;
    }
    if (/=\s*new\s|\[\]|\{\}|\(\)/.test(line)) {
      const match = line.match(/const|let|var\s+(\w+)/);
      if (match) {
        fallbackQuestion = `On line ${i + 1}, what is the purpose of the variable '${match[1]}'?`;
        break;
      }
    }
  }
  return { type: 'explain', question: fallbackQuestion };
}

// ===============================
// GENERATE NEXT EXPLANATION QUESTION
// ===============================
async function generateNextExplanationQuestion(language, userCode, userAnswer, currentQuestion, explainCount, difficulty = 'beginner') {
  let difficultyRules = '';
  if (difficulty.toLowerCase() === 'beginner') {
    difficultyRules = `
BEGINNER RULES:
- Ask ONLY simple questions about what the code does.
- Do not ask about optimization, design patterns, or advanced concepts.
- Do not ask about thread safety, concurrency, or async operations.
- Do not ask about edge cases beyond obvious ones.
`;
  } else if (difficulty.toLowerCase() === 'intermediate') {
    difficultyRules = `
INTERMEDIATE RULES:
- Ask about implementation details and logic flow.
- Can ask about why certain approaches were chosen.
- Can ask about basic performance considerations.
`;
  } else {
    difficultyRules = `
ADVANCED RULES:
- Ask about design patterns, architecture, optimization.
- Can ask about time/space complexity.
- Can ask about edge cases and scalability.
`;
  }

  const prompt = `Language: ${language}
Difficulty: ${difficulty}
Question Number: ${explainCount + 1}/3

SOURCE CODE (UNCHANGED):
\`\`\`${language}
${userCode}
\`\`\`

PREVIOUS QUESTION:
${currentQuestion.question}

STUDENT'S ANSWER TO PREVIOUS QUESTION:
${userAnswer}

IMPORTANT RULES:
1. ONLY ask about code that actually exists in SOURCE CODE above.
2. NEVER invent methods, variables, properties, classes, loops, conditions, arrays or functions.
3. Do not ask about code that is not in SOURCE CODE.
4. Questions must reference actual lines or blocks from SOURCE CODE.
5. Make the NEXT question go DEEPER into a different aspect.

${difficultyRules}

TASK: Generate the NEXT explanation question (${explainCount + 1}/3) about the same code.
The question should explore a different aspect than the previous question.

RETURN JSON:
{
  "type":"explain",
  "question":"Your next question (in English, specific, reference actual code)"
}`;

  const result = await callAI(prompt);
  const parsed = extractJson(result);
  
  if (parsed && parsed.type === 'explain' && parsed.question && validateQuestion(parsed.question, userCode)) {
    return { type: 'explain', question: parsed.question };
  }

  console.warn('⚠️  Question validation failed, using fallback...');
  if (explainCount === 1) {
    if (difficulty.toLowerCase() === 'beginner') {
      return { type: 'explain', question: `What does this code do when the input is empty or has only one element?` };
    } else if (difficulty.toLowerCase() === 'intermediate') {
      return { type: 'explain', question: `How does your code handle edge cases like empty input, single elements, or duplicate values?` };
    } else {
      return { type: 'explain', question: `Describe the time and space complexity (Big O) of your algorithm. Why did you choose this approach?` };
    }
  } else if (explainCount === 2) {
    if (difficulty.toLowerCase() === 'beginner') {
      return { type: 'explain', question: `What does this line of code do? (choose a specific line and ask about it)` };
    } else if (difficulty.toLowerCase() === 'intermediate') {
      return { type: 'explain', question: `Could you optimize your code? What would you change and why?` };
    } else {
      return { type: 'explain', question: `What are the limitations of your design? How could it be improved for different scenarios?` };
    }
  }
  return { type: 'explain', question: `Explain a different part of your code that you haven't discussed yet.` };
}

// ===============================
// EVALUATE EXPLANATION (SHORT + NATURAL, no ellipsis)
// ===============================
async function evaluateExplanation(language, answer, currentQuestion) {
  const prompt = `Language: ${language}
Question: ${currentQuestion.question}
Student's answer: ${answer}

EVALUATION RULES:
1. The answer is CORRECT if it captures the MAIN IDEA, even if missing minor details.
2. The answer is INCORRECT only if it is completely wrong, irrelevant, or has a critical error.
3. Your feedback must be SHORT (one sentence) and natural: start with "Correct" or "Incorrect", then brief reason.
4. The modelAnswer must be a COMPLETE explanation, but SHORT (2-4 sentences). 
5. NEVER use ellipsis ("..."). Write full sentences.

Return JSON:
{
  "correct": true/false,
  "feedback": "Short feedback, e.g., 'Correct, good job.' or 'Incorrect, the loop runs while the stack is not empty.'",
  "modelAnswer": "A concise, complete answer (2-4 sentences). No ellipsis."
}`;

  let result;
  try {
    result = await callAI(prompt);
    const parsed = extractJson(result);
    if (parsed && typeof parsed.correct === 'boolean' && typeof parsed.feedback === 'string') {
      let modelAnswer = parsed.modelAnswer || "No model answer provided.";
      modelAnswer = modelAnswer.replace(/\.\.\./g, '.').replace(/\.{3,}/g, '.');
      if (modelAnswer.endsWith('...')) modelAnswer = modelAnswer.slice(0, -3) + '.';
      if (!modelAnswer.endsWith('.') && !modelAnswer.endsWith('!') && !modelAnswer.endsWith('?')) {
        modelAnswer += '.';
      }
      return {
        correct: parsed.correct,
        feedback: parsed.feedback.replace(/\.\.\./g, '.'),
        modelAnswer: modelAnswer
      };
    }
    throw new Error('Invalid response');
  } catch (e) {
    console.error('evaluateExplanation error:', e);
    return {
      correct: false,
      feedback: "AI is overloaded. Please try again.",
      modelAnswer: "No model answer due to system error."
    };
  }
}

// ===============================
// EVALUATE CODE AND EXPLANATIONS (FINAL)
// ===============================
async function evaluateCodeAndExplanations(language, code, problemStatement, explainAnswers) {
  const prompt = `Language: ${language}
Problem: ${problemStatement}
Code:
\`\`\`
${code}
\`\`\`
Explanation answers:
${JSON.stringify(explainAnswers, null, 2)}
Provide an overall evaluation, without giving a numeric score. Return JSON:
{
  "summary": "Summary of observations",
  "feedback": "Detailed advice or comments",
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"]
}`;
  let result;
  try {
    result = await callAI(prompt);
    const parsed = extractJson(result);
    if (parsed && typeof parsed.summary === 'string') {
      const clean = (str) => (str || '').replace(/\.\.\./g, '.');
      const cleanArr = (arr) => (Array.isArray(arr) ? arr.map(s => clean(s)) : []);
      return {
        summary: clean(parsed.summary),
        feedback: clean(parsed.feedback || parsed.summary),
        strengths: cleanArr(parsed.strengths),
        weaknesses: cleanArr(parsed.weaknesses)
      };
    }
    throw new Error('Invalid response');
  } catch (e) {
    console.error('evaluateCodeAndExplanations error:', e);
    return {
      summary: "Unable to evaluate due to system error. Please try again later.",
      feedback: "AI encountered an issue and cannot analyze the submission.",
      strengths: [],
      weaknesses: []
    };
  }
}

// ===============================
// EVALUATE CODE SUBMISSION (with syntax & logic check)
// ===============================
async function evaluateCodeSubmission(language, code, problemStatement, expectedOutput = '') {
  const prompt = `Language: ${language}
Problem: ${problemStatement}
Expected output (example): ${expectedOutput}

Student's code:
\`\`\`
${code}
\`\`\`

INSTRUCTIONS:
1. First, check if the code has any SYNTAX ERRORS or COMPILATION ERRORS. 
   - For compiled languages (Java, C++, Go, etc.), simulate compilation.
   - For interpreted languages (Python, JavaScript, etc.), check for syntax mistakes.
2. If there are syntax errors, set "correct": false and explain the error clearly in "feedback".
3. If syntax is correct, then determine whether the code correctly solves the problem logically (assuming it runs). 
4. Provide a short feedback (one sentence). 
5. Model answer: If incorrect, give a corrected version or explanation of the bug.

Return JSON:
{
  "correct": boolean,
  "feedback": "Short feedback, e.g., 'Syntax error: missing closing brace on line 5.' or 'Logic error: pop on empty stack.'",
  "modelAnswer": "Fixed code or explanation (2-3 sentences)."
}`;

  try {
    const result = await callAI(prompt);
    const parsed = extractJson(result);
    if (parsed && typeof parsed.correct === 'boolean') {
      let modelAnswer = (parsed.modelAnswer || "").replace(/\.\.\./g, '.');
      return {
        correct: parsed.correct,
        feedback: (parsed.feedback || (parsed.correct ? "Code is correct." : "Code has issues.")).replace(/\.\.\./g, '.'),
        modelAnswer: modelAnswer
      };
    }
    throw new Error("Invalid AI response");
  } catch (e) {
    console.error("evaluateCodeSubmission error:", e);
    return {
      correct: false,
      feedback: "Unable to evaluate code due to AI error.",
      modelAnswer: ""
    };
  }
}

module.exports = {
  callAI,
  generateCodeQuestion,
  generateExplanationQuestion,
  generateNextExplanationQuestion,
  evaluateExplanation,
  evaluateCodeAndExplanations,
  evaluateCodeSubmission,
  validateQuestion,
};
