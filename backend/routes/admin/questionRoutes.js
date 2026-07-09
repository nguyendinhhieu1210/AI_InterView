// backend/src/routes/admin/questionRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { body } = require('express-validator');
const questionController = require('../../controllers/admin/questionController');
const auth = require('../../middleware/auth');
const admin = require('../../middleware/admin');

// Cấu hình upload file
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'), false);
    }
  },
});

// ========================================
// ============ PUBLIC ROUTES ============
// ========================================

// ⭐ Lấy danh sách programming languages (public)
router.get(
  '/programming-languages',
  questionController.getProgrammingLanguages
);

// ========================================
// ============ ADMIN ROUTES ============
// ========================================

// Tất cả admin routes đều cần xác thực và quyền admin
router.use(auth);
router.use(admin);

// 1. Lấy danh sách câu hỏi (có filter)
router.get('/questions', questionController.getQuestions);

// 2. Tạo câu hỏi mới
router.post(
  '/questions',
  [
    body('question').notEmpty().withMessage('Question is required'),
    body('options.A').notEmpty().withMessage('Option A is required'),
    body('options.B').notEmpty().withMessage('Option B is required'),
    body('options.C').notEmpty().withMessage('Option C is required'),
    body('options.D').notEmpty().withMessage('Option D is required'),
    body('correctAnswer')
      .isIn(['A', 'B', 'C', 'D'])
      .withMessage('Correct answer must be A, B, C, or D'),
    body('explanation').notEmpty().withMessage('Explanation is required'),
    body('programmingLanguage')
      .notEmpty()
      .withMessage('Programming language is required'),
  ],
  questionController.createQuestion
);

// 3. Cập nhật câu hỏi
router.put(
  '/questions/:id',
  [
    body('correctAnswer')
      .optional()
      .isIn(['A', 'B', 'C', 'D'])
      .withMessage('Correct answer must be A, B, C, or D'),
  ],
  questionController.updateQuestion
);

// 4. Xóa câu hỏi (hard delete - chỉ khi inactive)
router.delete('/questions/:id', questionController.deleteQuestion);

// 5. Import Excel
router.post(
  '/questions/import',
  upload.single('file'),
  questionController.importQuestionsFromExcel
);

// 6. Export Excel
router.get('/questions/export', questionController.exportQuestionsToExcel);

// 7. Tạo bộ đề (từ câu hỏi)
router.post(
  '/exam-set/create',
  [
    body('programmingLanguage')
      .notEmpty()
      .withMessage('Programming language is required'),
    body('numberOfQuestions')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Number of questions must be between 1 and 100'),
  ],
  questionController.createExamSet
);

module.exports = router;
