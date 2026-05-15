// backend/models/InterviewResult.js
const mongoose = require('mongoose');

const mcqResultSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [String],
  userAnswer: String,
  correctAnswer: String,
  isCorrect: Boolean,
  score: Number,        // 0 hoặc 10
  explanation: String   // giải thích đáp án đúng (do AI sinh)
});

const textResultSchema = new mongoose.Schema({
  question: String,
  idealAnswerKeywords: [String],
  sampleAnswer: String,
  userAnswer: String,
  score: Number,        // 0-10
  explanation: String,  // giải thích lý do chấm điểm
  feedback: String      // lời khuyên cải thiện
});

const interviewResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topic: String,
  difficulty: String,
  mcqResults: [mcqResultSchema],
  textResults: [textResultSchema],
  totalScore: { type: Number, required: true }, // tổng điểm tối đa 100
  completedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('InterviewResult', interviewResultSchema);