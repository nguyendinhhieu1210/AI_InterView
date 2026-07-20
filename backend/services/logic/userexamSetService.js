// backend/src/services/logic/userexamSetService.js
const ExamSet = require('../../models/ExamSet');

class UserExamSetService {
  // Lấy danh sách exam sets với filter và pagination
  async getUserExamSets(filters = {}) {
    const { programmingLanguage, search, limit = 12, page = 1 } = filters;

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

    return {
      data: examSets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Lấy chi tiết 1 exam set và tăng views
  async getUserExamSetDetail(examSetId) {
    const examSet = await ExamSet.findOne({ _id: examSetId, isActive: true })
      .populate('createdBy', 'name email')
      .populate(
        'questions',
        'question options correctAnswer explanation difficulty programmingLanguage tags'
      );

    if (!examSet) {
      throw new Error('Exam set not found');
    }

    // Tăng views
    examSet.metadata.views = (examSet.metadata.views || 0) + 1;
    await examSet.save();

    return examSet;
  }

  // Lấy danh sách programming languages có exam set
  async getExamSetLanguages() {
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

    return languages;
  }

  // Submit bài thi và tính điểm
  async submitExamSet(examSetId, userAnswers) {
    // Kiểm tra answers
    if (!userAnswers || Object.keys(userAnswers).length === 0) {
      throw new Error('Please provide answers for all questions');
    }

    // Lấy exam set với đầy đủ thông tin
    const examSet = await ExamSet.findOne({
      _id: examSetId,
      isActive: true,
    }).populate({
      path: 'questions',
      select:
        'question options correctAnswer explanation difficulty tags programmingLanguage',
    });

    if (!examSet) {
      throw new Error('Exam set not found');
    }

    // Kiểm tra từng câu hỏi
    const results = [];
    let correctCount = 0;

    examSet.questions.forEach((question) => {
      const userAnswer = userAnswers[question._id.toString()];
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

    return {
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
    };
  }
}

module.exports = new UserExamSetService();
