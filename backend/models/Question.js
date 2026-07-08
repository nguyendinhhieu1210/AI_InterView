const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    // Câu hỏi
    question: {
      type: String,
      required: [true, 'Question is required'],
      trim: true,
      index: 'text',
    },

    // 4 đáp án A, B, C, D
    options: {
      A: { type: String, required: true, trim: true },
      B: { type: String, required: true, trim: true },
      C: { type: String, required: true, trim: true },
      D: { type: String, required: true, trim: true },
    },

    // Đáp án đúng (A, B, C, hoặc D)
    correctAnswer: {
      type: String,
      required: true,
      enum: ['A', 'B', 'C', 'D'],
      uppercase: true,
    },

    // Giải thích đáp án
    explanation: {
      type: String,
      required: [true, 'Explanation is required'],
      trim: true,
    },

    // ⭐ Đổi từ topic → programmingLanguage
    programmingLanguage: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },

    // Difficulty
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard', 'Expert'],
      default: 'Medium',
    },

    // Tags để lọc thêm
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    // Đánh dấu nổi bật
    isFeatured: {
      type: Boolean,
      default: false,
    },

    // Trạng thái (active/inactive)
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Người tạo
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Metadata thống kê
    stats: {
      totalAttempts: { type: Number, default: 0 },
      correctAttempts: { type: Number, default: 0 },
      wrongAttempts: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: Tỷ lệ đúng
questionSchema.virtual('accuracy').get(function () {
  if (this.stats.totalAttempts === 0) return 0;
  return Math.round(
    (this.stats.correctAttempts / this.stats.totalAttempts) * 100
  );
});

// ============ STATIC METHODS ============

// Lấy danh sách tất cả programming languages đang có
questionSchema.statics.getAllProgrammingLanguages = async function () {
  const result = await this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$programmingLanguage',
        count: { $sum: 1 },
        difficulties: { $addToSet: '$difficulty' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return result.map((item) => ({
    name: item._id,
    count: item.count,
    difficulties: item.difficulties,
  }));
};

// Lấy câu hỏi random theo programmingLanguage
questionSchema.statics.getRandomQuestions = async function ({
  programmingLanguage,
  limit = 10,
  excludeIds = [],
}) {
  const match = {
    isActive: true,
    ...(programmingLanguage && { programmingLanguage }),
    ...(excludeIds.length > 0 && { _id: { $nin: excludeIds } }),
  };

  const result = await this.aggregate([
    { $match: match },
    { $sample: { size: parseInt(limit) } },
    {
      $project: {
        __v: 0,
        'stats.totalAttempts': 0,
        'stats.correctAttempts': 0,
        'stats.wrongAttempts': 0,
      },
    },
  ]);

  return result;
};

// Lấy câu hỏi theo nhiều programming languages
questionSchema.statics.getQuestionsByLanguages = async function ({
  languages = [],
  limit = 10,
}) {
  const match = {
    isActive: true,
    ...(languages.length > 0 && { programmingLanguage: { $in: languages } }),
  };

  const result = await this.aggregate([
    { $match: match },
    { $sample: { size: parseInt(limit) } },
    {
      $project: {
        __v: 0,
        'stats.totalAttempts': 0,
        'stats.correctAttempts': 0,
        'stats.wrongAttempts': 0,
      },
    },
  ]);

  return result;
};

// Tìm kiếm câu hỏi theo từ khóa
questionSchema.statics.searchQuestions = async function ({
  keyword,
  programmingLanguage,
  limit = 20,
}) {
  const match = {
    isActive: true,
    ...(programmingLanguage && { programmingLanguage }),
  };

  if (keyword) {
    match.$text = { $search: keyword };
  }

  const result = await this.find(match)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 })
    .select('-__v -stats');

  return result;
};

// ============ INSTANCE METHODS ============

// Kiểm tra đáp án
questionSchema.methods.checkAnswer = function (answer) {
  const userAnswer = answer.toUpperCase().trim();
  const isCorrect = userAnswer === this.correctAnswer;

  this.stats.totalAttempts += 1;
  if (isCorrect) {
    this.stats.correctAttempts += 1;
  } else {
    this.stats.wrongAttempts += 1;
  }

  return {
    isCorrect,
    correctAnswer: this.correctAnswer,
    explanation: this.explanation,
  };
};

// Lấy câu hỏi tương tự
questionSchema.methods.getSimilarQuestions = async function (limit = 5) {
  return this.constructor
    .find({
      programmingLanguage: this.programmingLanguage,
      _id: { $ne: this._id },
      isActive: true,
    })
    .limit(limit)
    .sort({ 'stats.correctAttempts': -1 })
    .select('-__v -stats');
};

module.exports = mongoose.model('Question', questionSchema);
