// weaknessAnalyzer.js
const Groq = require('groq-sdk');

const groqClient = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

// Configuration
const WRONG_THRESHOLD = 50;        // score < 50 → wrong answer
const MIN_ATTEMPTS_FOR_WEAK = 2;   // need at least 2 attempts to consider a topic weak
const MAX_WEAK_TOPICS = 3;

const SKILL_PATTERNS = {
  closure: 'JavaScript Closures',
  hoisting: 'JavaScript Hoisting',
  'event loop': 'Event Loop & Async',
  promise: 'JavaScript Promises',
  async: 'Async/Await',
  await: 'Async/Await',
  usestate: 'React useState',
  useeffect: 'React useEffect',
  redux: 'Redux',
  context: 'React Context',
  props: 'React Props',
  state: 'React State',
  lifecycle: 'React Lifecycle',
  solid: 'SOLID Principles',
  'single responsibility': 'SOLID - Single Responsibility',
  'open closed': 'SOLID - Open/Closed',
  liskov: 'SOLID - Liskov Substitution',
  'interface segregation': 'SOLID - Interface Segregation',
  'dependency inversion': 'SOLID - Dependency Inversion',
  docker: 'Docker',
  container: 'Docker Containers',
  dockerfile: 'Dockerfile',
  'docker build': 'Docker Build',
  'docker volume': 'Docker Volumes',
  oop: 'OOP',
  class: 'OOP Classes',
  inheritance: 'OOP Inheritance',
  polymorphism: 'OOP Polymorphism',
  encapsulation: 'OOP Encapsulation',
  abstraction: 'OOP Abstraction',
};

/**
 * Normalize a score to 0-100.
 * Supports: 0-1 (multiply by 100), 0-10 (multiply by 10), already 0-100.
 */
function normalizeScore(score) {
  if (typeof score !== 'number') return 0;
  if (score >= 0 && score <= 1) return Math.round(score * 100);
  if (score >= 0 && score <= 10) return Math.round(score * 10);
  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Compute weakness score for a topic (0-1).
 * Requires at least MIN_ATTEMPTS_FOR_WEAK attempts.
 */
function computeTopicWeaknessScore(stat) {
  if (stat.count < MIN_ATTEMPTS_FOR_WEAK) return 0;
  const wrongRate = stat.wrongCount / stat.count;
  const avgScore = stat.totalScore / stat.count;
  // 60% weight on wrong rate, 40% on low average score
  const score = wrongRate * 0.6 + ((100 - avgScore) / 100) * 0.4;
  return Math.min(1, Math.max(0, score));
}

/**
 * Identify weak topics from all answers.
 */
function getWeakTopicsAdvanced(answers) {
  const topicStats = new Map();

  for (const ans of answers) {
    const topic = (ans.topic || 'General').trim().toLowerCase() || 'general';
    const score = normalizeScore(ans.score);
    const isWrong = score < WRONG_THRESHOLD;

    if (!topicStats.has(topic)) {
      topicStats.set(topic, {
        totalScore: 0,
        count: 0,
        wrongCount: 0,
        recentScores: [],
      });
    }
    const stat = topicStats.get(topic);
    stat.totalScore += score;
    stat.count++;
    if (isWrong) stat.wrongCount++;
    stat.recentScores.push({ score, createdAt: ans.createdAt });
  }

  const weakTopics = [];
  for (const [topic, stat] of topicStats.entries()) {
    const weaknessScore = computeTopicWeaknessScore(stat);
    if (weaknessScore === 0) continue; // not enough attempts or perfect

    const avgScore = stat.totalScore / stat.count;
    const wrongRate = (stat.wrongCount / stat.count) * 100;

    // Trend: compare last two scores if available
    let trend = 'stable';
    if (stat.recentScores.length >= 2) {
      const last = stat.recentScores[stat.recentScores.length - 1].score;
      const prev = stat.recentScores[stat.recentScores.length - 2].score;
      if (last > prev + 5) trend = 'improving';
      else if (last < prev - 5) trend = 'declining';
    }

    let level = 'stableLevel';
    if (weaknessScore > 0.7) level = 'critical';
    else if (weaknessScore > 0.4) level = 'needsImprovement';

    weakTopics.push({
      topic,
      averageScore: Math.round(avgScore),
      wrongRate: Math.round(wrongRate),
      count: stat.count,
      weaknessScore: Math.round(weaknessScore * 100),
      trend,
      level,
    });
  }

  return weakTopics
    .sort((a, b) => b.weaknessScore - a.weaknessScore)
    .slice(0, MAX_WEAK_TOPICS);
}

/**
 * Identify learning patterns from wrong answers.
 */
function identifyLearningPatterns(wrongAnswers) {
  const patternCount = new Map();
  for (const ans of wrongAnswers) {
    const text = (ans.question + ' ' + (ans.userAnswer || '') + ' ' + (ans.aiFeedback || '')).toLowerCase();
    for (const [keyword, patternName] of Object.entries(SKILL_PATTERNS)) {
      if (text.includes(keyword)) {
        patternCount.set(patternName, (patternCount.get(patternName) || 0) + 1);
      }
    }
  }
  return Array.from(patternCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, count]) => ({ name, count }));
}

