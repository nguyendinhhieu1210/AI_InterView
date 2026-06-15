// services/liveCoding/llmProvider.js - REFACTORED WITH DIFFICULTY-AWARE EXAMPLES

const { GroqService } = require("../ai/groqService");
const { extractJson } = require("../../utils/jsonExtractor");
const {
  getTopicGuidance,
  getLanguageGuidance,
  getDomainNote,
  isConcurrencyOrAsyncTopic,
  getTopicStyle,
} = require("./questionGuidance");
const {
  logRequest,
  logResponse,
  logError,
  logRateLimit,
  logTokenUsage,
  generateRequestId,
} = require("../../utils/aiLogger");
const {
  getExampleForTopic,
  getDefaultExampleObject,
} = require("./exampleTemplates");

require("dotenv").config();

const groq = new GroqService(
  process.env.GROQ_API_KEY,
  "llama-3.3-70b-versatile",
  0.2,
);

// ========== UTILITY ==========
function getMeaningfulLines(code) {
  const lines = code.split("\n");
  const meaningful = [];
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed === "") continue;
    if (
      trimmed.startsWith("//") ||
      trimmed.startsWith("#") ||
      trimmed.startsWith("*") ||
      trimmed.startsWith("/*")
    )
      continue;
    if (/^[{}()\[\];,\s]+$/.test(trimmed)) continue;
    meaningful.push({ lineNum: i + 1, content: lines[i] });
  }
  return meaningful;
}

function validateQuestion(question, code) {
  const lines = code.split("\n");
  const maxLine = lines.length;
  const meaningfulLines = getMeaningfulLines(code);
  const meaningfulLineNumbers = meaningfulLines.map((l) => l.lineNum);

  const lineMatches = question.match(/\b(?:dòng|line)\s+(\d+)\b/gi) || [];
  for (const match of lineMatches) {
    const lineNum = parseInt(match.match(/\d+/)[0]);
    if (lineNum < 1 || lineNum > maxLine) return false;
    if (!meaningfulLineNumbers.includes(lineNum)) return false;
  }

  return true;
}

function isProblemTooComplex(problemStatement, difficulty, topic = "") {
  const wordCount = problemStatement.split(/\s+/).length;
  if (difficulty === "beginner" && wordCount > 80) return true;
  if (difficulty === "intermediate" && wordCount > 120) return true;
  return false;
}

// ========== CALL AI ==========
async function callAI(
  prompt,
  systemMessage = `You are an AI programming expert. Return valid JSON only. No markdown. No explanation outside JSON.`,
  feature = "general",
) {
  const requestId = generateRequestId();
  const model = "llama-3.3-70b-versatile";
  logRequest(model, requestId, prompt, 0.2);

  try {
    const messages = [
      { role: "system", content: systemMessage },
      { role: "user", content: prompt },
    ];

    const startTime = Date.now();
    const result = await groq.invokeWithRetry(messages);
    const durationMs = Date.now() - startTime;

    const responseContent =
      typeof result === "object"
        ? result.content || JSON.stringify(result)
        : result;

    logResponse(model, requestId, responseContent, durationMs);

    const usage = groq.getLastUsage();

    let inputTokens = 0,
      outputTokens = 0,
      totalTokens = 0;

    if (usage) {
      inputTokens = usage.input_tokens || usage.prompt_tokens || 0;
      outputTokens = usage.output_tokens || usage.completion_tokens || 0;
      totalTokens = usage.total_tokens || inputTokens + outputTokens || 0;
    } else {
      inputTokens = Math.ceil(prompt.length / 4);
      outputTokens = Math.ceil(responseContent.length / 4);
      totalTokens = inputTokens + outputTokens;
    }

    logTokenUsage(
      model,
      requestId,
      inputTokens,
      outputTokens,
      totalTokens,
      feature,
    );

    console.log(`\n========== TOKEN USAGE [${feature}] ==========`);
    console.log(`Input tokens: ${inputTokens}`);
    console.log(`Output tokens: ${outputTokens}`);
    console.log(`Total tokens: ${totalTokens}`);
    console.log(`Response preview: ${responseContent.substring(0, 150)}...`);
    console.log(`=============================================\n`);

    return responseContent;
  } catch (error) {
    console.error("LLM Provider Error:", error);
    logError(model, requestId, error, feature);
    return fallbackResponse(prompt);
  }
}

function fallbackResponse(prompt) {
  return JSON.stringify({
    problemStatement:
      "Write a function that takes an array of integers and returns the sum.",
    functionSignature: "function sum(arr) { }",
    content: "Sum array elements",
    testCriteria: "Handle empty array",
    exampleInput: "[1, 2, 3]",
    exampleOutput: "6",
    description: "Sum all numbers in array",
  });
}

