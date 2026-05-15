// models/InterviewSession.js
const mongoose = require('mongoose');

const InterviewSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  cvId: { type: mongoose.Schema.Types.ObjectId, ref: 'CV', default: null },
  cvName: { type: String, default: '' },           // Tên trên CV (có thể khác tài khoản)
  topic: { type: [String], default: [] },          // Danh sách skill được chọn
  questions: { type: mongoose.Schema.Types.Mixed, required: true },
  answers: { type: mongoose.Schema.Types.Mixed, required: true },
  results: { type: mongoose.Schema.Types.Mixed, required: true },
  totalScore: { type: Number, required: true },
  summary: {
    overall: String,
    strengths: [String],
    weaknesses: [String],
    suggestions: [String]
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('InterviewSession', InterviewSessionSchema);