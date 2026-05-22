const adaptiveService = require('../services/adaptiveInterviewService');

exports.startAdaptiveInterview = async (req, res) => {
  try {
    const { topic, difficulty } = req.body;
    const userId = req.user.id; // từ middleware auth

    if (!topic || !difficulty) {
      return res.status(400).json({ error: 'Topic and difficulty are required' });
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
    if (error.message === 'Session not found') {
      return res.status(404).json({ error: 'Session not found' });
    }
    if (error.message === 'Session is already finished') {
      return res.status(400).json({ error: 'Session already completed' });
    }
    res.status(500).json({ error: 'Failed to process answer' });
  }
};

// Optional: lấy thông tin một phiên (để hiển thị lại lịch sử)
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