const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-otp', authController.verifyOTP);         // dùng cho reset password
router.post('/reset-password', authController.resetPassword);

// Thêm 2 route mới cho xác thực email đăng ký
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verify-email', authController.resendVerifyEmail);

router.post('/logout', authController.logout);

module.exports = router;