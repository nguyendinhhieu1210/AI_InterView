const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // 👉 vẫn giữ Date nhưng luôn là "00:00 UTC theo ngày VN"
  date: {
    type: Date,
    required: true,
    index: true,
  },

  type: {
    type: String,
    enum: ['interview', 'cvinterview', 'adaptiveinterview'],
    default: 'interview',
  }
}, {
  timestamps: true
});

// unique 1 user / 1 ngày
activitySchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Activity', activitySchema);