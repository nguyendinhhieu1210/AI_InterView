const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register',            authController.register);
router.post('/login',               authController.login);
router.post('/forgot-password',     authController.forgotPassword);
router.post('/verify-otp',          authController.verifyOTP);
router.post('/reset-password',      authController.resetPassword);
router.post('/verify-email',        authController.verifyEmail);
router.post('/resend-verify-email', authController.resendVerifyEmail);
router.post('/logout',              authController.logout);

// ── Thêm route refresh token ──
router.post('/refresh',             authController.refreshToken);

module.exports = router;