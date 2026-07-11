const Question = require('../../models/Question');
const UserProgress = require('../../models/UserProgress');
const { validationResult } = require('express-validator');
const xlsx = require('xlsx');
const fs = require('fs');

// ==========================================
// HELPER: Kiểm tra các option có bị trùng không
// ==========================================
const areOptionsUnique = (options) => {
  const values = [options.A, options.B, options.C, options.D];
  const unique = new Set(values);
  return unique.size === values.length;
};

// ========================================
// ============ ADMIN CONTROLLERS ============
// ========================================

// 1. Lấy danh sách câu hỏi (có filter + pagination)
exports.getQuestions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      programmingLanguage,
      difficulty,
      tags,
      search,
      isActive,
      isFeatured,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};
    if (programmingLanguage) query.programmingLanguage = programmingLanguage;
    if (difficulty) query.difficulty = difficulty;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (isFeatured !== undefined) query.isFeatured = isFeatured === 'true';
    if (tags) query.tags = { $in: tags.split(',') };
    if (search) {
      query.$text = { $search: search };
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const questions = await Question.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('createdBy', 'name email');

    const total = await Question.countDocuments(query);

    const statsQuery = {};
    if (programmingLanguage)
      statsQuery.programmingLanguage = programmingLanguage;
    if (difficulty) statsQuery.difficulty = difficulty;
    if (tags) statsQuery.tags = { $in: tags.split(',') };
    if (search) {
      statsQuery.$text = { $search: search };
    }

    const allActive = await Question.countDocuments({
      ...statsQuery,
      isActive: true,
    });
    const allInactive = await Question.countDocuments({
      ...statsQuery,
      isActive: false,
    });
    const allFeatured = await Question.countDocuments({
      ...statsQuery,
      isFeatured: true,
    });
    const allTotal = await Question.countDocuments(statsQuery);

    res.json({
      success: true,
      data: questions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        total: allTotal,
        active: allActive,
        inactive: allInactive,
        featured: allFeatured,
      },
    });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Tạo câu hỏi mới (đã thêm kiểm tra trùng lặp)
exports.createQuestion = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const {
      question,
      options,
      correctAnswer,
      explanation,
      programmingLanguage,
      difficulty,
      tags,
      isFeatured,
    } = req.body;

    // Validate options
    if (!options.A || !options.B || !options.C || !options.D) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all 4 options (A, B, C, D)',
      });
    }

    // ✅ Kiểm tra trùng lặp
    if (!areOptionsUnique(options)) {
      return res.status(400).json({
        success: false,
        message: 'Options A, B, C, D must be different from each other',
      });
    }

    // Validate correct answer
    if (!['A', 'B', 'C', 'D'].includes(correctAnswer.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Correct answer must be A, B, C, or D',
      });
    }

    const newQuestion = new Question({
      question: question.trim(),
      options: {
        A: options.A.trim(),
        B: options.B.trim(),
        C: options.C.trim(),
        D: options.D.trim(),
      },
      correctAnswer: correctAnswer.toUpperCase(),
      explanation: explanation.trim(),
      programmingLanguage: programmingLanguage.trim(),
      difficulty: difficulty || 'Medium',
      tags: tags || [],
      isFeatured: isFeatured || false,
      createdBy: req.user.id,
    });

    await newQuestion.save();

    res.status(201).json({
      success: true,
      message: '✅ Question created successfully!',
      data: newQuestion,
    });
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 3. Cập nhật câu hỏi (đã thêm kiểm tra trùng lặp)
exports.updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    delete updates._id;
    delete updates.createdAt;
    delete updates.createdBy;
    delete updates.stats;

    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found',
      });
    }

    if (updates.options) {
      if (
        !updates.options.A ||
        !updates.options.B ||
        !updates.options.C ||
        !updates.options.D
      ) {
        return res.status(400).json({
          success: false,
          message: 'Please provide all 4 options (A, B, C, D)',
        });
      }

      // ✅ Kiểm tra trùng lặp
      if (!areOptionsUnique(updates.options)) {
        return res.status(400).json({
          success: false,
          message: 'Options A, B, C, D must be different from each other',
        });
      }
    }

    if (updates.correctAnswer) {
      if (!['A', 'B', 'C', 'D'].includes(updates.correctAnswer.toUpperCase())) {
        return res.status(400).json({
          success: false,
          message: 'Correct answer must be A, B, C, or D',
        });
      }
      updates.correctAnswer = updates.correctAnswer.toUpperCase();
    }

    Object.assign(question, updates);
    await question.save();

    res.json({
      success: true,
      message: '✅ Question updated successfully!',
      data: question,
    });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 4. Xóa câu hỏi - Chỉ xóa khi inactive và không nằm trong exam set nào
