const { GroqService } = require('../ai/groqService');
const { extractJson } = require('../../utils/jsonExtractor');
const {
  logRequest,
  logResponse,
  logError,
  logRateLimit,
  logTokenUsage,
  generateRequestId,
} = require('../../utils/aiLogger');

require('dotenv').config();

const groq = new GroqService(
  process.env.GROQ_API_KEY,
  'llama-3.3-70b-versatile',
  0.2
);

// ========== UTILITY: Lấy các dòng code có ý nghĩa ==========
// FIX: Regex cũ `/^[{}()\[\];,]+$/` lọc cả dòng như `} else {` hoặc `});`
// → Chỉ bỏ dòng THỰC SỰ không có nội dung logic (chỉ toàn ký tự cấu trúc, không có chữ/số)
function getMeaningfulLines(code) {
  const lines = code.split('\n');
  const meaningful = [];
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // Bỏ dòng trống
    if (trimmed === '') continue;

    // Bỏ comment thuần
    if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('*') || trimmed.startsWith('/*')) continue;

    // Bỏ dòng CHỈ có ký tự cấu trúc (không có chữ cái hoặc số)
    // VD: "}", "{", "});", "})" → bỏ
    // VD: "for (let i = 0..." → GIỮ vì có chữ
    if (/^[{}()\[\];,\s]+$/.test(trimmed)) continue;

    meaningful.push({ lineNum: i + 1, content: lines[i] });
  }
  return meaningful;
}

// ========== VALIDATION: Kiểm tra câu hỏi tham chiếu dòng có thực không ==========
function validateQuestion(question, code) {
  const lines = code.split('\n');
  const maxLine = lines.length;
  const meaningfulLines = getMeaningfulLines(code);
  const meaningfulLineNumbers = meaningfulLines.map(l => l.lineNum);

  const lineMatches = question.match(/\b(?:dòng|line)\s+(\d+)\b/gi) || [];
  for (const match of lineMatches) {
    const lineNum = parseInt(match.match(/\d+/)[0]);
    if (lineNum < 1 || lineNum > maxLine) {
      console.warn(`⚠️  Line ${lineNum} out of range (1-${maxLine})`);
      return false;
    }
    if (!meaningfulLineNumbers.includes(lineNum)) {
      console.warn(`⚠️  Line ${lineNum} is not meaningful — not in list: [${meaningfulLineNumbers.join(', ')}]`);
      return false;
    }
  }

  const hallucinations = [
    'addCargo', 'removeCargo', 'loadCargo', 'unloadCargo',
    'getCapacity', 'setCapacity', 'isFull', 'isEmpty',
    'thread', 'mutex', 'semaphore', 'async', 'await',
    'spawn', 'fork', 'join', 'synchronize'
  ];
  for (const h of hallucinations) {
    if (question.toLowerCase().includes(h.toLowerCase()) && !code.includes(h)) {
      console.warn(`⚠️  Hallucinated term: ${h}`);
      return false;
    }
  }
  return true;
}

