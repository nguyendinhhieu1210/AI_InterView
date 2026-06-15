// services/liveCoding/codeEvaluationService.js - FIXED & OPTIMIZED

const { callAI } = require("./llmProvider");
const { extractJson } = require("../../utils/jsonExtractor");
const { getTopicGuidance } = require("./questionGuidance");

function analyzeCodeStructure(code, language) {
  const lines = code.split("\n");
  const analysis = {
    lineCount: lines.length,
    hasLoop: /for|while|do/i.test(code),
    hasCondition: /if|else|switch|case/i.test(code),
    hasArray: /array|\[\]|\.push|\.pop|\.shift|\.unshift/i.test(code),
    hasFunction: /function|const.*=|let.*=.*=>|def\s+\w+/i.test(code),
    hasSwap: /temp|swap|=|,\s*=/i.test(code),
    hasClass: /class\s+\w+|def\s+__init__/i.test(code),
    loopPatterns: [],
    conditionalPatterns: [],
  };

  const loopMatch = code.match(/for\s*\([^)]*\)/gi);
  if (loopMatch) analysis.loopPatterns = loopMatch;

  const ifMatch = code.match(/if\s*\([^)]*\)/gi);
  if (ifMatch) analysis.conditionalPatterns = ifMatch;

  return analysis;
}

// ============== HELPER: Truncate feedback (no ellipsis, cut on sentence boundary) ==============
function truncate(text, maxChars = 200) {
  if (!text) return "";
  if (text.length <= maxChars) return text;

  const cut = text.substring(0, maxChars);
  const lastSentenceEnd = Math.max(
    cut.lastIndexOf("."),
    cut.lastIndexOf("!"),
    cut.lastIndexOf("?"),
  );

  if (lastSentenceEnd > 50) {
    return cut.substring(0, lastSentenceEnd + 1).trim();
  }
  return cut.trim() + ".";
}

// ============== HELPER: Clean text (remove ellipsis like rest of system) ==============
function cleanText(text) {
  if (!text) return "";
  return text.replace(/\.\.\./g, ".").replace(/\.{2,}/g, ".");
}