// ========== HÀM TẠO CÂU HỎI - DÙNG PATTERN-BASED VỚI DIFFICULTY ==========
async function generateCodeQuestion(language, domain, topic, difficulty) {
  const { style } = getTopicStyle(topic, language, difficulty);

  // Lấy guidance
  const topicGuidance = getTopicGuidance(topic, language, difficulty);
  const languageGuidance = getLanguageGuidance(language);
  const domainNote = getDomainNote(domain);

  // ===== DÙNG PATTERN-BASED EXAMPLES CÓ PHÂN CẤP ĐỘ KHÓ =====
  let examples = "";
  let patternExample = getExampleForTopic(topic, language, difficulty);

  if (patternExample) {
    examples = `
EXAMPLE BASED ON PATTERN (${topic}, difficulty: ${difficulty}):

${JSON.stringify(patternExample, null, 2)}

IMPORTANT INSTRUCTIONS:
- Follow this EXACT structure but create a COMPLETELY NEW problem
- Use DIFFERENT variable names, values, and scenarios
- Keep the same difficulty level (${difficulty})
- Ensure the solution requires understanding of ${topic}
- Make it practical and realistic
`;
  } else {
    // Fallback to default template nếu không có pattern
    examples = getDefaultExampleString(language, topic, difficulty);
  }

  // Difficulty rules (mở rộng)
  const difficultyMap = {
    beginner: `Max 15 lines. Simple logic. One function or simple class. No recursion. No advanced language features. Use built-in helpers if available. Provide complete runnable code.`,
    intermediate: `15-30 lines. Can have class with 2-3 methods. One loop allowed. May include recursion. Handle basic edge cases.`,
    advanced: `30-50 lines. Can have inheritance or recursion. Complex logic allowed. Optimize for time/space. Handle all edge cases. Provide complexity analysis in comments.`,
  };

  const difficultyRules =
    difficultyMap[difficulty.toLowerCase()] || difficultyMap.intermediate;

  const prompt = `Generate a coding problem with these specifications:

LANGUAGE: ${language}
DOMAIN: ${domain}
TOPIC: ${topic}
DIFFICULTY: ${difficulty.toUpperCase()}

${topicGuidance}

${languageGuidance}
${domainNote}

DIFFICULTY RULES: ${difficultyRules}

${examples}

NOW generate a NEW, UNIQUE problem for ${topic} in ${language} at ${difficulty} level.

REQUIREMENTS:
1. The problem MUST be different from the example above
2. Use different numbers, names, and scenarios
3. Must be practical and realistic
4. Must test understanding of ${topic}
5. Provide clear example input/output
6. At ${difficulty} level, the problem should be ${difficulty === "beginner" ? "trivial to solve with basic constructs" : difficulty === "intermediate" ? "requires some thinking but not overly complex" : "challenging and requires optimization/design patterns"}

Return ONLY valid JSON, no markdown, no explanation.`;

  const result = await callAI(prompt, undefined, "generateCodeQuestion");
  const parsed = extractJson(result);

  // Validate và fix missing fields
  if (parsed && typeof parsed === "object") {
    if (
      !parsed.problemStatement ||
      parsed.problemStatement === "Problem not provided"
    ) {
      parsed.problemStatement = getFallbackProblemStatement(
        topic,
        language,
        difficulty,
      );
    }
    if (
      !parsed.functionSignature ||
      parsed.functionSignature === "// Function signature here"
    ) {
      parsed.functionSignature = getFallbackSignature(language, topic);
    }
    if (!parsed.exampleInput) {
      parsed.exampleInput = getFallbackExampleInput(language);
    }
    if (!parsed.exampleOutput) {
      parsed.exampleOutput = getFallbackExampleOutput(topic);
    }
    if (!parsed.testCriteria) {
      parsed.testCriteria = getFallbackTestCriteria(topic, difficulty);
    }
    if (!parsed.description) {
      parsed.description = parsed.problemStatement.substring(0, 100);
    }
    parsed.content = parsed.problemStatement;

    return parsed;
  }

  return extractJson(fallbackResponse("coding problem"));
}

// ========== FALLBACK FUNCTIONS ==========
function getDefaultExampleString(language, topic, difficulty) {
  const defaultExample = getDefaultExampleObject(language, topic, difficulty);
  return `
EXAMPLE TEMPLATE (use this structure but create NEW content):
${JSON.stringify(defaultExample, null, 2)}`;
}

function getFallbackProblemStatement(topic, language, difficulty) {
  const templates = {
    beginner: `Write a simple function that demonstrates the concept of ${topic} in ${language}. Focus on basic syntax and logic.`,
    intermediate: `Implement a solution that showcases ${topic} in ${language}. Include proper error handling and edge cases.`,
    advanced: `Create a robust implementation of ${topic} in ${language}. Demonstrate best practices and handle complex scenarios.`,
  };
  return templates[difficulty?.toLowerCase()] || templates.intermediate;
}

