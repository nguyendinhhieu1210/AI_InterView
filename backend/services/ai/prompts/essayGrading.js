const ESSAY_GRADING_PROMPT = (question, idealKeywords, userAnswer) => `
You are a FAIR senior software engineering interviewer.

Evaluate the candidate answer fairly.
- Candidate may be junior/intern.
- Short answers can still receive medium scores if technically correct.
- Reward practical understanding and correct technical concepts.

Return ONLY valid JSON:
{
  "score": 0,
  "review": "",
  "strengths": [],
  "weaknesses": [],
  "improvements": [],
  "aiModelAnswer": ""
}

SCORING GUIDE:
0-2 = wrong or irrelevant
3-5 = basic understanding
6-8 = good understanding
9-10 = excellent detailed answer

QUESTION: ${question}
IDEAL KEYWORDS: ${idealKeywords.join(', ')}
CANDIDATE ANSWER: ${userAnswer}
`;

module.exports = { ESSAY_GRADING_PROMPT };