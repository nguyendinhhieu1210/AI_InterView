const { GroqService } = require('../ai/groqService');
const { extractJson } = require('../../utils/jsonExtractor');

require('dotenv').config();

const groq = new GroqService(
  process.env.GROQ_API_KEY,
  'llama-3.3-70b-versatile',
  0.2
);

// ========== UTILITY: Lấy các dòng code có ý nghĩa (không phải dấu ngoặc/comment/trống) ==========
function getMeaningfulLines(code) {
  const lines = code.split('\n');
  const meaningful = [];
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    // Bỏ qua dòng trống, dòng chỉ có {} () [] ; , , comment //
    if (trimmed === '' || /^[{}()\[\];,]+$/.test(trimmed) || trimmed.startsWith('//') || trimmed.startsWith('#')) {
      continue;
    }
    meaningful.push({ lineNum: i + 1, content: lines[i] });
  }
  return meaningful;
}

// ========== VALIDATION: Kiểm tra câu hỏi có tham chiếu đến code thật không ==========
function validateQuestion(question, code) {
  const lines = code.split('\n');
  const maxLine = lines.length;
  const meaningfulLines = getMeaningfulLines(code);
  const meaningfulLineNumbers = meaningfulLines.map(l => l.lineNum);

  // Tìm tất cả số dòng được nhắc đến (dạng "dòng 50", "line 50", "dòng số 50")
  const lineMatches = question.match(/\b(?:dòng|line)\s+(\d+)\b/gi) || [];
  for (const match of lineMatches) {
    const lineNum = parseInt(match.match(/\d+/)[0]);
    if (lineNum < 1 || lineNum > maxLine) {
      console.warn(`⚠️  Line ${lineNum} out of range (1-${maxLine})`);
      return false;
    }
    if (!meaningfulLineNumbers.includes(lineNum)) {
      console.warn(`⚠️  Line ${lineNum} is not meaningful (only braces/comments/empty)`);
      return false;
    }
  }

  // Kiểm tra hallucination (các từ khóa bịa đặt)
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

// ========== GỌI AI (giữ nguyên) ==========
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

// ========== FALLBACK (cũ, không thay đổi nhiều) ==========
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
// GENERATE CODE QUESTION (difficulty-aware + kiểm tra độ phức tạp)
// ===============================
async function generateCodeQuestion(language, domain, topic, difficulty) {
  // Difficulty-based constraints (siết chặt hơn)
  let difficultyConstraints = '';
  if (difficulty.toLowerCase() === 'beginner') {
    difficultyConstraints = `
BEGINNER PROBLEM CONSTRAINTS (MUST FOLLOW):
- Problem MUST be solvable within 10-15 lines of code (excluding boilerplate).
- Only 1 function or 1 simple class with 1-2 methods.
- No recursion, no nested loops, no complex data structures (only arrays or simple variables).
- Input size <= 5 elements.
- Do NOT require handling edge cases (empty, null, etc.) unless explicitly taught.
- Example must be concrete and simple.
- Problem description length < 80 words.
- Do NOT use terms like "optimize", "efficient", "scalable", "concurrent", "thread".
- Focus on basic syntax: loops, conditionals, simple arithmetic.
`;
  } else if (difficulty.toLowerCase() === 'intermediate') {
    difficultyConstraints = `
INTERMEDIODE CONSTRAINTS:
- 20-30 lines of code.
- May involve 2-3 related classes or multiple methods.
- May require basic error handling (e.g., check for empty input).
- May ask for simple recursion or one nested loop.
- Do NOT require multi-threading, advanced design patterns, or heavy optimization.
- Problem should be challenging but doable in 20 minutes.
`;
  } else {
    difficultyConstraints = `
ADVANCED CONSTRAINTS:
- 30+ lines of code.
- May involve multiple classes, inheritance, interfaces.
- May require recursion, backtracking, or moderate algorithm (e.g., binary tree traversal, graph BFS).
- May ask for error handling and edge cases.
- Avoid overkill: no need for complex design patterns unless topic demands it.
- Problem should be solvable in 30-40 minutes.
`;
  }

  const prompt = `Generate a ${difficulty} level coding problem in ${language}.
Domain: ${domain}
Topic: ${topic}

${difficultyConstraints}

Requirements:
- The problem must be relevant to the domain and topic.
- Provide a detailed problem statement.
- Include example input and output that match the difficulty level.
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

  let result = await callAI(prompt);
  let parsed = extractJson(result);
  
  // Kiểm tra lại độ phức tạp (nếu quá khó so với level, sinh lại)
  if (parsed && parsed.problemStatement) {
    const isTooHard = await isProblemTooComplex(parsed.problemStatement, difficulty);
    if (isTooHard) {
      console.warn(`⚠️ Generated problem too hard for ${difficulty}, regenerating...`);
      const retryPrompt = `The previous problem was too complex for ${difficulty} level. Make it SIMPLER. ${prompt}`;
      result = await callAI(retryPrompt);
      parsed = extractJson(result);
    }
  }
  
  if (parsed && typeof parsed === 'object') {
    if (!parsed.problemStatement) parsed.problemStatement = parsed.content || parsed.description || "Problem statement not provided";
    return parsed;
  }
  return extractJson(fallbackResponse(prompt));
}

// Helper: kiểm tra sơ bộ xem bài toán có quá khó không
async function isProblemTooComplex(problemStatement, difficulty) {
  const wordCount = problemStatement.split(/\s+/).length;
  if (difficulty === 'beginner' && wordCount > 80) return true;
  const hardKeywords = /\b(?:recurs|backtrack|dynamic|graph|tree|thread|mutex|async|await|synchronized|volatile|concurrent|parallel|optimize|scalable|heap|stack|pointer|deque|priority queue|red.?black|avl|b-?tree)\b/i;
  if (hardKeywords.test(problemStatement)) return true;
  return false;
}

// ===============================
// GENERATE EXPLANATION QUESTION (cải tiến: chỉ hỏi dòng có nghĩa)
// ===============================
async function generateExplanationQuestion(language, userCode, originalQuestion, difficulty = 'beginner') {
  const meaningfulLines = getMeaningfulLines(userCode);
  const lineNumbersStr = meaningfulLines.map(l => l.lineNum).join(', ');
  const totalLines = userCode.split('\n').length;
  
  let difficultyRules = '';
  if (difficulty.toLowerCase() === 'beginner') {
    difficultyRules = `Hỏi về chức năng cơ bản của một dòng code cụ thể. Ví dụ: "Dòng X làm gì?" hoặc "Biến Y dùng để làm gì?". Không hỏi về tối ưu hay design pattern.`;
  } else if (difficulty.toLowerCase() === 'intermediate') {
    difficultyRules = `Hỏi về logic hoặc cách dữ liệu biến đổi qua các dòng. Có thể hỏi về lý do chọn cách viết này.`;
  } else {
    difficultyRules = `Hỏi về thuật toán, độ phức tạp, hoặc cách cải tiến. Có thể hỏi về trade-off thiết kế.`;
  }

  const prompt = `Language: ${language}
Difficulty: ${difficulty}

SOURCE CODE (dòng 1 đến ${totalLines}):
\`\`\`${language}
${userCode}
\`\`\`

CÁC DÒNG CÓ NỘI DUNG Ý NGHĨA (có thể hỏi): ${lineNumbersStr}

QUAN TRỌNG:
- Chỉ được hỏi về một dòng nằm trong danh sách ${lineNumbersStr}.
- Không hỏi dòng quá ${totalLines} (không tồn tại).
- Không hỏi về dòng chỉ có dấu ngoặc, comment, hoặc dòng trống.
- Câu hỏi phải rõ ràng, nên ghi rõ "Trên dòng X, đoạn code ... làm gì?".

${difficultyRules}

TASK: Hỏi MỘT câu hỏi giải thích cụ thể về code trên.

RETURN JSON:
{
  "type": "explain",
  "question": "Câu hỏi bằng tiếng Việt hoặc tiếng Anh (nhưng phải rõ ràng)"
}`;

  const result = await callAI(prompt);
  const parsed = extractJson(result);
  
  if (parsed && parsed.type === 'explain' && parsed.question && validateQuestion(parsed.question, userCode)) {
    return { type: 'explain', question: parsed.question };
  }
  
  console.warn('⚠️  Question validation failed, using fallback with meaningful line...');
  // Fallback thông minh: chọn ngẫu nhiên một dòng có nghĩa
  if (meaningfulLines.length > 0) {
    const random = meaningfulLines[Math.floor(Math.random() * meaningfulLines.length)];
    const fallbackQuestion = `Trên dòng ${random.lineNum}: "${random.content.trim()}". Hãy giải thích đoạn code này làm gì và tại sao lại cần nó.`;
    return { type: 'explain', question: fallbackQuestion };
  }
  return { type: 'explain', question: "Hãy giải thích mục đích chính của đoạn code trên." };
}

// ===============================
// GENERATE NEXT EXPLANATION QUESTION (tương tự)
// ===============================
async function generateNextExplanationQuestion(language, userCode, userAnswer, currentQuestion, explainCount, difficulty = 'beginner') {
  const meaningfulLines = getMeaningfulLines(userCode);
  const lineNumbersStr = meaningfulLines.map(l => l.lineNum).join(', ');
  const totalLines = userCode.split('\n').length;
  
  const prompt = `Language: ${language}
Difficulty: ${difficulty}
Question Number: ${explainCount + 1}/3

SOURCE CODE (dòng 1 đến ${totalLines}):
\`\`\`${language}
${userCode}
\`\`\`

Các dòng có thể hỏi: ${lineNumbersStr}

PREVIOUS QUESTION:
${currentQuestion.question}

STUDENT'S ANSWER TO PREVIOUS QUESTION:
${userAnswer}

QUAN TRỌNG:
- Chỉ được hỏi về một dòng trong danh sách ${lineNumbersStr}.
- Không hỏi dòng ngoài khoảng 1-${totalLines}.
- Câu hỏi tiếp theo phải khác khía cạnh so với câu trước.
- Độ khó ${difficulty}.

TASK: Hỏi MỘT câu hỏi giải thích tiếp theo.

RETURN JSON:
{
  "type":"explain",
  "question":"Câu hỏi (có thể kèm số dòng cụ thể)"
}`;

  const result = await callAI(prompt);
  const parsed = extractJson(result);
  
  if (parsed && parsed.type === 'explain' && parsed.question && validateQuestion(parsed.question, userCode)) {
    return { type: 'explain', question: parsed.question };
  }

  // Fallback thông minh: chọn dòng khác với dòng đã hỏi trước đó (nếu có)
  const previousLineMatch = currentQuestion.question.match(/\b(?:dòng|line)\s+(\d+)\b/i);
  let previousLineNum = previousLineMatch ? parseInt(previousLineMatch[1]) : null;
  let available = meaningfulLines.filter(l => l.lineNum !== previousLineNum);
  if (available.length === 0) available = meaningfulLines;
  const random = available[Math.floor(Math.random() * available.length)];
  const fallbackQuestion = `Trên dòng ${random.lineNum}: "${random.content.trim()}". Giải thích tại sao dòng này cần thiết cho chương trình.`;
  return { type: 'explain', question: fallbackQuestion };
}

// ===============================
// EVALUATE EXPLANATION (giữ nguyên, đã ok)
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
  getMeaningfulLines, // export để frontend có thể dùng nếu cần
};