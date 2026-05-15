// routes/weaknessRoutes.js
const express = require('express');
const { getUserWeakness } = require('../controllers/weaknessController');
const auth = require('../middleware/auth');

const router = express.Router();

// Lấy phân tích điểm yếu của user hiện tại (từ token)
router.get('/me', auth, getUserWeakness);

module.exports = router;