exports.deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found',
      });
    }

    if (question.isActive === true) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete active question. Please deactivate it first.',
      });
    }

    const ExamSet = require('../../models/ExamSet');
    const examSets = await ExamSet.find({
      questions: id,
      isActive: true,
    });

    if (examSets.length > 0) {
      const examSetNames = examSets.map((es) => es.name).join(', ');
      return res.status(400).json({
        success: false,
        message: `Cannot delete question. It is being used in active exam set(s): ${examSetNames}`,
        examSets: examSets.map((es) => ({ id: es._id, name: es.name })),
      });
    }

    await Question.findByIdAndDelete(id);

    res.json({
      success: true,
      message: '✅ Question permanently deleted successfully!',
      deletedId: id,
    });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 5. Import Excel (đã thêm kiểm tra trùng lặp cho từng dòng)
exports.importQuestionsFromExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an Excel file',
      });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const data = xlsx.utils.sheet_to_json(worksheet, {
      defval: '',
      raw: false,
    });

    fs.unlinkSync(req.file.path);

    if (data.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Excel file is empty',
      });
    }

    console.log('📋 Excel headers:', Object.keys(data[0]));
    console.log('📊 Total rows:', data.length);

    const questions = [];
    const errors = [];

    data.forEach((row, index) => {
      try {
        const getValue = (value) => String(value ?? '').trim();

        const question = getValue(row.Question);
        const optionA = getValue(row['Option A']);
        const optionB = getValue(row['Option B']);
        const optionC = getValue(row['Option C']);
        const optionD = getValue(row['Option D']);
        const correctAnswer = getValue(row['Correct Answer']).toUpperCase();
        const explanation = getValue(row.Explanation);
        const programmingLanguage = getValue(row['Programming Language']);
        const difficulty = getValue(row.Difficulty) || 'Medium';
        const tagsRaw = getValue(row.Tags);
        const featuredRaw = getValue(row.Featured);

        const missing = [];
        if (!question) missing.push('Question');
        if (!optionA) missing.push('Option A');
        if (!optionB) missing.push('Option B');
        if (!optionC) missing.push('Option C');
        if (!optionD) missing.push('Option D');
        if (!correctAnswer) missing.push('Correct Answer');
        if (!explanation) missing.push('Explanation');
        if (!programmingLanguage) missing.push('Programming Language');

        if (missing.length > 0) {
          errors.push({
            row: index + 2,
            error: `Missing: ${missing.join(', ')}`,
            data: row,
          });
          return;
        }

        if (!['A', 'B', 'C', 'D'].includes(correctAnswer)) {
          errors.push({
            row: index + 2,
            error: `Correct Answer must be A, B, C, or D (got: ${correctAnswer})`,
            data: row,
          });
          return;
        }

        // ✅ Kiểm tra trùng lặp options
        const options = { A: optionA, B: optionB, C: optionC, D: optionD };
        if (!areOptionsUnique(options)) {
          errors.push({
            row: index + 2,
            error: 'Options A, B, C, D must be different from each other',
            data: row,
          });
          return;
        }

        let tags = [];
        if (tagsRaw) {
          tags = tagsRaw
            .split(',')
            .map((t) => t.trim())
            .filter((t) => t);
        }

        const isFeatured = ['YES', 'TRUE'].includes(featuredRaw.toUpperCase());

        questions.push({
          question,
          options,
          correctAnswer,
          explanation,
          programmingLanguage,
          difficulty,
          tags,
          isFeatured,
          createdBy: req.user.id,
        });
      } catch (error) {
        errors.push({
          row: index + 2,
          error: error.message,
          data: row,
        });
      }
    });

    console.log(`✅ Valid questions: ${questions.length}`);
    console.log(`❌ Errors: ${errors.length}`);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Some rows have errors (${errors.length} errors)`,
        errors: errors,
        totalRows: data.length,
        validRows: questions.length,
      });
    }

    if (questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid questions to import',
      });
    }

    const result = await Question.insertMany(questions);
    const languages = await Question.getAllProgrammingLanguages();

    res.status(201).json({
      success: true,
      message: `✅ Successfully imported ${result.length} questions!`,
      total: result.length,
      programmingLanguages: languages,
      data: result,
    });
  } catch (error) {
    console.error('Import error:', error);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 6. Tạo bộ đề
exports.createExamSet = async (req, res) => {
  try {
    const { programmingLanguage, numberOfQuestions = 20, name } = req.body;

    if (!programmingLanguage) {
      return res.status(400).json({
        success: false,
        message: 'Programming language is required',
      });
    }

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

    const actualLimit = Math.min(numberOfQuestions, totalAvailable);

    const questions = await Question.getRandomQuestions({
      programmingLanguage,
      limit: actualLimit,
    });

    const difficultyStats = {};
    questions.forEach((q) => {
      difficultyStats[q.difficulty] = (difficultyStats[q.difficulty] || 0) + 1;
    });

    const examSet = {
      name:
        name ||
        `${programmingLanguage} Exam Set ${new Date().toLocaleDateString()}`,
      programmingLanguage,
      totalQuestions: questions.length,
      totalAvailable,
      difficultyStats,
      questions: questions.map((q) => ({
        id: q._id,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: q.difficulty,
        isFeatured: q.isFeatured,
      })),
      createdAt: new Date(),
    };

    res.json({
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

// 7. Lấy danh sách programming languages
exports.getProgrammingLanguages = async (req, res) => {
  try {
    const languages = await Question.getAllProgrammingLanguages();

    res.json({
      success: true,
      data: languages,
    });
  } catch (error) {
    console.error('Get programming languages error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 8. Export Excel
exports.exportQuestionsToExcel = async (req, res) => {
  try {
    const { programmingLanguage } = req.query;
    const query = { isActive: true };
    if (programmingLanguage) query.programmingLanguage = programmingLanguage;

    const questions = await Question.find(query)
      .select(
        'question options correctAnswer explanation programmingLanguage difficulty tags isFeatured'
      )
      .lean();

    if (questions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No questions found to export',
      });
    }

    const excelData = questions.map((q) => ({
      Question: q.question,
      'Option A': q.options.A,
      'Option B': q.options.B,
      'Option C': q.options.C,
      'Option D': q.options.D,
      'Correct Answer': q.correctAnswer,
      Explanation: q.explanation,
      'Programming Language': q.programmingLanguage,
      Difficulty: q.difficulty,
      Tags: q.tags.join(', '),
      Featured: q.isFeatured ? 'Yes' : 'No',
    }));

    const worksheet = xlsx.utils.json_to_sheet(excelData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Questions');

    const filename = `questions_${programmingLanguage || 'all'}_${Date.now()}.xlsx`;
    const filepath = `uploads/${filename}`;
    xlsx.writeFile(workbook, filepath);

    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      fs.unlinkSync(filepath);
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================================
// ============ USER CONTROLLERS ============
// ========================================

// 9. Lấy câu hỏi practice
exports.getPracticeQuestions = async (req, res) => {
  try {
    const { programmingLanguage, limit = 10, mode = 'random' } = req.query;

    if (!programmingLanguage) {
      return res.status(400).json({
        success: false,
        message: 'Programming language is required',
      });
    }

    let questions = [];

    if (mode === 'smart') {
      const userProgress = await UserProgress.find({
        user: req.user.id,
        status: { $in: ['incorrect', 'pending'] },
      }).distinct('question');

      questions = await Question.getRandomQuestions({
        programmingLanguage,
        limit: parseInt(limit),
        excludeIds: userProgress,
      });

      if (questions.length < limit) {
        const extraQuestions = await Question.getRandomQuestions({
          programmingLanguage,
          limit: parseInt(limit) - questions.length,
          excludeIds: questions.map((q) => q._id),
        });
        questions = [...questions, ...extraQuestions];
      }
    } else {
      questions = await Question.getRandomQuestions({
        programmingLanguage,
        limit: parseInt(limit),
      });
    }

    if (questions.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No questions available for programming language: "${programmingLanguage}"`,
      });
    }

    res.json({
      success: true,
      programmingLanguage,
      count: questions.length,
      data: questions,
    });
  } catch (error) {
    console.error('Get practice questions error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 10. Submit answer
exports.submitAnswer = async (req, res) => {
  try {
    const { questionId, answer, timeSpent = 0 } = req.body;

    if (!questionId || !answer) {
      return res.status(400).json({
        success: false,
        message: 'Question ID and answer are required',
      });
    }

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found',
      });
    }

    const result = question.checkAnswer(answer);
    await question.save();

    const progress = await UserProgress.findOneAndUpdate(
      { user: req.user.id, question: questionId },
      {
        $set: {
          status: result.isCorrect ? 'correct' : 'incorrect',
          timeSpent: timeSpent,
          lastPracticed: new Date(),
        },
        $inc: { attempts: 1 },
      },
      { upsert: true, new: true }
    );

    const nextQuestion = await Question.findOne({
      programmingLanguage: question.programmingLanguage,
      _id: { $ne: questionId },
      isActive: true,
    })
      .sort({ 'stats.correctAttempts': 1 })
      .select('-__v -stats');

    res.json({
      success: true,
      isCorrect: result.isCorrect,
      message: result.isCorrect
        ? '🎉 Correct answer!'
        : '❌ Incorrect. Keep learning!',
      correctAnswer: result.correctAnswer,
      explanation: result.explanation,
      progress,
      nextQuestion,
    });
  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 11. Lấy thống kê của user
exports.getUserStats = async (req, res) => {
  try {
    const stats = await UserProgress.getUserStats(req.user.id);
    const topicStats = await UserProgress.getTopicStats(req.user.id);

    res.json({
      success: true,
      data: {
        ...stats,
        topicStats,
        accuracy:
          stats.totalQuestions > 0
            ? Math.round((stats.correct / stats.totalQuestions) * 100)
            : 0,
      },
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 12. Lấy câu hỏi cần ôn tập
exports.getReviewQuestions = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const questions = await UserProgress.getReviewQuestions(
      req.user.id,
      parseInt(limit)
    );

    res.json({
      success: true,
      count: questions.length,
      data: questions,
    });
  } catch (error) {
    console.error('Get review questions error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 13. Đánh dấu câu hỏi yêu thích
exports.toggleFavorite = async (req, res) => {
  try {
    const { questionId } = req.params;

    const progress = await UserProgress.findOne({
      user: req.user.id,
      question: questionId,
    });

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Progress not found for this question',
      });
    }

    progress.isFavorite = !progress.isFavorite;
    await progress.save();

    res.json({
      success: true,
      isFavorite: progress.isFavorite,
      message: progress.isFavorite
        ? '⭐ Added to favorites'
        : 'Removed from favorites',
    });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 14. Lấy câu hỏi yêu thích
exports.getFavoriteQuestions = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const questions = await UserProgress.getFavoriteQuestions(
      req.user.id,
      parseInt(limit)
    );

    res.json({
      success: true,
      count: questions.length,
      data: questions,
    });
  } catch (error) {
    console.error('Get favorite questions error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 15. Submit cả bài thi
exports.submitExam = async (req, res) => {
  try {
    const { answers } = req.body;

    if (!answers || Object.keys(answers).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No answers provided',
      });
    }

    const results = [];
    let correctCount = 0;

    for (const [questionId, userAnswer] of Object.entries(answers)) {
      const question = await Question.findById(questionId);

      if (!question) {
        results.push({
          questionId,
          error: 'Question not found',
        });
        continue;
      }

      const result = question.checkAnswer(userAnswer);
      await question.save();

      if (result.isCorrect) correctCount++;

      results.push({
        questionId,
        question: question.question,
        userAnswer,
        ...result,
      });
    }

    const totalQuestions = Object.keys(answers).length;
    const score = Math.round((correctCount / totalQuestions) * 100);

    res.json({
      success: true,
      score,
      correctCount,
      totalQuestions,
      results,
      message:
        score >= 70 ? '🎉 Congratulations! You passed!' : '📚 Keep learning!',
    });
  } catch (error) {
    console.error('Submit exam error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
