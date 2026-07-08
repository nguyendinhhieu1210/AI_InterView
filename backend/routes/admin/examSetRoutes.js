const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const examSetController = require('../../controllers/admin/examSetController');
const auth = require('../../middleware/auth');
const admin = require('../../middleware/admin');

// Tất cả routes đều cần auth + admin
router.use(auth);
router.use(admin);

// 1. Lấy danh sách exam sets
router.get('/admin/exam-sets', examSetController.getExamSets);

// 2. Lấy chi tiết exam set
router.get('/admin/exam-sets/:id', examSetController.getExamSetById);

// ⭐ NEW: Group exam sets by programming language
router.get(
  '/admin/exam-sets/grouped-by-language',
  examSetController.getExamSetsGroupedByLanguage
);

// 3. Tạo exam set mới - Đổi từ topic → programmingLanguage
router.post(
  '/admin/exam-sets',
  [
    body('programmingLanguage')
      .notEmpty()
      .withMessage('Programming language is required'), // Đổi
    body('numberOfQuestions')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Number of questions must be between 1 and 100'),
  ],
  examSetController.createExamSet
);

// 4. Cập nhật exam set
router.put('/admin/exam-sets/:id', examSetController.updateExamSet);

// 5. Xóa exam set
router.delete('/admin/exam-sets/:id', examSetController.deleteExamSet);

// 6. Thêm câu hỏi vào exam set
router.post(
  '/admin/exam-sets/:id/questions',
  examSetController.addQuestionsToExamSet
);

// 7. Xóa câu hỏi khỏi exam set
router.delete(
  '/admin/exam-sets/:id/questions/:questionId',
  examSetController.removeQuestionFromExamSet
);

module.exports = router;
