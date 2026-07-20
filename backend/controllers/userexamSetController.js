// backend/src/controllers/userexamSetController.js
const userExamSetService = require('../services/logic/userexamSetService');

// 1. Lấy danh sách exam sets cho user (chỉ active)
exports.getUserExamSets = async (req, res) => {
  try {
    const { programmingLanguage, search, limit = 12, page = 1 } = req.query;

    const result = await userExamSetService.getUserExamSets({
      programmingLanguage,
      search,
      limit,
      page,
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Get user exam sets error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 2. Lấy chi tiết 1 exam set cho user
exports.getUserExamSetDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const examSet = await userExamSetService.getUserExamSetDetail(id);

    res.json({
      success: true,
      data: examSet,
    });
  } catch (error) {
    console.error('Get user exam set detail error:', error);

    if (error.message === 'Exam set not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 3. Lấy các programming languages có exam set
exports.getExamSetLanguages = async (req, res) => {
  try {
    const languages = await userExamSetService.getExamSetLanguages();

    res.json({
      success: true,
      data: languages,
    });
  } catch (error) {
    console.error('Get exam set languages error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 4. Submit bài thi
exports.submitExamSet = async (req, res) => {
  try {
    const { id } = req.params;
    const { answers } = req.body;

    const result = await userExamSetService.submitExamSet(id, answers);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Submit exam set error:', error);

    if (error.message === 'Exam set not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === 'Please provide answers for all questions') {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
