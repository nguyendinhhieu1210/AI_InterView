const CVService = require('../services/logic/cvServices');

/**
 * Upload CV file
 */
const uploadCV = async (req, res) => {
  try {
    const file = req.file;
    const userId = req.user?.id;

    const result = await CVService.uploadCV(file, userId);
    return res.json({ success: true, ...result });
  } catch (error) {
    console.error('Upload CV error:', error.message);
    // Xóa file nếu còn tồn tại
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        // ignore
      }
    }
    // Nếu lỗi là duplicate => 429, còn lại 500
    const status = error.message.includes('Duplicate upload') ? 429 : 500;
    return res.status(status).json({ error: error.message });
  }
};

/**
 * Analyze CV text directly
 */
const analyzeCVText = async (req, res) => {
  try {
    const { cvText } = req.body;
    const result = await CVService.analyzeCVText(cvText);
    return res.json(result);
  } catch (error) {
    console.error('analyzeCVText error:', error.message);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Generate interview questions
 */
const generateQuestionsFromText = async (req, res) => {
  try {
    const { cvText, selectedSkills } = req.body;
    const questions = await CVService.generateQuestions(cvText, selectedSkills);
    return res.json({ success: true, questions });
  } catch (error) {
    console.error('Generate questions error:', error.message);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Submit interview answers
 */
const submitCVAnswers = async (req, res) => {
  try {
    const { questions, answers, selectedSkills, cvName } = req.body;
    const userId = req.user?.id;

    const result = await CVService.submitAnswers(
      userId,
      questions,
      answers,
      selectedSkills,
      cvName
    );

    return res.json({
      success: true,
      results: {
        mcq: result.mcq,
        text: result.text,
        totalScore: result.totalScore,
        summary: result.summary,
      },
      sessionId: result.sessionId,
    });
  } catch (error) {
    console.error('Submit CV answers error:', error.message);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Get all CV interview history
 */
const getCVSessionHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    const sessions = await CVService.getHistory(userId);
    return res.json({ success: true, history: sessions });
  } catch (error) {
    console.error('Get CV session history error:', error.message);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Get CV interview detail
 */
const getCVSessionDetail = async (req, res) => {
  try {
    const userId = req.user?.id;
    const sessionId = req.params.id;
    const session = await CVService.getDetail(userId, sessionId);
    return res.json({ success: true, history: session });
  } catch (error) {
    console.error('Get CV session detail error:', error.message);
    return res.status(500).json({ error: error.message });
  }
};

// ---------------- ADMIN ----------------

/**
 * ADMIN: Get all CV sessions
 */
const getAllCVSessions = async (req, res) => {
  try {
    const result = await CVService.getAllSessionsForAdmin(req.query);
    return res.json({ success: true, ...result });
  } catch (error) {
    console.error('Get all CV sessions error:', error.message);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * ADMIN: Get single CV session by id
 */
const getCVSessionByIdForAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await CVService.getSessionDetailForAdmin(id);
    return res.json({ success: true, session });
  } catch (error) {
    console.error('Get CV session by id error:', error.message);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * ADMIN: Delete CV session by id
 */
const deleteCVSessionById = async (req, res) => {
  try {
    const { id } = req.params;
    await CVService.deleteSessionForAdmin(id);
    return res.json({
      success: true,
      message: 'CV session deleted successfully',
    });
  } catch (error) {
    console.error('Delete CV session error:', error.message);
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  uploadCV,
  analyzeCVText,
  generateQuestionsFromText,
  submitCVAnswers,
  getCVSessionHistory,
  getCVSessionDetail,
  getAllCVSessions,
  getCVSessionByIdForAdmin,
  deleteCVSessionById,
};
