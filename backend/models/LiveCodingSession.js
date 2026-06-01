const mongoose = require('mongoose');

const LiveCodingSessionSchema = new mongoose.Schema({
  id: String,
  language: String,
  domain: String,
  topic: String,
  difficulty: String,

  currentQuestion: Object,

  history: Array,

  currentCodeSubmission: Object,

  codeHistory: Array,

  explainAnswers: Array,

  explainCount: {
    type: Number,
    default: 0
  },

  waitingForNextCode: {
    type: Boolean,
    default: false
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model(
  'LiveCodingSession',
  LiveCodingSessionSchema
);