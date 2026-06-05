const Activity = require('../models/Activity');

const getCalendarActivity = async (req, res) => {
  try {
    const activities = await Activity.find({
      userId: req.user.id,
    }).sort({ date: -1 });

    res.json({
      success: true,
      activities: activities
        .filter(a => a.date) // 🔥 loại bỏ record lỗi
        .map(a => ({
          _id: a._id,
          type: a.type,

          date: a.date.toISOString(),

          dateVN: new Date(
            a.date.toLocaleString('en-US', {
              timeZone: 'Asia/Ho_Chi_Minh'
            })
          ).toISOString().split('T')[0]
        }))
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getCalendarActivity };