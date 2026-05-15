// backend/routes/cv.js
const express = require('express');
const multer = require('multer');
const router = express.Router();
const cvController = require('../controllers/cvController');
const auth = require('../middleware/auth');

const upload = multer({ dest: 'uploads/' });

// Upload CV – không lưu DB, trả về { fullName, skills, rawText, fileName }
router.post('/upload', upload.single('cv'), cvController.uploadCV);

// Phân tích text CV (không lưu) – dùng cho preview
router.post('/analyze-text', cvController.analyzeCVText);

// Sinh câu hỏi từ text và selectedSkills (không cần lưu CV)
router.post('/generate-questions', cvController.generateQuestionsFromText);

// routes/cv.js
router.post('/submit-answers', auth, cvController.submitCVAnswers);  // thêm auth

router.get('/history', auth, cvController.getCVSessionHistory);

// routes/cv.js
router.get('/history/:id', auth, cvController.getCVSessionDetail);

module.exports = router;