// ========== GỌI AI + LOG TOKEN ==========
async function callAI(prompt, systemMessage = `
You are an AI programming expert.

IMPORTANT RULES:
1. Always return valid JSON only. No markdown. No explanations outside JSON.
2. Never invent or hallucinate methods, variables, classes that don't exist in the provided code.
3. Only ask questions about code that actually appears in the source.
4. When writing a model answer, write a COMPLETE, self-contained explanation. Keep it SHORT (2-4 sentences maximum). 
5. Do NOT use ellipsis ("...") anywhere. Write full sentences.
6. The model answer should be natural, easy to understand, and not truncated.
`, feature = 'general') {
  const requestId = generateRequestId();
  const model = 'llama-3.3-70b-versatile';

  logRequest(model, requestId, prompt, 0.2);

  try {
    const messages = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: prompt },
    ];

    const startTime = Date.now();
    const response = await groq.invokeWithRetry(messages);
    const durationMs = Date.now() - startTime;

    // Log response
    logResponse(model, requestId, response, durationMs);

    // Log token usage nếu groq trả về usage (tuỳ GroqService expose hay không)
    // Nếu groq.invokeWithRetry trả về object có .usage thì dùng dòng dưới:
    // const { text, usage } = response;
    // logTokenUsage(model, requestId, usage.input_tokens, usage.output_tokens, usage.total_tokens, feature);
    // Nếu chỉ trả về string thì estimate:
    const estimatedTokens = Math.ceil((prompt.length + (typeof response === 'string' ? response.length : 0)) / 4);
    logTokenUsage(model, requestId, Math.ceil(prompt.length / 4), Math.ceil((typeof response === 'string' ? response.length : 0) / 4), estimatedTokens, feature);

    console.log('\n================ AI RESPONSE ================');
    console.log(response);
    console.log('=============================================\n');

    return response;
  } catch (error) {
    // Phát hiện rate limit
    if (error?.status === 429 || error?.message?.includes('rate limit')) {
      const retryAfter = error?.headers?.['retry-after'] || null;
      logRateLimit(model, requestId, retryAfter, error);
    } else {
      logError(model, requestId, error, feature);
    }
    console.error('LLM Provider Error:', error);
    return fallbackResponse(prompt);
  }
}

// ========== FALLBACK ==========
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
    return JSON.stringify({ type: 'explain', question: 'Explain the purpose of the constructor in your code.' });
  }
  if (lowerPrompt.includes('next explain') || lowerPrompt.includes('next explanation')) {
    return JSON.stringify({ type: 'explain', question: 'How does your code handle edge cases like empty input or single elements?' });
  }
  if (lowerPrompt.includes('evaluate explanation') || lowerPrompt.includes('evaluate answer')) {
    return JSON.stringify({ correct: false, feedback: 'AI is temporarily overloaded. Please try again later.', modelAnswer: 'No model answer available due to system error.' });
  }
  if (lowerPrompt.includes('evaluate code') || lowerPrompt.includes('overall evaluation')) {
    return JSON.stringify({ summary: 'Unable to evaluate due to system error. Please try again.', feedback: 'AI encountered an issue and cannot analyze the submission.', strengths: [], weaknesses: [] });
  }
  return JSON.stringify({ error: 'Fallback response failed' });
}

