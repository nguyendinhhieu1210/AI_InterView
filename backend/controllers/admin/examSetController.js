// backend/src/controllers/admin/examSetController.js
const ExamSet = require('../../models/ExamSet');
const Question = require('../../models/Question');

// ============ ADMIN CONTROLLERS ============

// 1. Lấy danh sách tất cả exam sets
exports.getExamSets = async (req, res) => {
  try {
    const { programmingLanguage, search, status } = req.query;

    let query = {};

    // Lọc theo status: 'active', 'inactive', hoặc lấy tất cả (không truyền status)
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

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
      .sort({ createdAt: -1 });

    // Tính stats
    const total = examSets.length;
    const active = examSets.filter((e) => e.isActive).length;
    const inactive = examSets.filter((e) => !e.isActive).length;
    const totalQuestions = examSets.reduce(
      (sum, e) => sum + (e.totalQuestions || 0),
      0
    );

    res.json({
      success: true,
      data: examSets,
      count: examSets.length,
      stats: {
        total,
        active,
        inactive,
        totalQuestions,
      },
    });
  } catch (error) {
    console.error('Get exam sets error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 2. Lấy chi tiết 1 exam set
exports.getExamSetById = async (req, res) => {
  try {
    const { id } = req.params;

    const examSet = await ExamSet.findById(id)
      .populate('createdBy', 'name email')
      .populate(
        'questions',
        'question options correctAnswer explanation difficulty tags programmingLanguage'
      );

    if (!examSet) {
      return res.status(404).json({
        success: false,
        message: 'Exam set not found',
      });
    }

    // Tăng lượt xem
    examSet.metadata.views = (examSet.metadata.views || 0) + 1;
    await examSet.save();

    res.json({
      success: true,
      data: examSet,
    });
  } catch (error) {
    console.error('Get exam set error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 3. Tạo exam set mới (có kiểm tra trùng lặp ngôn ngữ)
exports.createExamSet = async (req, res) => {
  try {
    const {
      name,
      programmingLanguage,
      description,
      numberOfQuestions = 20,
    } = req.body;

    if (!programmingLanguage) {
      return res.status(400).json({
        success: false,
        message: 'Programming language is required',
      });
    }

    // ✅ KIỂM TRA: Đã có exam set nào cho ngôn ngữ này chưa (bất kể active hay inactive)
    const existingExamSet = await ExamSet.findOne({
      programmingLanguage: programmingLanguage,
    });

    if (existingExamSet) {
      return res.status(400).json({
        success: false,
        message: `An exam set for "${programmingLanguage}" already exists. Please delete the existing exam set first before creating a new one.`,
        existingExamSet: {
          id: existingExamSet._id,
          name: existingExamSet.name,
          isActive: existingExamSet.isActive,
          createdAt: existingExamSet.createdAt,
        },
      });
    }

    // Kiểm tra số lượng câu hỏi có sẵn
    const totalAvailable = await Question.countDocuments({
      programmingLanguage: programmingLanguage,
      isActive: true,
    });

    if (totalAvailable === 0) {
      return res.status(404).json({
        success: false,
        message: `No questions found for programming language: "${programmingLanguage}"`,
      });
    }

    if (numberOfQuestions > totalAvailable) {
      return res.status(400).json({
        success: false,
        message: `Only ${totalAvailable} questions available for "${programmingLanguage}". Please reduce the number of questions.`,
        available: totalAvailable,
        requested: numberOfQuestions,
      });
    }

    const actualLimit = Math.min(numberOfQuestions, totalAvailable);

    // Lấy câu hỏi random
    const questions = await Question.aggregate([
      { $match: { programmingLanguage: programmingLanguage, isActive: true } },
      { $sample: { size: actualLimit } },
    ]);

    if (questions.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No questions found for programming language: "${programmingLanguage}"`,
      });
    }

    // Tính toán difficulty stats
    const difficultyStats = { Easy: 0, Medium: 0, Hard: 0, Expert: 0 };
    questions.forEach((q) => {
      if (difficultyStats[q.difficulty] !== undefined) {
        difficultyStats[q.difficulty] += 1;
      }
    });

    const examSet = new ExamSet({
      name:
        name ||
        `${programmingLanguage} Exam Set ${new Date().toLocaleDateString()}`,
      programmingLanguage,
      description: description || `Exam set about ${programmingLanguage}`,
      questions: questions.map((q) => q._id),
      difficultyStats,
      totalQuestions: questions.length,
      createdBy: req.user.id,
      metadata: {
        views: 0,
        timesPracticed: 0,
        averageScore: 0,
      },
    });

    await examSet.save();

    await examSet.populate(
      'questions',
      'question options correctAnswer explanation difficulty programmingLanguage'
    );

    res.status(201).json({
      success: true,
      message: `✅ Created exam set with ${questions.length} questions about "${programmingLanguage}"`,
      data: examSet,
    });
  } catch (error) {
    console.error('Create exam set error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 4. Cập nhật exam set - chỉ cập nhật name, description, isActive
exports.updateExamSet = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    const examSet = await ExamSet.findById(id);
    if (!examSet) {
      return res.status(404).json({
        success: false,
        message: 'Exam set not found',
      });
    }

    if (name) examSet.name = name;
    if (description !== undefined) examSet.description = description;
    if (isActive !== undefined) {
      examSet.isActive = isActive;
      console.log(
        `📝 Exam set "${examSet.name}" status changed to: ${isActive ? 'ACTIVE' : 'INACTIVE'}`
      );
    }

    await examSet.save();

    res.json({
      success: true,
      message: `Exam set ${isActive !== undefined ? (isActive ? 'activated' : 'deactivated') : 'updated'} successfully`,
      data: examSet,
    });
  } catch (error) {
    console.error('Update exam set error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 5. Xóa exam set - HARD DELETE (xóa thật)
exports.deleteExamSet = async (req, res) => {
  try {
    const { id } = req.params;

    const examSet = await ExamSet.findById(id);
    if (!examSet) {
      return res.status(404).json({
        success: false,
        message: 'Exam set not found',
      });
    }

    await ExamSet.findByIdAndDelete(id);

    console.log(`🗑️ Exam set "${examSet.name}" permanently deleted`);

    res.json({
      success: true,
      message: 'Exam set permanently deleted successfully',
      deletedId: id,
    });
  } catch (error) {
    console.error('Delete exam set error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 6. Thêm câu hỏi vào exam set
exports.addQuestionsToExamSet = async (req, res) => {
  try {
    const { id } = req.params;
    const { questionIds } = req.body;

    if (!questionIds || questionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide question IDs',
      });
    }

    const examSet = await ExamSet.findById(id);
    if (!examSet) {
      return res.status(404).json({
        success: false,
        message: 'Exam set not found',
      });
    }

    const existingIds = examSet.questions.map((q) => q.toString());
    const newQuestions = questionIds.filter(
      (qId) => !existingIds.includes(qId)
    );

    if (newQuestions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'All questions already in this exam set',
      });
    }

    // Kiểm tra câu hỏi có cùng ngôn ngữ với exam set
    const validQuestions = await Question.find({
      _id: { $in: newQuestions },
      programmingLanguage: examSet.programmingLanguage,
      isActive: true,
    });

    if (validQuestions.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No valid questions found for language: ${examSet.programmingLanguage}`,
      });
    }

    const invalidQuestions = newQuestions.filter(
      (qId) => !validQuestions.some((q) => q._id.toString() === qId)
    );

    if (invalidQuestions.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Some questions do not belong to language: ${examSet.programmingLanguage}`,
        invalidQuestions: invalidQuestions,
      });
    }

    examSet.questions.push(...validQuestions.map((q) => q._id));
    examSet.totalQuestions = examSet.questions.length;

    // Cập nhật difficulty stats
    const allQuestions = await Question.find({
      _id: { $in: examSet.questions },
    });
    const stats = { Easy: 0, Medium: 0, Hard: 0, Expert: 0 };
    allQuestions.forEach((q) => {
      if (stats[q.difficulty] !== undefined) {
        stats[q.difficulty] += 1;
      }
    });
    examSet.difficultyStats = stats;

    await examSet.save();

    res.json({
      success: true,
      message: `Added ${validQuestions.length} questions to exam set`,
      data: examSet,
    });
  } catch (error) {
    console.error('Add questions error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 7. Xóa câu hỏi khỏi exam set
exports.removeQuestionFromExamSet = async (req, res) => {
  try {
    const { id, questionId } = req.params;

    const examSet = await ExamSet.findById(id);
    if (!examSet) {
      return res.status(404).json({
        success: false,
        message: 'Exam set not found',
      });
    }

    examSet.questions = examSet.questions.filter(
      (q) => q.toString() !== questionId
    );
    examSet.totalQuestions = examSet.questions.length;

    // Cập nhật lại difficulty stats
    const questions = await Question.find({ _id: { $in: examSet.questions } });
    const stats = { Easy: 0, Medium: 0, Hard: 0, Expert: 0 };
    questions.forEach((q) => {
      if (stats[q.difficulty] !== undefined) {
        stats[q.difficulty] += 1;
      }
    });
    examSet.difficultyStats = stats;

    await examSet.save();

    res.json({
      success: true,
      message: 'Question removed from exam set',
      data: examSet,
    });
  } catch (error) {
    console.error('Remove question error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 8. Group exam sets by programming language
exports.getExamSetsGroupedByLanguage = async (req, res) => {
  try {
    const grouped = await ExamSet.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$programmingLanguage',
          count: { $sum: 1 },
          examSets: {
            $push: {
              id: '$_id',
              name: '$name',
              totalQuestions: '$totalQuestions',
              description: '$description',
              createdAt: '$createdAt',
            },
          },
          totalQuestionsAcrossAll: { $sum: '$totalQuestions' },
        },
      },
      {
        $project: {
          programmingLanguage: '$_id',
          count: 1,
          examSets: 1,
          totalQuestionsAcrossAll: 1,
          _id: 0,
        },
      },
      { $sort: { programmingLanguage: 1 } },
    ]);

    res.json({
      success: true,
      data: grouped,
    });
  } catch (error) {
    console.error('Group exam sets error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
