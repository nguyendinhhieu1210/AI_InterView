const mongoose = require('mongoose');

const activitySchema =
  new mongoose.Schema({

    userId: {
      type: mongoose.Schema.Types.ObjectId,

      ref: 'User',

      required: true
    },

    type: {
      type: String,

      enum: [
        'upload_cv',
        'interview',
        'submit_answer',
        'cv_interview',
        'adaptive_interview' // thêm mới
      ],

      required: true
    }

  }, {
    timestamps: true
  });

module.exports =
  mongoose.model(
    'Activity',
    activitySchema
  );