// ===============================
// GENERATE CODE QUESTION
// FIX: Giảm độ khó intermediate và advanced cho hợp lý hơn
// ===============================
async function generateCodeQuestion(language, domain, topic, difficulty) {
  let difficultyConstraints = '';

  if (difficulty.toLowerCase() === 'beginner') {
    difficultyConstraints = `
BEGINNER CONSTRAINTS (MUST FOLLOW):
- Solvable in 10-15 lines of code (excluding boilerplate).
- Only 1 function or 1 simple class with 1-2 methods.
- No recursion, no nested loops, no complex data structures (only arrays or simple variables).
- Input size <= 5 elements.
- Do NOT require handling edge cases (empty, null) unless explicitly needed.
- Problem description < 80 words.
- Focus on basic syntax: loops, conditionals, simple arithmetic.
- Do NOT use terms like "optimize", "efficient", "scalable", "concurrent".
`;
  } else if (difficulty.toLowerCase() === 'intermediate') {
    // FIX: Giảm độ khó — trước đây quá nặng (2-3 class, recursion, nested loop)
    difficultyConstraints = `
INTERMEDIATE CONSTRAINTS (MUST FOLLOW):
- Solvable in 15-25 lines of code.
- 1 class with 2-3 straightforward methods, OR 2-3 related functions.
- May use ONE simple loop (no nested loops unless simple).
- May require basic input validation (e.g., check if array is empty).
- NO recursion, NO complex algorithms, NO design patterns.
- Problem should be doable by someone who knows basic OOP and loops.
- Example: implement a simple stack with push/pop, or a basic calculator class.
- Do NOT require multi-threading, sorting algorithms, or graph/tree structures.
`;
  } else {
    // FIX: Advanced giảm từ "graph BFS, backtracking" → chỉ cần thuật toán quen thuộc
    difficultyConstraints = `
ADVANCED CONSTRAINTS (MUST FOLLOW):
- Solvable in 25-40 lines of code.
- May involve 1-2 classes with inheritance OR multiple cooperating functions.
- May require ONE level of recursion (e.g., factorial, simple tree traversal) or one well-known algorithm (binary search, basic sorting).
- May ask for basic error handling and edge cases.
- Do NOT require backtracking, graph algorithms, dynamic programming, or complex design patterns.
- Problem should be doable by someone with solid OOP knowledge and algorithm basics.
- Example: implement a linked list with insert/delete, or binary search on a sorted array.
`;
  }

  const prompt = `Generate a ${difficulty} level coding problem in ${language}.
Domain: ${domain}
Topic: ${topic}

${difficultyConstraints}

Requirements:
- The problem must be relevant to the domain and topic.
- Provide a detailed problem statement.
- Include example input and output matching the difficulty level.
- Specify test criteria/constraints appropriate for the difficulty.

Return ONLY valid JSON, no markdown:
{
  "problemStatement": "Detailed problem description",
  "content": "Brief description",
  "testCriteria": "Constraints or edge cases",
  "exampleInput": "Simple and clear example input",
  "exampleOutput": "Clear example output",
  "description": "Short summary"
}`;

  let result = await callAI(prompt, undefined, 'generateCodeQuestion');
  let parsed = extractJson(result);

  if (parsed && parsed.problemStatement) {
    const isTooHard = await isProblemTooComplex(parsed.problemStatement, difficulty);
    if (isTooHard) {
      console.warn(`⚠️ Problem too hard for ${difficulty}, regenerating...`);
      const retryPrompt = `The previous problem was too complex for ${difficulty} level. Make it SIMPLER.\n\n${prompt}`;
      result = await callAI(retryPrompt, undefined, 'generateCodeQuestion_retry');
      parsed = extractJson(result);
    }
  }

  if (parsed && typeof parsed === 'object') {
    if (!parsed.problemStatement) parsed.problemStatement = parsed.content || parsed.description || 'Problem statement not provided';
    return parsed;
  }
  return extractJson(fallbackResponse(prompt));
}

// Helper: kiểm tra bài toán có quá khó không
async function isProblemTooComplex(problemStatement, difficulty) {
  const wordCount = problemStatement.split(/\s+/).length;
  if (difficulty === 'beginner' && wordCount > 80) return true;
  if (difficulty === 'intermediate' && wordCount > 120) return true;

  const hardKeywords = /\b(?:backtrack|dynamic programming|graph|BFS|DFS|heap|red.?black|avl|b-?tree|thread|mutex|semaphore|concurrent|parallel|volatile|synchronized)\b/i;
  if (hardKeywords.test(problemStatement)) return true;

  // intermediate không nên có recursion hoặc nested loop
  if (difficulty === 'intermediate') {
    const intermediateHardKeywords = /\b(?:recurs|nested loop|multi.?level)\b/i;
    if (intermediateHardKeywords.test(problemStatement)) return true;
  }

  return false;
}

