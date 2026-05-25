const express = require('express');
const router = express.Router();
const adaptiveController = require('../controllers/adaptiveInterviewController');
const auth = require('../middleware/auth');

// Tất cả đều yêu cầu đăng nhập
router.use(auth);

router.post('/start', adaptiveController.startAdaptiveInterview);
router.post('/answer', adaptiveController.submitAnswer);
router.get('/session/:sessionId', adaptiveController.getSession);
router.get('/history', auth, adaptiveController.getHistory);

module.exports = router;