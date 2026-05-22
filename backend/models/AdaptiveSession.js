const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['assistant', 'user'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['question', 'answer', 'system'],
    default: 'question'
  },
  subtopic: String,
  score: {
    type: Number,
    min: 0,
    max: 10,
    default: null
  },
  strengths: [String],
  weaknesses: [String],
  missingConcepts: [String],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const adaptiveSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'abandoned'],
    default: 'active'
  },
  conversation: [messageSchema],
  finalScore: {
    type: Number,
    min: 0,
    max: 10,
    default: null
  },
  // Cho phép lưu báo cáo chi tiết (dạng object linh hoạt)
  summary: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Dự phòng nếu cần thêm trường riêng
  detailedReport: {
    type: mongoose.Schema.Types.Mixed
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: Date,
  maxFollowUps: {
    type: Number,
    default: 8
  },
  // ----- Các trường hỗ trợ điều khiển độ sâu -----
  coveredTopics: [String],          // Các subtopic đã được hỏi
  currentSubtopic: String,          // Subtopic đang được hỏi
  subtopicDepth: {
    type: Number,
    default: 0
  },
  lastAnswerSharp: {
    type: Boolean,
    default: false
  },
  lastAnswerSubtopic: String,
  // ----- Trạng thái nội bộ cho sinh câu hỏi -----
  askedQuestions: [String],
  questionTypeHistory: [String],
  roadmapStructured: mongoose.Schema.Types.Mixed,
  roadmapFlattened: [String]
});

module.exports = mongoose.model('AdaptiveSession', adaptiveSessionSchema);