async function evaluateCode(language, userCode, question, topic = "") {
  const problemStatement =
    question.problemStatement ||
    question.content ||
    question.description ||
    "No problem statement provided";
  const expectedTestCriteria =
    question.testCriteria ||
    question.expectedCriteria ||
    "Based on problem requirements";

  const codeAnalysis = analyzeCodeStructure(userCode, language);

  // Lấy guidance theo topic (nếu có) để evaluator kiểm tra cả CẤU TRÚC, không chỉ output
  const topicGuidance = topic ? getTopicGuidance(topic, language) : "";

  const prompt = `
You are an automatic code evaluation system. Be fair and focus on correctness of logic as if running the code in an IDE.

PROBLEM REQUIREMENTS:
${problemStatement}

TEST CRITERIA (if any):
${expectedTestCriteria}
${
  topicGuidance
    ? `
REQUIRED STRUCTURE FOR THIS TOPIC (the code must follow this, not just produce the correct output):
${topicGuidance}
`
    : ""
}
STUDENT CODE (${language}):
\`\`\`${language}
${userCode}
\`\`\`

EVALUATION GUIDELINES:
1. Does the code correctly implement the required logic?
2. Does it produce the expected output for typical valid inputs?
${
  topicGuidance
    ? `3. Does the code follow the REQUIRED STRUCTURE above (e.g., inheritance, encapsulation with validation, interfaces, closures, decorators, etc. — whatever the topic requires)? If the topic mandates a specific construct and the code does NOT use it (even if the output happens to be correct), mark correct: false and explain which structural element is missing.
4. Edge cases like empty arrays, null, or undefined should ONLY be considered if the problem statement explicitly mentions them. Otherwise, assume the input will be valid (as in a typical coding challenge environment).`
    : `3. Edge cases like empty arrays, null, or undefined should ONLY be considered if the problem statement explicitly mentions them. Otherwise, assume the input will be valid (as in a typical coding challenge environment).`
}

RULES:
- If the core logic${topicGuidance ? " AND the required structure above" : ""} match the requirements → correct: true
- If the logic is wrong, incomplete, contains syntax errors that would crash${topicGuidance ? ", OR is missing the required structure for this topic" : ""} → correct: false
- Do NOT penalize for missing null/undefined checks unless the problem says "handle null input".
- Return ONLY raw JSON, no markdown, no extra text.

IMPORTANT: Keep feedback SHORT (1-2 sentences max, easy to read). Never use "...".

RETURN VALID JSON:
{
  "correct": true/false,
  "feedback": "Short, specific feedback (1-2 sentences max). If correct, confirm. If incorrect, state what is wrong (logic error or missing required structure)."
}`;

  const systemMsg = `
You are a precise but fair code evaluator.
- Return only raw JSON, no markdown, no \`\`\` .
- Feedback in English, concise and specific (1-2 sentences max). Never use "...".
- Judge the code as if running with typical valid input unless the problem states otherwise.
- Do not require handling of null/undefined unless specified.
- If a REQUIRED STRUCTURE section is provided, treat it as MANDATORY — correct output alone is not enough if the required construct (inheritance, encapsulation, interface, closure, decorator, etc.) is missing.
- Keep feedback SHORT and EASY TO READ.
`;

  let result;

  try {
    result = await callAI(prompt, systemMsg);

    console.log("\n================ CODE EVALUATION RESPONSE ================");
    console.log(result);
    console.log("=========================================================\n");

    const parsed = extractJson(result);

    if (
      !parsed ||
      typeof parsed.correct !== "boolean" ||
      typeof parsed.feedback !== "string"
    ) {
      throw new Error("Invalid JSON structure");
    }

    return {
      correct: parsed.correct,
      feedback: truncate(cleanText(parsed.feedback), 200),
      codeAnalysis,
    };
  } catch (e) {
    console.error("\n=========== CODE EVALUATION ERROR ===========");
    console.error("Error:", e.message);
    console.error("Raw response:", result);
    console.error("============================================\n");

    // ===== Intelligent fallback based on code patterns =====
    const lowerCode = userCode.toLowerCase();
    const lowerProblem = problemStatement.toLowerCase();

    let correct = false;
    let feedback = "Unable to evaluate. Please verify your logic manually.";

    // Sorting problem
    if (
      lowerProblem.includes("sort") &&
      /for|while/.test(lowerCode) &&
      /return/.test(lowerCode)
    ) {
      correct = true;
      feedback = "Sorting logic appears correct. Test with sample inputs.";
    }
    // Find max/min
    else if (
      (lowerProblem.includes("max") || lowerProblem.includes("min")) &&
      /for|while/.test(lowerCode) &&
      />|</.test(lowerCode)
    ) {
      correct = true;
      feedback =
        "Logic for finding max/min looks good. Verify with typical arrays.";
    }
    // Search problem
    else if (
      lowerProblem.includes("search") &&
      /for|while/.test(lowerCode) &&
      (lowerCode.includes("==") || lowerCode.includes("==="))
    ) {
      correct = true;
      feedback = "Search logic looks correct. Test with sample inputs.";
    }
    // OOP-style problems: class with inheritance/interface/constructor patterns
    else if (
      /class\s+\w+/.test(userCode) &&
      (/extends|implements|super\(|: *\w+\s*\{/.test(userCode) ||
        /def __init__|self\./.test(lowerCode) ||
        /#\w+|private |public |get |set /.test(lowerCode))
    ) {
      correct = true;
      feedback =
        "Class structure looks reasonable. Please verify method behavior manually.";
    }
    // Closures / decorators / generators / functional style (JS/Python without explicit class)
    else if (
      /return function|=>\s*{|=>\s*\(|function\s*\(/.test(userCode) ||
      /def\s+\w+\(.*\):\s*\n\s+def\s+\w+/.test(userCode) || // nested def (closure/decorator in Python)
      /@\w+/.test(userCode) || // decorator syntax
      /yield\s+/.test(userCode) || // generator
      /\.map\(|\.filter\(|\.reduce\(/.test(userCode) // functional
    ) {
      correct = false;
      feedback =
        "Code structure looks plausible for this topic, but cannot confirm correctness automatically. Please test manually.";
    }
    // Basic algorithm with loop and condition
    else if (
      /for|while/.test(lowerCode) &&
      /if/.test(lowerCode) &&
      /return/.test(lowerCode)
    ) {
      correct = false;
      feedback =
        "Code structure is plausible, but cannot confirm correctness. Please test manually.";
    }

    return {
      correct,
      feedback,
      codeAnalysis,
    };
  }
}

module.exports = { evaluateCode, analyzeCodeStructure };
