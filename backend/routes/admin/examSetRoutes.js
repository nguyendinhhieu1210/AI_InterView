// backend/src/routes/admin/examSetRoutes.js
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
router.get('/exam-sets', examSetController.getExamSets);

// 2. Lấy chi tiết exam set
router.get('/exam-sets/:id', examSetController.getExamSetById);

// 3. Group exam sets by programming language
router.get(
  '/exam-sets/grouped-by-language',
  examSetController.getExamSetsGroupedByLanguage
);

// 4. Tạo exam set mới
router.post(
  '/exam-sets',
  [
    body('programmingLanguage')
      .notEmpty()
      .withMessage('Programming language is required'),
    body('numberOfQuestions')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Number of questions must be between 1 and 100'),
  ],
  examSetController.createExamSet
);

// 5. Cập nhật exam set
router.put('/exam-sets/:id', examSetController.updateExamSet);

// 6. Xóa exam set
router.delete('/exam-sets/:id', examSetController.deleteExamSet);

// 7. Thêm câu hỏi vào exam set
router.post(
  '/exam-sets/:id/questions',
  examSetController.addQuestionsToExamSet
);

// 8. Xóa câu hỏi khỏi exam set
router.delete(
  '/exam-sets/:id/questions/:questionId',
  examSetController.removeQuestionFromExamSet
);

module.exports = router;
