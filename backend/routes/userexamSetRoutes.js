// backend/src/routes/userexamSetRoutes.js
const express = require('express');
const router = express.Router();
const userexamSetController = require('../controllers/userexamSetController');
const auth = require('../middleware/auth');

// ✅ Chỉ dùng auth, KHÔNG dùng admin
router.use(auth);

// 1. Lấy danh sách exam sets cho user
router.get('/exam-sets', userexamSetController.getUserExamSets);

// 2. Lấy danh sách languages có exam set
router.get('/exam-sets/languages', userexamSetController.getExamSetLanguages);

// 3. Lấy chi tiết exam set cho user
router.get('/exam-sets/:id', userexamSetController.getUserExamSetDetail);

// 4. Submit bài thi
router.post('/exam-sets/:id/submit', userexamSetController.submitExamSet);

module.exports = router;
