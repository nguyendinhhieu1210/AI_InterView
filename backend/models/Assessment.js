
const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: String,

  type: {
    type: String,
    enum: ['mcq', 'text'],
    default: 'text',
  },

  topic: String,

  question: String,

  correctAnswer: mongoose.Schema.Types.Mixed,

  userAnswer: mongoose.Schema.Types.Mixed,

  isCorrect: Boolean,

  score: {
    type: Number,
    default: 0,
  },

  aiFeedback: {
    type: String,
    default: '',
  },

  weaknessTags: {
    type: [String],
    default: [],
  },

  difficulty: String,

}, { _id: false });

const assessmentSchema = new mongoose.Schema({

  userId: {
    type: String,
    required: true,
    index: true,
  },

  cvId: String,

  cvName: String,

  topic: {
    type: [String],
    default: [],
  },

  difficulty: {
    type: String,
    default: 'medium',
  },

  answers: {
    type: [answerSchema],
    default: [],
  },

  totalScore: {
    type: Number,
    default: 0,
  },

  averageScore: {
    type: Number,
    default: 0,
  },

  summary: {
    strengths: [String],
    weaknesses: [String],
    recommendation: String,
  },

  completedAt: Date,

}, {
  timestamps: true,
});

module.exports =
  mongoose.model(
    'Assessment',
    assessmentSchema
  );
