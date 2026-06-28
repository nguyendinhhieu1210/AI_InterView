const LiveCodingService = require('../services/logic/liveCodingServices');

// ========== CONTROLLER FUNCTIONS ==========

const getDomainsByLanguage = async (req, res) => {
  try {
    const { language } = req.query;
    const domains = LiveCodingService.getDomains(language);
    res.json({ domains });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getTopicsByLanguageAndDomain = async (req, res) => {
  try {
    const { language, domain } = req.query;
    const topics = LiveCodingService.getTopics(language, domain);
    res.json({ topics });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const startInterview = async (req, res) => {
  try {
    const { language, domain, topicName, difficulty } = req.body;
    const userId = req.user.id;
    const result = await LiveCodingService.startInterview(userId, {
      language,
      domain,
      topicName,
      difficulty,
    });
    res
      .status(201)
      .json({ sessionId: result.sessionId, question: result.question });
  } catch (error) {
    console.error('Start interview error:', error);
    res.status(400).json({ error: error.message });
  }
};

const getCurrentQuestion = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const question = LiveCodingService.getCurrentQuestion(
      sessionId,
      req.user.id
    );
    res.json({ currentQuestion: question });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

const submitCode = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { code } = req.body;
    const result = await LiveCodingService.submitCode(
      sessionId,
      req.user.id,
      code
    );
    res.json(result);
  } catch (error) {
    console.error(error);
    const status = error.message.includes('already been answered') ? 400 : 404;
    res.status(status).json({ error: error.message });
  }
};

const submitExplanation = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { answer } = req.body;
    const result = await LiveCodingService.submitExplanation(
      sessionId,
      req.user.id,
      answer
    );
    res.json(result);
  } catch (error) {
    console.error(error);
    const status = error.message.includes('already been answered') ? 400 : 500;
    res.status(status).json({ error: error.message });
  }
};

const nextCodeQuestion = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const question = await LiveCodingService.nextCodeQuestion(
      sessionId,
      req.user.id
    );
    res.json({ nextQuestion: question });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

const getLastEvaluation = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const evaluation = await LiveCodingService.getLastEvaluation(
      sessionId,
      req.user.id
    );
    if (evaluation === null) {
      return res.json({ evaluation: null, message: 'No evaluation yet' });
    }
    res.json({ evaluation });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

const getSessionHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const history = await LiveCodingService.getSessionHistory(
      sessionId,
      req.user.id
    );
    res.json(history);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

const getSessionList = async (req, res) => {
  try {
    const history = await LiveCodingService.getSessionList(req.user.id);
    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getSessionDetail = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await LiveCodingService.getSessionDetail(
      sessionId,
      req.user.id
    );
    if (!session) {
      return res.status(404).json({ success: false, session: null });
    }
    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ========== ADMIN CONTROLLERS ==========

const getAllCodingSessions = async (req, res) => {
  try {
    const result = await LiveCodingService.getAllSessionsForAdmin(req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Get all coding sessions error:', error);
    res.status(500).json({ message: error.message });
  }
};

const getCodingSessionByIdForAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await LiveCodingService.getSessionDetailForAdmin(id);
    res.json({ success: true, session });
  } catch (error) {
    console.error('Get coding session by id error:', error);
    res.status(500).json({ message: error.message });
  }
};

const deleteCodingSessionById = async (req, res) => {
  try {
    const { id } = req.params;
    await LiveCodingService.deleteSessionForAdmin(id);
    res.json({ success: true, message: 'Coding session deleted successfully' });
  } catch (error) {
    console.error('Delete coding session error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDomainsByLanguage,
  getTopicsByLanguageAndDomain,
  startInterview,
  getCurrentQuestion,
  submitCode,
  submitExplanation,
  nextCodeQuestion,
  getLastEvaluation,
  getSessionHistory,
  getSessionList,
  getSessionDetail,
  getAllCodingSessions,
  getCodingSessionByIdForAdmin,
  deleteCodingSessionById,
};