// ===============================
// GENERATE EXPLANATION QUESTION
// FIX: Gửi đúng nội dung dòng vào prompt để AI quote chính xác, không bị chỉ vào ngoặc
// ===============================
async function generateExplanationQuestion(language, userCode, originalQuestion, difficulty = 'beginner') {
  const meaningfulLines = getMeaningfulLines(userCode);
  const totalLines = userCode.split('\n').length;

  // FIX: Gửi cả nội dung dòng (không chỉ số dòng) để AI biết đang hỏi gì
  const lineList = meaningfulLines.map(l => `  Line ${l.lineNum}: ${l.content.trim()}`).join('\n');

  let difficultyRules = '';
  if (difficulty.toLowerCase() === 'beginner') {
    difficultyRules = `Ask about the basic function of ONE specific line. E.g., "On line X, what does '...' do?" Do not ask about optimization or design patterns.`;
  } else if (difficulty.toLowerCase() === 'intermediate') {
    difficultyRules = `Ask about the logic or how data changes across a few lines. May ask why this approach was chosen.`;
  } else {
    difficultyRules = `Ask about algorithm choice, time complexity, or possible improvements.`;
  }

  const prompt = `Language: ${language}
Difficulty: ${difficulty}
Total lines in code: ${totalLines}

SOURCE CODE:
\`\`\`${language}
${userCode}
\`\`\`

MEANINGFUL LINES (only these can be referenced in your question):
${lineList}

RULES:
- You MUST pick ONE line from the MEANINGFUL LINES list above.
- In your question, quote the EXACT code snippet from that line so the student knows which part you mean.
- Format: "On line X, the code '[exact snippet]' does what?" — be specific.
- Do NOT reference line numbers that are NOT in the meaningful lines list.
- Do NOT ask about lines that only contain braces, brackets, or semicolons.

${difficultyRules}

Return JSON:
{
  "type": "explain",
  "question": "Your question referencing a specific line and its exact code"
}`;

  const result = await callAI(prompt, undefined, 'generateExplanationQuestion');
  const parsed = extractJson(result);

  if (parsed && parsed.type === 'explain' && parsed.question && validateQuestion(parsed.question, userCode)) {
    return { type: 'explain', question: parsed.question };
  }

  // Fallback: chọn random dòng có nghĩa và tạo câu hỏi rõ ràng với nội dung dòng đó
  console.warn('⚠️  Question validation failed, using smart fallback...');
  if (meaningfulLines.length > 0) {
    const random = meaningfulLines[Math.floor(Math.random() * meaningfulLines.length)];
    return {
      type: 'explain',
      question: `On line ${random.lineNum}, the code is: \`${random.content.trim()}\`. What does this line do, and why is it needed?`
    };
  }
  return { type: 'explain', question: 'Explain the main purpose of the code above.' };
}

// ===============================
// GENERATE NEXT EXPLANATION QUESTION
// FIX: tương tự — gửi nội dung dòng đầy đủ
// ===============================
async function generateNextExplanationQuestion(language, userCode, userAnswer, currentQuestion, explainCount, difficulty = 'beginner') {
  const meaningfulLines = getMeaningfulLines(userCode);
  const totalLines = userCode.split('\n').length;
  const lineList = meaningfulLines.map(l => `  Line ${l.lineNum}: ${l.content.trim()}`).join('\n');

  const prompt = `Language: ${language}
Difficulty: ${difficulty}
Question Number: ${explainCount + 1}/3
Total lines in code: ${totalLines}

SOURCE CODE:
\`\`\`${language}
${userCode}
\`\`\`

MEANINGFUL LINES (only these can be referenced):
${lineList}

PREVIOUS QUESTION: ${currentQuestion.question}
STUDENT'S ANSWER: ${userAnswer}

RULES:
- Pick a DIFFERENT aspect or line than the previous question.
- Quote the EXACT code snippet from the chosen line in your question.
- Do NOT reference any line NOT in the meaningful lines list above.
- Difficulty: ${difficulty}.

Return JSON:
{
  "type": "explain",
  "question": "Your follow-up question with exact code quoted"
}`;

  const result = await callAI(prompt, undefined, 'generateNextExplanationQuestion');
  const parsed = extractJson(result);

  if (parsed && parsed.type === 'explain' && parsed.question && validateQuestion(parsed.question, userCode)) {
    return { type: 'explain', question: parsed.question };
  }

  // Fallback: chọn dòng khác với dòng đã hỏi
  const previousLineMatch = currentQuestion.question.match(/\b(?:line)\s+(\d+)\b/i);
  const previousLineNum = previousLineMatch ? parseInt(previousLineMatch[1]) : null;
  let available = meaningfulLines.filter(l => l.lineNum !== previousLineNum);
  if (available.length === 0) available = meaningfulLines;
  const random = available[Math.floor(Math.random() * available.length)];
  return {
    type: 'explain',
    question: `On line ${random.lineNum}, the code is: \`${random.content.trim()}\`. Why is this line necessary for the program to work correctly?`
  };
}

