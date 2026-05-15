// backend/services/aiService.js
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Helper: extract JSON safely
 */
const safeParseJSON = (text) => {
  try {
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      throw new Error('No JSON found');
    }

    const jsonString = text.substring(firstBrace, lastBrace + 1);
    return JSON.parse(jsonString);
  } catch (err) {
    throw new Error('Invalid JSON format from AI');
  }
};

/**
 * Sinh bộ câu hỏi phỏng vấn (7 MCQ + 3 tự luận)
 */
const generateInterviewQuestions = async (topic, difficulty) => {
  const prompt = `
You are a senior technical interviewer with deep expertise.

Generate a quiz about "${topic}" at "${difficulty}" level.

IMPORTANT RULES:
- All answers MUST be factually correct according to real-world programming knowledge.
- Do NOT hallucinate or invent incorrect concepts.
- Follow JavaScript / programming standards strictly.

OUTPUT FORMAT:
Return ONLY valid JSON (no markdown, no explanation).

{
  "mcq": [
    {
      "question": "string",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "must exactly match one option",
      "explanation": "2-4 simple sentences explaining correct + why others are wrong"
    }
  ],
  "text": [
    {
      "question": "string",
      "idealAnswerKeywords": ["keyword1", "keyword2"],
      "sampleAnswer": "short answer"
    }
  ]
}

REQUIREMENTS:
- mcq length = 7
- text length = 3
- options length = 4 each
`;

  const chatCompletion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.3, // FIX: giảm hallucination
  });

  const responseText = chatCompletion.choices[0]?.message?.content || '';

  const parsed = safeParseJSON(responseText);

  return {
    mcq: Array.isArray(parsed.mcq) ? parsed.mcq : [],
    text: Array.isArray(parsed.text) ? parsed.text : []
  };
};

/**
 * Chấm điểm câu trả lời tự luận (0-10)
 */
const gradeEssay = async (question, userAnswer, idealAnswerKeywords) => {
  const prompt = `
You are a strict technical interviewer.

Grade this answer fairly.

Question: ${question}

Expected keywords: ${idealAnswerKeywords.join(', ')}

User answer: ${userAnswer || 'No answer provided'}

RULES:
- Score from 0 to 10 (decimal allowed)
- Be strict but fair
- Focus on correctness and keyword coverage

OUTPUT ONLY JSON:
{
  "score": number,
  "explanation": "why this score",
  "feedback": "how to improve"
}
`;

  const chatCompletion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.2, // FIX: ổn định hơn khi chấm điểm
  });

  const responseText = chatCompletion.choices[0]?.message?.content || '{}';

  try {
    const result = safeParseJSON(responseText);

    let score = typeof result.score === 'number' ? result.score : 0;
    score = Math.max(0, Math.min(10, score));
    score = Math.round(score * 10) / 10;

    return {
      score,
      explanation: result.explanation || 'No explanation provided.',
      feedback: result.feedback || 'No feedback provided.'
    };
  } catch (error) {
    console.error('gradeEssay parse error:', error.message);

    // fallback keyword matching
    const lowerAnswer = (userAnswer || '').toLowerCase();
    let matched = 0;

    for (const kw of idealAnswerKeywords || []) {
      if (lowerAnswer.includes(kw.toLowerCase())) matched++;
    }

    const fallbackScore =
      idealAnswerKeywords?.length
        ? (matched / idealAnswerKeywords.length) * 10
        : 0;

    return {
      score: Math.round(fallbackScore * 10) / 10,
      explanation: 'Fallback scoring due to AI parsing error.',
      feedback: 'Try to include more technical keywords and detailed explanation.'
    };
  }
};

module.exports = {
  generateInterviewQuestions,
  gradeEssay
};