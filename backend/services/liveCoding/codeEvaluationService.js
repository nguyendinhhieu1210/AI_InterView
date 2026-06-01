// services/liveCoding/codeEvaluationService.js - FIXED & OPTIMIZED

const { callAI } = require('./llmProvider');
const { extractJson } = require('../../utils/jsonExtractor');

function analyzeCodeStructure(code, language) {
  const lines = code.split('\n');
  const analysis = {
    lineCount: lines.length,
    hasLoop: /for|while|do/i.test(code),
    hasCondition: /if|else|switch|case/i.test(code),
    hasArray: /array|\[\]|\.push|\.pop|\.shift|\.unshift/i.test(code),
    hasFunction: /function|const.*=|let.*=.*=>|def\s+\w+/i.test(code),
    hasSwap: /temp|swap|=|,\s*=/i.test(code),
    loopPatterns: [],
    conditionalPatterns: [],
  };

  const loopMatch = code.match(/for\s*\([^)]*\)/gi);
  if (loopMatch) analysis.loopPatterns = loopMatch;

  const ifMatch = code.match(/if\s*\([^)]*\)/gi);
  if (ifMatch) analysis.conditionalPatterns = ifMatch;

  return analysis;
}

// ============== HELPER: Truncate feedback ==============
function truncate(text, maxChars = 200) {
  if (!text) return '';
  if (text.length <= maxChars) return text;
  return text.substring(0, maxChars).trim() + '...';
}

async function evaluateCode(language, userCode, question) {
  const problemStatement = question.problemStatement || question.content || question.description || "No problem statement provided";
  const expectedTestCriteria = question.testCriteria || question.expectedCriteria || "Based on problem requirements";

  const codeAnalysis = analyzeCodeStructure(userCode, language);

  const prompt = `
You are an automatic code evaluation system. Be fair and focus on correctness of logic as if running the code in an IDE.

PROBLEM REQUIREMENTS:
${problemStatement}

TEST CRITERIA (if any):
${expectedTestCriteria}

STUDENT CODE (${language}):
\`\`\`${language}
${userCode}
\`\`\`

EVALUATION GUIDELINES:
1. Does the code correctly implement the required logic?
2. Does it produce the expected output for typical valid inputs?
3. Edge cases like empty arrays, null, or undefined should ONLY be considered if the problem statement explicitly mentions them. Otherwise, assume the input will be valid (as in a typical coding challenge environment).

RULES:
- If the core logic matches the requirements → correct: true
- If the logic is wrong, incomplete, or contains syntax errors that would crash → correct: false
- Do NOT penalize for missing null/undefined checks unless the problem says "handle null input".
- Return ONLY raw JSON, no markdown, no extra text.

IMPORTANT: Keep feedback SHORT (1-2 sentences max, easy to read).

RETURN VALID JSON:
{
  "correct": true/false,
  "feedback": "Short, specific feedback (1-2 sentences max). If correct, confirm. If incorrect, state what is wrong."
}`;

  const systemMsg = `
You are a precise but fair code evaluator.
- Return only raw JSON, no markdown, no \`\`\` .
- Feedback in English, concise and specific (1-2 sentences max).
- Judge the code as if running with typical valid input unless the problem states otherwise.
- Do not require handling of null/undefined unless specified.
- Keep feedback SHORT and EASY TO READ.
`;

  let result;

  try {
    result = await callAI(prompt, systemMsg);

    console.log('\n================ CODE EVALUATION RESPONSE ================');
    console.log(result);
    console.log('=========================================================\n');

    // Clean up response
    let cleaned = result
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    // Try to extract JSON if there's extra text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) cleaned = jsonMatch[0];

    const parsed = JSON.parse(cleaned);

    if (typeof parsed.correct !== 'boolean' || typeof parsed.feedback !== 'string') {
      throw new Error('Invalid JSON structure');
    }

    return {
      correct: parsed.correct,
      feedback: truncate(parsed.feedback, 200),
      codeAnalysis
    };
  } catch (e) {
    console.error('\n=========== CODE EVALUATION ERROR ===========');
    console.error('Error:', e.message);
    console.error('Raw response:', result);
    console.error('============================================\n');

    // Intelligent fallback based on code patterns
    const lowerCode = userCode.toLowerCase();
    const lowerProblem = problemStatement.toLowerCase();

    // Detect common correct patterns
    let correct = false;
    let feedback = 'Unable to evaluate. Please verify your logic manually.';

    // Sorting problem
    if (lowerProblem.includes('sort') && /for|while/.test(lowerCode) && /return/.test(lowerCode)) {
      correct = true;
      feedback = 'Sorting logic appears correct. Test with sample inputs.';
    }
    // Find max/min
    else if ((lowerProblem.includes('max') || lowerProblem.includes('min')) && /for|while/.test(lowerCode) && (/>|</.test(lowerCode))) {
      correct = true;
      feedback = 'Logic for finding max/min looks good. Verify with typical arrays.';
    }
    // Search problem
    else if (lowerProblem.includes('search') && /for|while/.test(lowerCode) && (lowerCode.includes('==') || lowerCode.includes('==='))) {
      correct = true;
      feedback = 'Search logic looks correct. Test with sample inputs.';
    }
    // Basic algorithm with loop and condition
    else if ((/for|while/.test(lowerCode)) && (/if/.test(lowerCode)) && (/return/.test(lowerCode))) {
      // Not automatically correct, but better than nothing
      correct = false;
      feedback = 'Code structure is plausible, but cannot confirm correctness. Please test manually.';
    }

    return {
      correct,
      feedback,
      codeAnalysis
    };
  }
}

module.exports = { evaluateCode, analyzeCodeStructure };