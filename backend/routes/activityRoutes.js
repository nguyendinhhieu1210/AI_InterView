const express = require('express');

const router = express.Router();

const auth = require('../middleware/auth');

const {
  getCalendarActivity
} = require('../controllers/activityController');

router.get(
  '/calendar',
  auth,
  getCalendarActivity
);

module.exports = router;