// backend/src/models/UserProgress.js
const mongoose = require('mongoose');

const userProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'correct', 'incorrect', 'skipped'],
      default: 'pending',
    },
    timeSpent: {
      type: Number, // seconds
      default: 0,
    },
    attempts: {
      type: Number,
      default: 1,
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    lastPracticed: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index để tránh duplicate
userProgressSchema.index({ user: 1, question: 1 }, { unique: true });

// ============ STATIC METHODS ============

// Lấy thống kê của user
userProgressSchema.statics.getUserStats = async function (userId) {
  const stats = await this.aggregate([
    { $match: { user: userId } },
    {
      $group: {
        _id: null,
        totalQuestions: { $sum: 1 },
        correct: {
          $sum: { $cond: [{ $eq: ['$status', 'correct'] }, 1, 0] },
        },
        incorrect: {
          $sum: { $cond: [{ $eq: ['$status', 'incorrect'] }, 1, 0] },
        },
        favoriteCount: {
          $sum: { $cond: ['$isFavorite', 1, 0] },
        },
        avgTime: { $avg: '$timeSpent' },
      },
    },
  ]);

  return (
    stats[0] || {
      totalQuestions: 0,
      correct: 0,
      incorrect: 0,
      favoriteCount: 0,
      avgTime: 0,
    }
  );
};

// Lấy câu hỏi cần ôn tập
userProgressSchema.statics.getReviewQuestions = async function (
  userId,
  limit = 10
) {
  const progress = await this.find({
    user: userId,
    status: { $in: ['incorrect', 'skipped'] },
  })
    .sort({ lastPracticed: 1 })
    .limit(limit)
    .populate('question');

  return progress.map((p) => p.question);
};

// Lấy câu hỏi yêu thích
userProgressSchema.statics.getFavoriteQuestions = async function (
  userId,
  limit = 10
) {
  const progress = await this.find({
    user: userId,
    isFavorite: true,
  })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .populate('question');

  return progress.map((p) => p.question);
};

// Lấy thống kê theo topic
userProgressSchema.statics.getTopicStats = async function (userId) {
  const stats = await this.aggregate([
    { $match: { user: userId } },
    {
      $lookup: {
        from: 'questions',
        localField: 'question',
        foreignField: '_id',
        as: 'questionData',
      },
    },
    { $unwind: '$questionData' },
    {
      $group: {
        _id: '$questionData.topic',
        total: { $sum: 1 },
        correct: {
          $sum: { $cond: [{ $eq: ['$status', 'correct'] }, 1, 0] },
        },
        incorrect: {
          $sum: { $cond: [{ $eq: ['$status', 'incorrect'] }, 1, 0] },
        },
      },
    },
    {
      $project: {
        topic: '$_id',
        total: 1,
        correct: 1,
        incorrect: 1,
        accuracy: {
          $cond: [
            { $eq: ['$total', 0] },
            0,
            { $multiply: [{ $divide: ['$correct', '$total'] }, 100] },
          ],
        },
      },
    },
    { $sort: { total: -1 } },
  ]);

  return stats;
};

// ============ INSTANCE METHODS ============

// Cập nhật progress
userProgressSchema.methods.updateProgress = async function ({
  status,
  timeSpent = 0,
}) {
  this.status = status;
  this.timeSpent = timeSpent;
  this.attempts += 1;
  this.lastPracticed = new Date();
  await this.save();
  return this;
};

module.exports = mongoose.model('UserProgress', userProgressSchema);
