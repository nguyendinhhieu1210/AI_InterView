const Activity = require('../models/Activity');

exports.getCalendarActivity =
  async (req, res) => {

    try {

      const activities =
        await Activity.find({
          userId: req.user.id
        }).select('createdAt type');

      res.json({
        success: true,
        activities
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message: 'Server error'
      });

    }
};