/**
 * Compute overall trend based on recent vs older answers.
 */
function computeOverallTrend(answers) {
  if (answers.length < 2) return 'stable';
  const sorted = [...answers].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const recent = sorted.slice(-3);
  const older = sorted.slice(0, Math.max(1, sorted.length - 3));
  const recentAvg = recent.reduce((s, a) => s + normalizeScore(a.score), 0) / recent.length;
  const olderAvg = older.reduce((s, a) => s + normalizeScore(a.score), 0) / older.length;
  if (recentAvg > olderAvg + 5) return 'improving';
  if (recentAvg < olderAvg - 5) return 'declining';
  return 'stable';
}

/**
 * AI‑generated study plan (unchanged, but uses normalized scores).
 */
async function generateStudyPlan(weakTopics, patterns, overallTrend, wrongAnswers) {
  if (!groqClient) return null;
  const prompt = `Bạn là chuyên gia lập trình. Dựa trên dữ liệu điểm yếu của học viên, hãy đề xuất một kế hoạch học tập có cấu trúc gồm 3 bước cụ thể. Mỗi bước gồm: "action", "resource", "time". Trả về JSON hợp lệ, ví dụ: { "steps": [ { "action": "...", "resource": "...", "time": "..." } ] }
Dữ liệu:
- Weak topics: ${JSON.stringify(weakTopics.map(t => ({ topic: t.topic, wrongRate: t.wrongRate, level: t.level })))}
- Learning patterns: ${JSON.stringify(patterns)}
- Overall trend: ${overallTrend}
- Số câu sai gần đây: ${wrongAnswers.slice(0, 2).map(a => a.question).join(', ')}`;

  try {
    const response = await groqClient.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      response_format: { type: 'json_object' },
    });
    const content = response.choices[0]?.message?.content;
    return content ? JSON.parse(content) : null;
  } catch (err) {
    console.error('Groq study plan error:', err);
    return null;
  }
}

/**
 * Main analysis function – call this from your API route.
 * @param {Array} answers - List of answer objects with at least { score, topic, question, userAnswer, aiFeedback, createdAt }
 * @param {string} userId
 * @param {object} extraInfo
 */
async function analyzeWeaknesses(answers, userId, extraInfo = {}) {
  // Normalize scores before any calculation
  const normalizedAnswers = answers.map(ans => ({
    ...ans,
    score: normalizeScore(ans.score),
  }));

  const wrongAnswers = normalizedAnswers.filter(a => a.score < WRONG_THRESHOLD);
  const weakTopics = getWeakTopicsAdvanced(normalizedAnswers);
  const patterns = identifyLearningPatterns(wrongAnswers);
  const overallTrend = computeOverallTrend(normalizedAnswers);
  const studyPlan = await generateStudyPlan(weakTopics, patterns, overallTrend, wrongAnswers);

  const totalQuestions = normalizedAnswers.length;
  const totalScoreSum = normalizedAnswers.reduce((s, a) => s + a.score, 0);
  const averageScore = totalQuestions ? totalScoreSum / totalQuestions : 0;
  const totalWrongCount = wrongAnswers.length;
  const overallWrongRate = totalQuestions ? (totalWrongCount / totalQuestions) * 100 : 0;

  const recentWrong = [...wrongAnswers]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
    .map(w => ({
      questionText: w.question,
      userAnswer: w.userAnswer,
      score: w.score,
      aiFeedback: w.aiFeedback,
      topic: w.topic,
      createdAt: w.createdAt,
    }));

  return {
    userId,
    totalInterviews: extraInfo.totalInterviews || 0,
    totalCVSessions: extraInfo.totalCVSessions || 0,
    totalQuestions,
    totalWrongCount,          // new field
    overallWrongRate: Math.round(overallWrongRate), // new field
    averageScore: Math.round(averageScore),
    overallTrend,
    weakTopics,
    learningPatterns: patterns,
    studyPlan,
    wrongQuestions: recentWrong,
    recommendation: studyPlan ? null : 'Tập trung vào các pattern lỗi và luyện lại.',
  };
}

module.exports = { analyzeWeaknesses };