// ===============================
// EVALUATE EXPLANATION
// ===============================
async function evaluateExplanation(language, answer, currentQuestion) {
  const prompt = `Language: ${language}
Question: ${currentQuestion.question}
Student's answer: ${answer}

EVALUATION RULES:
1. The answer is CORRECT if it captures the MAIN IDEA, even if missing minor details.
2. The answer is INCORRECT only if completely wrong, irrelevant, or critically mistaken.
3. Feedback must be SHORT (one sentence): start with "Correct" or "Incorrect", then brief reason.
4. modelAnswer must be COMPLETE but SHORT (2-4 sentences). NEVER use ellipsis ("...").

Return JSON:
{
  "correct": true/false,
  "feedback": "Short feedback sentence.",
  "modelAnswer": "Complete concise answer (2-4 sentences)."
}`;

  try {
    const result = await callAI(prompt, undefined, 'evaluateExplanation');
    const parsed = extractJson(result);
    if (parsed && typeof parsed.correct === 'boolean' && typeof parsed.feedback === 'string') {
      let modelAnswer = (parsed.modelAnswer || 'No model answer provided.').replace(/\.\.\./g, '.').replace(/\.{3,}/g, '.');
      if (!modelAnswer.match(/[.!?]$/)) modelAnswer += '.';
      return {
        correct: parsed.correct,
        feedback: parsed.feedback.replace(/\.\.\./g, '.'),
        modelAnswer
      };
    }
    throw new Error('Invalid response');
  } catch (e) {
    console.error('evaluateExplanation error:', e);
    return { correct: false, feedback: 'AI is overloaded. Please try again.', modelAnswer: 'No model answer due to system error.' };
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
Provide an overall evaluation without a numeric score. Return JSON:
{
  "summary": "Summary of observations",
  "feedback": "Detailed advice or comments",
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"]
}`;

  try {
    const result = await callAI(prompt, undefined, 'evaluateCodeAndExplanations');
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
    return { summary: 'Unable to evaluate due to system error.', feedback: 'AI encountered an issue.', strengths: [], weaknesses: [] };
  }
}

// ===============================
// EVALUATE CODE SUBMISSION
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
1. Check for SYNTAX ERRORS or COMPILATION ERRORS first.
2. If syntax errors exist, set "correct": false and explain clearly.
3. If syntax is OK, check if the logic correctly solves the problem.
4. Provide short feedback (one sentence).
5. If incorrect, give a corrected version or explain the bug.

Return JSON:
{
  "correct": boolean,
  "feedback": "Short feedback sentence.",
  "modelAnswer": "Fixed code or explanation (2-3 sentences)."
}`;

  try {
    const result = await callAI(prompt, undefined, 'evaluateCodeSubmission');
    const parsed = extractJson(result);
    if (parsed && typeof parsed.correct === 'boolean') {
      return {
        correct: parsed.correct,
        feedback: (parsed.feedback || (parsed.correct ? 'Code is correct.' : 'Code has issues.')).replace(/\.\.\./g, '.'),
        modelAnswer: (parsed.modelAnswer || '').replace(/\.\.\./g, '.')
      };
    }
    throw new Error('Invalid AI response');
  } catch (e) {
    console.error('evaluateCodeSubmission error:', e);
    return { correct: false, feedback: 'Unable to evaluate code due to AI error.', modelAnswer: '' };
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
  getMeaningfulLines,
};