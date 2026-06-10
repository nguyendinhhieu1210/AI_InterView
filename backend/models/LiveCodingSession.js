const mongoose = require('mongoose');

const LiveCodingSessionSchema = new mongoose.Schema({

  // Session metadata

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  language: {
    type: String,
    required: true,
  },
  domain: {
    type: String,
    required: true,
  },
  topic: {
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['beginner', 'intermediate', 'advanced'],
  },

  // Code submissions history
  codeHistory: [{
    code: {
      type: String,
      required: true,
    },
    problemStatement: {
      type: String,
      required: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },

    // Explanation answers for this code submission
    explainAnswers: [{
      question: String,
      answer: String,
      isCorrect: Boolean,
      feedback: String,
      modelAnswer: String,
    }],

    // Final evaluation for this code submission
    evaluation: {
      summary: String,
      feedback: String,
      strengths: [String],
      weaknesses: [String],
    },
  }],

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

LiveCodingSessionSchema.pre('save', function () {
  this.updatedAt = new Date();
});

module.exports = mongoose.model('LiveCodingSession', LiveCodingSessionSchema);