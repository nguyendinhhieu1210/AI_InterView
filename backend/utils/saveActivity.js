const Activity = require('../models/Activity');

const saveActivity = async (userId, type) => {
  try {
    await Activity.create({
      userId,
      type
    });
  } catch (err) {
    console.error('Save activity error:', err.message);
  }
};

module.exports = saveActivity;