const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
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

    missingConcepts: [String]
  },
  {
    timestamps: true
  }
);

const adaptiveSessionSchema = new mongoose.Schema(
  {
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

    summary: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },

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

    coveredTopics: [String],

    currentSubtopic: String,

    subtopicDepth: {
      type: Number,
      default: 0
    },

    lastAnswerSharp: {
      type: Boolean,
      default: false
    },

    lastAnswerSubtopic: String,

    askedQuestions: [String],

    questionTypeHistory: [String],

    roadmapStructured: mongoose.Schema.Types.Mixed,

    roadmapFlattened: [String]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  'AdaptiveSession',
  adaptiveSessionSchema
);