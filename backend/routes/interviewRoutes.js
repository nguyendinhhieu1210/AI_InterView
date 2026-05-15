const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { 
    generateQuestions, 
    submitAnswers, 
    getHistory,       // ← thêm dòng này
    deleteHistory,    // ← thêm dòng này
    getHistoryById    // ← thêm dòng này
    
} = require('../controllers/interviewController');

// Tất cả routes đều cần xác thực
router.use(auth);

router.post('/generate', generateQuestions);
router.post('/submit', submitAnswers);
router.get('/history', getHistory);           // ← thêm route GET
router.delete('/history/:id', deleteHistory); // ← thêm route DELETE
router.get('/history/:id', getHistoryById); // ← thêm route GET chi tiết

module.exports = router;