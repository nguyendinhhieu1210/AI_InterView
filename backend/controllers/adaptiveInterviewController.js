// controllers/adaptiveInterviewController.js
const adaptiveServices = require('../services/logic/adaptiveServices');

// ========== USER FUNCTIONS ==========
const startAdaptiveInterview = async (req, res) => {
  try {
    const { topic, questionCount } = req.body;
    const userId = req.user.id;

    const result = await adaptiveServices.startInterview(
      userId,
      topic,
      questionCount
    );

    res.status(201).json(result);
  } catch (error) {
    console.error('Start adaptive interview error:', error);

    if (error.message === 'Topic is required') {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to start interview' });
  }
};

const submitAnswer = async (req, res) => {
  try {
    const { sessionId, answer } = req.body;
    const userId = req.user.id;

    const result = await adaptiveServices.submitAnswer(
      sessionId,
      userId,
      answer
    );

    res.json(result);
  } catch (error) {
    console.error('Submit answer error:', error);

    if (error.message === 'Session ID and answer are required') {
      return res.status(400).json({ error: error.message });
    }

    if (error.message === 'Session not found or expired') {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (error.message === 'Interview already completed') {
      return res.status(400).json({ error: 'Session already completed' });
    }

    if (error.message === 'Unauthorized') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (error.message === 'Session expired due to inactivity.') {
      return res
        .status(400)
        .json({ error: 'Session expired due to inactivity' });
    }

    res.status(500).json({ error: 'Failed to process answer' });
  }
};

const getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const session = await adaptiveServices.getSessionById(sessionId, userId);

    res.json(session);
  } catch (error) {
    console.error('Get session error:', error);

    if (error.message === 'Session not found') {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.status(500).json({ error: 'Failed to fetch session' });
  }
};

const getHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const history = await adaptiveServices.getUserHistory(userId);

    res.json({ success: true, history });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch history' });
  }
};

// ========== ADMIN FUNCTIONS ==========
const getAllSessions = async (req, res) => {
  try {
    const sessions = await adaptiveServices.getAllSessionsForAdmin();

    res.json({ success: true, sessions });
  } catch (error) {
    console.error('Admin get all sessions error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sessions' });
  }
};

const getSessionDetail = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await adaptiveServices.getSessionDetailForAdmin(sessionId);

    res.json({ success: true, session });
  } catch (error) {
    console.error('Admin get session detail error:', error);

    if (error.message === 'Session not found') {
      return res
        .status(404)
        .json({ success: false, error: 'Session not found' });
    }

    res
      .status(500)
      .json({ success: false, error: 'Failed to fetch session detail' });
  }
};

const deleteSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    await adaptiveServices.deleteSessionForAdmin(sessionId);

    res.json({ success: true, message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Admin delete session error:', error);

    if (error.message === 'Session not found') {
      return res
        .status(404)
        .json({ success: false, error: 'Session not found' });
    }

    res.status(500).json({ success: false, error: 'Failed to delete session' });
  }
};

module.exports = {
  startAdaptiveInterview,
  submitAnswer,
  getSession,
  getHistory,
  getAllSessions,
  getSessionDetail,
  deleteSession,
};