function getFallbackSignature(language, topic) {
  const cleanTopic = topic.toLowerCase().replace(/\s+/g, "_");
  const signatures = {
    javascript: `function ${cleanTopic}() { /* implementation */ }`,
    python: `def ${cleanTopic}():\n    pass`,
    java: `public static void ${cleanTopic}() { }`,
    csharp: `public static void ${cleanTopic}() { }`,
    cpp: `void ${cleanTopic}() { }`,
    go: `func ${cleanTopic}() { }`,
  };
  return signatures[language] || `// Define ${topic} function/method`;
}

function getFallbackExampleInput(language) {
  const examples = {
    javascript: "// Example: const result = yourFunction(5);",
    python: "# Example: result = your_function(5)",
    java: "// Example: int result = yourFunction(5);",
    csharp: "// Example: int result = YourFunction(5);",
    cpp: "// Example: auto result = yourFunction(5);",
    go: "// Example: result := YourFunction(5)",
  };
  return examples[language] || "// Example usage";
}

function getFallbackExampleOutput(topic) {
  if (topic.includes("Sum") || topic.includes("Total")) return "15";
  if (topic.includes("Max")) return "10";
  if (topic.includes("Sort")) return "[1, 2, 3, 4, 5]";
  if (topic.includes("Array")) return "// Processed result";
  return "// Expected output";
}

function getFallbackTestCriteria(topic, difficulty) {
  if (difficulty === "beginner") {
    return "• Basic functionality works\n• Simple test cases pass";
  } else if (difficulty === "intermediate") {
    return "• Handles edge cases\n• Error handling implemented\n• Efficient solution";
  } else {
    return "• All edge cases covered\n• Optimized solution\n• Production-ready code\n• Comprehensive error handling";
  }
}

// ========== HÀM GIẢI THÍCH (giữ nguyên) ==========
async function generateExplanationQuestion(
  language,
  userCode,
  originalQuestion,
  difficulty = "beginner",
) {
  const meaningfulLines = getMeaningfulLines(userCode);
  const lineList = meaningfulLines
    .map((l) => `Line ${l.lineNum}: ${l.content.trim()}`)
    .join("\n");

  const prompt = `Language: ${language}
Difficulty: ${difficulty}

CODE:
\`\`\`${language}
${userCode}
\`\`\`

MEANINGFUL LINES:
${lineList}

Pick ONE line from above. Ask what it does and why it's needed. Quote the exact code.
Return JSON: {"type": "explain", "question": "..."}`;

  const result = await callAI(prompt, undefined, "generateExplanationQuestion");
  const parsed = extractJson(result);

  if (
    parsed?.type === "explain" &&
    parsed?.question &&
    validateQuestion(parsed.question, userCode)
  ) {
    return { type: "explain", question: parsed.question };
  }

  if (meaningfulLines.length > 0) {
    const random =
      meaningfulLines[Math.floor(Math.random() * meaningfulLines.length)];
    return {
      type: "explain",
      question: `On line ${random.lineNum}: \`${random.content.trim()}\`. What does this line do and why is it needed?`,
    };
  }
  return {
    type: "explain",
    question: "Explain the overall purpose and logic of the code above.",
  };
}

async function generateNextExplanationQuestion(
  language,
  userCode,
  userAnswer,
  currentQuestion,
  explainCount,
  difficulty = "beginner",
) {
  const meaningfulLines = getMeaningfulLines(userCode);
  const lineList = meaningfulLines
    .map((l) => `Line ${l.lineNum}: ${l.content.trim()}`)
    .join("\n");

  const prompt = `Language: ${language}
Previous Q: ${currentQuestion.question}
Student's answer: ${userAnswer}

CODE:
\`\`\`${language}
${userCode}
\`\`\`

MEANINGFUL LINES:
${lineList}

Ask about a DIFFERENT line. Return JSON: {"type": "explain", "question": "..."}`;

  const result = await callAI(
    prompt,
    undefined,
    "generateNextExplanationQuestion",
  );
  const parsed = extractJson(result);

  if (
    parsed?.type === "explain" &&
    parsed?.question &&
    validateQuestion(parsed.question, userCode)
  ) {
    return { type: "explain", question: parsed.question };
  }

  const previousLineMatch =
    currentQuestion.question.match(/\b(?:line)\s+(\d+)\b/i);
  const previousLineNum = previousLineMatch
    ? parseInt(previousLineMatch[1])
    : null;
  let available = meaningfulLines.filter((l) => l.lineNum !== previousLineNum);
  if (available.length === 0) available = meaningfulLines;
  const random = available[Math.floor(Math.random() * available.length)];
  return {
    type: "explain",
    question: `On line ${random.lineNum}: \`${random.content.trim()}\`. Why is this line necessary?`,
  };
}

