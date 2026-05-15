// controllers/weaknessController.js
const InterviewResult = require('../models/InterviewResult');
const CVInterviewSession = require('../models/CVInterviewSession');
const { analyzeWeaknesses } = require('../services/weaknessService');

// ------------------------- CHUẨN HÓA ĐIỂM (0-10 -> 0-100) -------------------------
const normalizeScore = (score) => {
  if (typeof score !== 'number') return 0;
  return score <= 10 ? score * 10 : score;
};

/**
 * Suy luận topic dựa trên nội dung câu hỏi và danh sách topic có sẵn
 * @param {string} questionText - Nội dung câu hỏi
 * @param {string[]} availableTopics - Mảng các topic (ví dụ ["SOLID", "Docker"])
 * @param {string} defaultTopic - Topic mặc định nếu không match
 * @returns {string} topic phù hợp nhất
 */
function inferTopicForQuestion(questionText, availableTopics, defaultTopic = 'General') {
  if (!availableTopics || availableTopics.length === 0) return defaultTopic;
  const lowerQuestion = questionText.toLowerCase();
  // Tìm topic đầu tiên xuất hiện trong câu hỏi (theo từ khoá)
  for (const topic of availableTopics) {
    const lowerTopic = topic.toLowerCase();
    if (lowerQuestion.includes(lowerTopic)) {
      return topic;
    }
  }
  // Nếu không match, trả về topic đầu tiên (giữ nguyên casing gốc)
  return availableTopics[0];
}

// ------------------------- CHUẨN HÓA DỮ LIỆU TỪ INTERVIEW RESULT -------------------------
function normalizeInterviewAnswers(record) {
  const answers = [];
  // Lấy danh sách topic từ record (có thể là array hoặc string)
  let availableTopics = [];
  if (record.topic) {
    availableTopics = Array.isArray(record.topic) ? record.topic : [record.topic];
  }
  const defaultTopic = availableTopics.length ? availableTopics[0] : 'General';

  // Xử lý mcqResults (cấu trúc mới)
  if (record.mcqResults && Array.isArray(record.mcqResults)) {
    record.mcqResults.forEach((mcq) => {
      const questionText = mcq.question || '';
      const topic = inferTopicForQuestion(questionText, availableTopics, defaultTopic);
      answers.push({
        question: questionText,
        userAnswer: mcq.userAnswer,
        score: normalizeScore(mcq.score),
        aiFeedback: mcq.explanation || '',
        topic: topic,
        type: 'mcq',
        createdAt: record.completedAt,
      });
    });
  }
  // Fallback cho cấu trúc cũ (results.mcq)
  else if (record.results?.mcq && Array.isArray(record.results.mcq)) {
    record.results.mcq.forEach((mcq) => {
      const questionText = mcq.question || '';
      const topic = inferTopicForQuestion(questionText, availableTopics, defaultTopic);
      answers.push({
        question: questionText,
        userAnswer: mcq.userAnswer,
        score: normalizeScore(mcq.score),
        aiFeedback: mcq.explanation || '',
        topic: topic,
        type: 'mcq',
        createdAt: record.completedAt,
      });
    });
  }

  // Xử lý textResults (mới)
  if (record.textResults && Array.isArray(record.textResults)) {
    record.textResults.forEach((text) => {
      const questionText = text.question || '';
      const topic = inferTopicForQuestion(questionText, availableTopics, defaultTopic);
      answers.push({
        question: questionText,
        userAnswer: text.userAnswer,
        score: normalizeScore(text.score),
        aiFeedback: text.feedback || text.explanation || '',
        topic: topic,
        type: 'essay',
        createdAt: record.completedAt,
      });
    });
  }
  // Fallback cũ (results.text)
  else if (record.results?.text && Array.isArray(record.results.text)) {
    record.results.text.forEach((text) => {
      const questionText = text.question || '';
      const topic = inferTopicForQuestion(questionText, availableTopics, defaultTopic);
      answers.push({
        question: questionText,
        userAnswer: text.userAnswer,
        score: normalizeScore(text.score),
        aiFeedback: text.feedback || text.explanation || '',
        topic: topic,
        type: 'essay',
        createdAt: record.completedAt,
      });
    });
  }

  return answers;
}

// ------------------------- CHUẨN HÓA DỮ LIỆU TỪ CV SESSION -------------------------
function normalizeCVAnswers(session) {
  const answers = [];
  // Lấy danh sách topic từ session (array)
  const availableTopics = session.topic && Array.isArray(session.topic) ? session.topic : [];
  const defaultTopic = availableTopics.length ? availableTopics[0] : 'CV Skills';

  if (session.results && Array.isArray(session.results)) {
    session.results.forEach((res) => {
      const questionText = res.question || '';
      const topic = inferTopicForQuestion(questionText, availableTopics, defaultTopic);
      answers.push({
        question: questionText,
        userAnswer: res.userAnswer,
        score: normalizeScore(res.score),
        aiFeedback: res.aiFeedback || res.explanation || res.review || '',
        topic: topic,
        type: res.type || 'essay',
        createdAt: session.createdAt,
      });
    });
  }
  return answers;
}

// ------------------------- CONTROLLER CHÍNH -------------------------
async function getUserWeakness(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const [interviewResults, cvSessions] = await Promise.all([
      InterviewResult.find({ userId }).lean(),
      CVInterviewSession.find({ userId }).lean(),
    ]);

    console.log(`📊 Found ${interviewResults.length} interview results, ${cvSessions.length} CV sessions`);

    let allAnswers = [];
    for (const record of interviewResults) {
      allAnswers.push(...normalizeInterviewAnswers(record));
    }
    for (const session of cvSessions) {
      allAnswers.push(...normalizeCVAnswers(session));
    }

    if (allAnswers.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          userId,
          totalInterviews: interviewResults.length,
          totalCVSessions: cvSessions.length,
          totalQuestions: 0,
          averageScore: 0,
          weakTopics: [],
          weakConcepts: [],
          wrongQuestions: [],
          aiSummary: null,
          recommendation: 'Chưa có dữ liệu phỏng vấn. Hãy hoàn thành bài phỏng vấn đầu tiên.',
        },
      });
    }

    const analysis = await analyzeWeaknesses(allAnswers, userId, {
      totalInterviews: interviewResults.length,
      totalCVSessions: cvSessions.length,
    });

    return res.status(200).json({ success: true, data: analysis });
  } catch (error) {
    console.error('Weakness analysis error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

module.exports = { getUserWeakness };