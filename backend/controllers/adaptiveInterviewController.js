// controllers/adaptiveInterviewController.js
const adaptiveService = require('../services/adaptiveInterviewService');
const AdaptiveSession = require('../models/AdaptiveSession');

exports.startAdaptiveInterview = async (req, res) => {
  try {
    const { topic, difficulty } = req.body;
    const userId = req.user.id;
    if (!topic || !difficulty) {
      return res.status(400). json({ error: 'Topic and difficulty are required' });
    }
    const { sessionId, firstQuestion } = await adaptiveService.startSession(userId, topic, difficulty);
    res.status(201).json({ sessionId, firstQuestion });
  } catch (error) {
    console.error('Start adaptive interview error:', error);
    res.status(500).json({ error: 'Failed to start interview' });
  }
};

exports.submitAnswer = async (req, res) => {
  try {
    const { sessionId, answer } = req.body;
    const userId = req.user.id;
    if (!sessionId || !answer) {
      return res.status(400).json({ error: 'Session ID and answer are required' });
    }
    const result = await adaptiveService.processAnswer(sessionId, userId, answer);
    res.json(result);
  } catch (error) {
    console.error('Submit answer error:', error);
    if (error.message === 'Session not found') return res.status(404).json({ error: 'Session not found' });
    if (error.message === 'Session is already finished') return res.status(400).json({ error: 'Session already completed' });
    res.status(500).json({ error: 'Failed to process answer' });
  }
};

exports.getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    const session = await AdaptiveSession.findOne({ _id: sessionId, userId });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch session' });
  }
};

// ✅ SỬA LẠI: Trả về đúng cấu trúc frontend cần
exports.getHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const sessions = await AdaptiveSession.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    const history = sessions.map(session => {
      // Đếm số câu hỏi thực tế từ conversation
      const questions = session.conversation?.filter(
        msg => msg.role === 'assistant' && msg.type === 'question'
      ) || [];
      const totalQuestions = questions.length;

      // finalScore lưu thang 10 -> chuyển sang thang 100
      const totalScore = (session.finalScore || 0) * 10;

      // Adaptive chỉ có dạng essay (không MCQ)
      const essayScore = totalScore;
      const essayCount = totalQuestions;

      return {
        id: session._id,
        type: 'adaptive',
        topic: session.topic || 'Adaptive Interview',
        difficulty: session.difficulty || 'Adaptive',
        totalQuestions: totalQuestions,
        createdAt: session.createdAt,
        totalScore: totalScore,
        mcqScore: null,
        mcqCount: null,
        essayScore: essayScore,
        essayCount: essayCount,
        detailPath: `/adaptive-history/${session._id}`, // bạn cần tạo route này sau
        skillTags: null
      };
    });

    res.json({ success: true, history });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch history' });
  }
};