async function evaluateExplanation(language, answer, currentQuestion) {
  const prompt = `Language: ${language}
Question: ${currentQuestion.question}
Student's answer: ${answer}

Evaluate if correct. Return JSON:
{
  "correct": true/false,
  "feedback": "One sentence starting with Correct/Incorrect.",
  "modelAnswer": "Complete answer (2-3 sentences)"
}`;

  try {
    const result = await callAI(prompt, undefined, "evaluateExplanation");
    const parsed = extractJson(result);
    if (
      parsed &&
      typeof parsed.correct === "boolean" &&
      typeof parsed.feedback === "string"
    ) {
      return {
        correct: parsed.correct,
        feedback: parsed.feedback.replace(/\.\.\./g, "."),
        modelAnswer: (parsed.modelAnswer || "No model answer.").replace(
          /\.\.\./g,
          ".",
        ),
      };
    }
    throw new Error("Invalid response");
  } catch (e) {
    console.error("evaluateExplanation error:", e);
    return {
      correct: false,
      feedback: "AI is overloaded. Please try again.",
      modelAnswer: "No model answer due to system error.",
    };
  }
}

async function evaluateCodeAndExplanations(
  language,
  code,
  problemStatement,
  explainAnswers,
) {
  const prompt = `Language: ${language}
Problem: ${problemStatement}

Code:
\`\`\`${language}
${code}
\`\`\`

Explanations: ${JSON.stringify(explainAnswers, null, 2)}

Evaluate overall performance. Return JSON:
{
  "summary": "2-3 sentence summary",
  "feedback": "Specific advice",
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"]
}`;

  try {
    const result = await callAI(
      prompt,
      undefined,
      "evaluateCodeAndExplanations",
    );
    const parsed = extractJson(result);
    if (parsed && typeof parsed.summary === "string") {
      const clean = (str) => (str || "").replace(/\.\.\./g, ".");
      const cleanArr = (arr) =>
        Array.isArray(arr) ? arr.map((s) => clean(s)) : [];
      return {
        summary: clean(parsed.summary),
        feedback: clean(parsed.feedback || parsed.summary),
        strengths: cleanArr(parsed.strengths),
        weaknesses: cleanArr(parsed.weaknesses),
      };
    }
    throw new Error("Invalid response");
  } catch (e) {
    console.error("evaluateCodeAndExplanations error:", e);
    return {
      summary: "Unable to evaluate due to system error.",
      feedback: "AI encountered an issue. Please try again.",
      strengths: [],
      weaknesses: [],
    };
  }
}

async function evaluateCodeSubmission(
  language,
  code,
  problemStatement,
  expectedOutput = "",
) {
  const syntaxPrompt = `Check syntax errors in this ${language} code:
\`\`\`${language}
${code}
\`\`\`
Return JSON: {"hasSyntaxError": boolean, "feedback": "..."}`;

  try {
    const syntaxResult = await callAI(
      syntaxPrompt,
      undefined,
      "evaluateCode_syntax",
    );
    const syntaxParsed = extractJson(syntaxResult);

    if (syntaxParsed?.hasSyntaxError === true) {
      return {
        correct: false,
        feedback: (syntaxParsed.feedback || "Syntax error detected.").replace(
          /\.\.\./g,
          ".",
        ),
        modelAnswer: "",
      };
    }

    const logicPrompt = `Language: ${language}
Problem: ${problemStatement}
Expected output: ${expectedOutput}

Code:
\`\`\`${language}
${code}
\`\`\`

Check if correct for typical valid inputs. Return JSON:
{
  "correct": boolean,
  "feedback": "One sentence.",
  "modelAnswer": "Short fix if wrong (empty if correct)"
}`;

    const logicResult = await callAI(
      logicPrompt,
      undefined,
      "evaluateCode_logic",
    );
    const logicParsed = extractJson(logicResult);

    if (logicParsed && typeof logicParsed.correct === "boolean") {
      return {
        correct: logicParsed.correct,
        feedback: (
          logicParsed.feedback ||
          (logicParsed.correct ? "Code is correct." : "Logic error.")
        ).replace(/\.\.\./g, "."),
        modelAnswer: (logicParsed.modelAnswer || "").replace(/\.\.\./g, "."),
      };
    }

    throw new Error("Invalid logic response");
  } catch (e) {
    console.error("evaluateCodeSubmission error:", e);
    return {
      correct: false,
      feedback: "Unable to evaluate code due to AI error.",
      modelAnswer: "",
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
  getMeaningfulLines,
};
