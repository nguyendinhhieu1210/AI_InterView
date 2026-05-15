const { GroqService } = require('../ai/groqService');
const { ESSAY_GRADING_PROMPT } = require('../ai/prompts/essayGrading');
const { safeParseJson } = require('../ai/parsers/jsonParser');
const { HumanMessage } = require('@langchain/core/messages');

const groqService = new GroqService(process.env.GROQ_API_KEY, 'llama-3.1-8b-instant', 0.2);

async function gradeCVAnswersAdvanced(questions, answers) {
  const { mcq = [], text = [] } = questions;
  const mcqResults = [];
  const textResults = [];

  // MCQ grading (giữ nguyên logic cũ)
  for (let i = 0; i < mcq.length; i++) {
    const q = mcq[i];
    const userAnswer = answers[`mcq_${i}`] || '';
    const isCorrect = userAnswer.trim().toLowerCase() === (q.correctAnswer || '').trim().toLowerCase();
    mcqResults.push({
      type: 'mcq', difficulty: q.difficulty, question: q.question,
      options: q.options, userAnswer, correctAnswer: q.correctAnswer,
      isCorrect, score: isCorrect ? 10 : 0,
      review: isCorrect ? '✅ Correct' : `❌ Incorrect, correct: ${q.correctAnswer}`,
      explanation: q.explanation || ''
    });
  }

  // Essay grading với AI
  for (let i = 0; i < text.length; i++) {
    const q = text[i];
    const userAnswer = (answers[`text_${i}`] || '').trim();
    if (!userAnswer) {
      textResults.push(createEmptyEssayResult(q, i));
      continue;
    }

    // Tính heuristic sơ bộ
    const answerLower = userAnswer.toLowerCase();
    const wordCount = userAnswer.split(/\s+/).filter(Boolean).length;
    const matchedKeywords = (q.idealAnswerKeywords || []).filter(kw => answerLower.includes(kw.toLowerCase()));
    const keywordScore = matchedKeywords.length;
    const hasExample = /(example|for example|e\.g|such as|ví dụ)/i.test(userAnswer);
    const hasTechnicalTerms = /(react|api|database|performance|optimization|docker|jwt|frontend|backend|cache|render|memo|lazy loading|usememo|usecallback)/i.test(answerLower);
    const hasExplanation = /(because|to|helps|improve|reduce|avoid|prevent|increase|optimize|để|giúp|tránh|tăng|giảm)/i.test(answerLower);
    
    let estimatedScore = 0;
    if (wordCount >= 5) estimatedScore += 2;
    if (wordCount >= 15) estimatedScore += 2;
    if (wordCount >= 30) estimatedScore += 1;
    estimatedScore += Math.min(3, keywordScore);
    if (hasTechnicalTerms) estimatedScore += 1;
    if (hasExplanation) estimatedScore += 1;
    if (hasExample) estimatedScore += 1;
    estimatedScore = Math.min(10, estimatedScore);

    // Gọi AI chấm
    const prompt = ESSAY_GRADING_PROMPT(q.question, q.idealAnswerKeywords || [], userAnswer);
    const messages = [new HumanMessage(prompt)];
    let aiResult;
    try {
      const raw = await groqService.invokeWithRetry(messages);
      aiResult = await safeParseJson(raw);
    } catch (err) {
      console.error(`Essay grading AI failed for Q${i}, using heuristic`, err);
      aiResult = { score: estimatedScore, review: "Fallback grading", strengths: [], weaknesses: [], improvements: [], aiModelAnswer: q.aiSuggestedAnswer };
    }
    
    let finalScore = aiResult.score;
    // Điều chỉnh công bằng
    if (keywordScore >= 2 && hasTechnicalTerms && finalScore < 6) finalScore = 6;
    if (keywordScore >= 3 && hasExplanation && finalScore < 7) finalScore = 7;
    if (keywordScore >= 4 && wordCount >= 20 && finalScore < 8) finalScore = 8;
    if (wordCount < 5 && finalScore > 5) finalScore = 5;
    if (wordCount <= 12 && keywordScore >= 2 && finalScore < 5) finalScore = 5;
    finalScore = Math.min(10, Math.max(0, finalScore));

    textResults.push({
      type: 'essay', difficulty: q.difficulty, question: q.question,
      yourAnswer: userAnswer,
      score: finalScore,
      aiReview: aiResult.review || 'Evaluated.',
      strengths: aiResult.strengths || [],
      mistakes: aiResult.weaknesses || [],
      improvements: aiResult.improvements || [],
      importantKeywords: matchedKeywords,
      aiSuggestedAnswer: aiResult.aiModelAnswer || q.aiSuggestedAnswer,
      analysis: { wordCount, keywordMatchedCount: keywordScore, hasExample, hasTechnicalTerms, hasExplanation }
    });
  }

  const allResults = [...mcqResults, ...textResults];
  const totalAchieved = allResults.reduce((s, r) => s + r.score, 0);
  const finalScore = Math.round((totalAchieved / (allResults.length * 10)) * 100);
  let level = finalScore >= 85 ? 'Excellent' : finalScore >= 70 ? 'Good' : finalScore >= 50 ? 'Average' : 'Needs Improvement';

  return { totalScore: finalScore, level, mcq: mcqResults, text: textResults, summary: { overall: `Candidate achieved ${finalScore}% - ${level}`, statistics: { totalQuestions: allResults.length, totalMcq: mcqResults.length, totalEssay: textResults.length } } };
}

function createEmptyEssayResult(q, idx) {
  return {
    type: 'essay', difficulty: q.difficulty, question: q.question,
    yourAnswer: '', score: 0, aiReview: 'No answer provided.',
    strengths: [], mistakes: ['Missing answer'], improvements: ['Provide an explanation', 'Add technical details'],
    importantKeywords: [], aiSuggestedAnswer: q.aiSuggestedAnswer || '',
    analysis: { wordCount: 0, keywordMatchedCount: 0, hasExample: false, hasTechnicalTerms: false, hasExplanation: false }
  };
}

module.exports = { gradeCVAnswersAdvanced };