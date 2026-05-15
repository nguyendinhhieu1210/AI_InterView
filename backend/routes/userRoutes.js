// routes/userRoutes.js
// Các route liên quan đến quản lý thông tin người dùng (yêu cầu đã đăng nhập)

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const userController = require('../controllers/userController');

// Tất cả route trong file này đều yêu cầu token hợp lệ
router.use(authMiddleware);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.put('/change-password', userController.changePassword);

module.exports = router;