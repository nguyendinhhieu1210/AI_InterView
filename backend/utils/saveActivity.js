const Activity = require('../models/Activity');

const saveActivity = async (userId, type = 'interview') => {
  try {
    const now = new Date();

    // 👉 convert sang giờ VN chuẩn
    const vnNow = new Date(
      now.toLocaleString('en-US', {
        timeZone: 'Asia/Ho_Chi_Minh'
      })
    );

    // 👉 normalize về 00:00 VN nhưng lưu UTC
    const dateOnly = new Date(Date.UTC(
      vnNow.getFullYear(),
      vnNow.getMonth(),
      vnNow.getDate()
    ));

    await Activity.findOneAndUpdate(
      {
        userId,
        date: dateOnly
      },
      {
        $setOnInsert: {
          userId,
          date: dateOnly,
          type
        }
      },
      {
        upsert: true
      }
    );

  } catch (err) {
    console.error('Save activity error:', err);
  }
};

module.exports = saveActivity;