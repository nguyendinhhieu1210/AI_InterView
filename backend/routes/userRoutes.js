// routes/userRoutes.js
// Các route liên quan đến quản lý thông tin người dùng (yêu cầu đã đăng nhập)

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const userController = require('../controllers/userController');

// Tất cả route trong file này đều yêu cầu token hợp lệ
router.use(auth);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.put('/change-password', userController.changePassword);



// ===== Admin routes =====
router.get('/admin/users', auth, admin, userController.getAllUsers);
router.get('/admin/users/stats', auth, admin, userController.getUserStats);
router.get('/admin/users/:id', auth, admin, userController.getUserById);
router.put('/admin/users/:id', auth, admin, userController.updateUserByAdmin);
router.put('/admin/users/:id/reset-password', auth, admin, userController.resetPasswordByAdmin);
router.delete('/admin/users/:id', auth, admin, userController.deleteUser);

module.exports = router;