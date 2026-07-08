const mongoose = require('mongoose');

const examSetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Exam set name is required'],
      trim: true,
      index: true,
    },
    // ⭐ Đổi từ topic → programmingLanguage
    programmingLanguage: {
      type: String,
      required: [true, 'Programming language is required'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
    difficultyStats: {
      Easy: { type: Number, default: 0 },
      Medium: { type: Number, default: 0 },
      Hard: { type: Number, default: 0 },
      Expert: { type: Number, default: 0 },
    },
    totalQuestions: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    metadata: {
      views: { type: Number, default: 0 },
      timesPracticed: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Virtual: accuracy
examSetSchema.virtual('accuracy').get(function () {
  if (this.metadata.timesPracticed === 0) return 0;
  return Math.round(
    (this.metadata.averageScore / this.metadata.timesPracticed) * 100
  );
});

// ⭐ Static method: get exam sets by programming language
examSetSchema.statics.getByProgrammingLanguage = async function (
  programmingLanguage
) {
  return this.find({ programmingLanguage, isActive: true })
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });
};

// ⭐ Static method: get exam sets with question count và group by language
examSetSchema.statics.getWithStats = async function () {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $lookup: {
        from: 'questions',
        localField: 'questions',
        foreignField: '_id',
        as: 'questionDetails',
      },
    },
    {
      $project: {
        name: 1,
        programmingLanguage: 1, // Đổi từ topic
        description: 1,
        totalQuestions: { $size: '$questionDetails' },
        difficultyStats: 1,
        metadata: 1,
        createdAt: 1,
        updatedAt: 1,
        createdBy: 1,
      },
    },
    { $sort: { createdAt: -1 } },
  ]);
};

// ⭐ NEW: Group exam sets by programming language
examSetSchema.statics.groupByProgrammingLanguage = async function () {
  return this.aggregate([
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
};

module.exports = mongoose.model('ExamSet', examSetSchema);
