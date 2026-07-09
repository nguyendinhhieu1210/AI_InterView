// backend/src/controllers/userexamSetController.js
const ExamSet = require('../models/ExamSet');

// 1. Lấy danh sách exam sets cho user (chỉ active)
exports.getUserExamSets = async (req, res) => {
  try {
    const { programmingLanguage, search, limit = 12, page = 1 } = req.query;

    let query = { isActive: true };

    if (programmingLanguage) query.programmingLanguage = programmingLanguage;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { programmingLanguage: { $regex: search, $options: 'i' } },
      ];
    }

    const examSets = await ExamSet.find(query)
      .populate('createdBy', 'name email')
      .populate(
        'questions',
        'question options correctAnswer explanation difficulty programmingLanguage'
      )
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await ExamSet.countDocuments(query);

    res.json({
      success: true,
      data: examSets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
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

    const examSet = await ExamSet.findOne({ _id: id, isActive: true })
      .populate('createdBy', 'name email')
      .populate(
        'questions',
        'question options correctAnswer explanation difficulty programmingLanguage tags'
      );

    if (!examSet) {
      return res.status(404).json({
        success: false,
        message: 'Exam set not found',
      });
    }

    // Tăng views
    examSet.metadata.views = (examSet.metadata.views || 0) + 1;
    await examSet.save();

    res.json({
      success: true,
      data: examSet,
    });
  } catch (error) {
    console.error('Get user exam set detail error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 3. Lấy các programming languages có exam set
exports.getExamSetLanguages = async (req, res) => {
  try {
    const languages = await ExamSet.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$programmingLanguage',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          programmingLanguage: '$_id',
          count: 1,
          _id: 0,
        },
      },
      { $sort: { programmingLanguage: 1 } },
    ]);

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

// ✅ 4. Submit bài thi - THÊM HÀM NÀY
exports.submitExamSet = async (req, res) => {
  try {
    const { id } = req.params;
    const { answers } = req.body;

    // Kiểm tra answers
    if (!answers || Object.keys(answers).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide answers for all questions',
      });
    }

    // Lấy exam set với đầy đủ thông tin (bao gồm cả đáp án đúng)
    const examSet = await ExamSet.findOne({ _id: id, isActive: true }).populate(
      {
        path: 'questions',
        select:
          'question options correctAnswer explanation difficulty tags programmingLanguage',
      }
    );

    if (!examSet) {
      return res.status(404).json({
        success: false,
        message: 'Exam set not found',
      });
    }

    // Kiểm tra từng câu hỏi
    const results = [];
    let correctCount = 0;

    examSet.questions.forEach((question) => {
      const userAnswer = answers[question._id.toString()];
      const isCorrect = userAnswer === question.correctAnswer;

      if (isCorrect) correctCount++;

      results.push({
        questionId: question._id,
        question: question.question,
        options: question.options,
        userAnswer: userAnswer || null,
        correctAnswer: question.correctAnswer,
        isCorrect: isCorrect,
        explanation: question.explanation,
        difficulty: question.difficulty,
      });
    });

    const totalQuestions = examSet.questions.length;
    const score = Math.round((correctCount / totalQuestions) * 100);

    // Cập nhật metadata
    examSet.metadata.timesPracticed =
      (examSet.metadata.timesPracticed || 0) + 1;
    if (examSet.metadata.averageScore) {
      examSet.metadata.averageScore = Math.round(
        (examSet.metadata.averageScore + score) / 2
      );
    } else {
      examSet.metadata.averageScore = score;
    }
    await examSet.save();

    res.json({
      success: true,
      data: {
        examSetId: examSet._id,
        examSetName: examSet.name,
        totalQuestions,
        correctCount,
        score,
        results,
        isPassed: score >= 70,
        message:
          score >= 70
            ? '🎉 Congratulations! You passed the exam!'
            : '📚 Keep practicing! You can do better!',
      },
    });
  } catch (error) {
    console.error('Submit exam set error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
