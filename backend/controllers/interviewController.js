// backend/controllers/interviewController.js
const interviewService = require('../services/logic/interviewService');

// Sinh câu hỏi
const generateQuestions = async (req, res) => {
  try {
    const { topic, difficulty } = req.body;
    const questions = await interviewService.generateQuestions(
      topic,
      difficulty
    );
    res.json({ success: true, questions });
  } catch (error) {
    console.error('AI generate error:', error);
    res
      .status(500)
      .json({ message: error.message || 'Failed to generate questions' });
  }
};

// Nộp bài và chấm điểm
const submitAnswers = async (req, res) => {
  try {
    const userId = req.user.id;
    const { topic, difficulty, questions, answers } = req.body;

    const results = await interviewService.submitAnswers(
      userId,
      topic,
      difficulty,
      questions,
      answers
    );

    return res.json({
      success: true,
      results: {
        totalScore: results.totalScore,
        mcq: results.mcq,
        text: results.text,
      },
    });
  } catch (error) {
    console.error('Submit error:', error);
    res
      .status(500)
      .json({ message: error.message || 'Failed to grade answers' });
  }
};

// Lấy lịch sử tất cả bài làm của user
const getHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const history = await interviewService.getUserHistory(userId);
    res.json({ success: true, history });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ message: 'Failed to fetch history' });
  }
};

// Xóa một bài làm
const deleteHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    await interviewService.deleteUserHistory(userId, id);
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    console.error('Delete history error:', error);
    if (error.message === 'Interview not found') {
      return res.status(404).json({ message: 'Interview not found' });
    }
    res.status(500).json({ message: 'Failed to delete interview' });
  }
};

// Lấy chi tiết một bài làm theo id
const getHistoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const interview = await interviewService.getHistoryById(userId, id);
    res.json({ success: true, interview });
  } catch (error) {
    console.error('Get history by id error:', error);
    if (error.message === 'Interview not found') {
      return res
        .status(404)
        .json({ success: false, message: 'Interview not found' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============ ADMIN CONTROLLERS ============

// Get all interviews (admin)
const getAllInterviews = async (req, res) => {
  try {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: req.query.limit || 10,
      search: req.query.search,
      difficulty: req.query.difficulty,
      topic: req.query.topic,
      fromDate: req.query.fromDate,
      toDate: req.query.toDate,
    };

    const result = await interviewService.getAllInterviews(filters);
    res.json({
      success: true,
      interviews: result.interviews,
      total: result.total,
      pages: result.pages,
      currentPage: result.currentPage,
    });
  } catch (error) {
    console.error('Get all interviews error:', error);
    res.status(500).json({ message: 'Failed to fetch interviews' });
  }
};

// Get interview stats
const getInterviewStats = async (req, res) => {
  try {
    const stats = await interviewService.getInterviewStats();
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
};

// Get single interview by id (admin)
const getInterviewByIdForAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const interview = await interviewService.getInterviewByIdForAdmin(id);
    res.json({ success: true, interview });
  } catch (error) {
    console.error('Get interview by id error:', error);
    if (error.message === 'Interview not found') {
      return res.status(404).json({ message: 'Interview not found' });
    }
    res.status(500).json({ message: 'Failed to fetch interview' });
  }
};

// Delete interview by id (admin)
const deleteInterviewById = async (req, res) => {
  try {
    const { id } = req.params;
    await interviewService.deleteInterviewById(id);
    res.json({ success: true, message: 'Interview deleted successfully' });
  } catch (error) {
    console.error('Delete interview error:', error);
    if (error.message === 'Interview not found') {
      return res.status(404).json({ message: 'Interview not found' });
    }
    res.status(500).json({ message: 'Failed to delete interview' });
  }
};

module.exports = {
  generateQuestions,
  submitAnswers,
  getHistory,
  deleteHistory,
  getHistoryById,
  // Admin
  getAllInterviews,
  getInterviewStats,
  getInterviewByIdForAdmin,
  deleteInterviewById,
};
