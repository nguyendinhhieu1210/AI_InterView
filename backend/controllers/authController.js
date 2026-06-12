// controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// ── Email transporter ──
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// ── Helper tạo cặp token ──
const generateTokenPair = (user, rememberMe = false) => {
    const accessExpiresIn = rememberMe ? '30d' : (process.env.JWT_EXPIRES_IN || '30m');

    const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: accessExpiresIn }
    );

    const refreshToken = jwt.sign(
        { id: user._id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' }
    );

    return { token, refreshToken };
};

// ----------------------------------------------------------------------
// 1. REGISTER
// ----------------------------------------------------------------------
exports.register = async (req, res) => {
    try {
        const { userName, fullName, email, password, confirmPassword } = req.body;

        if (!userName || !fullName || !email || !password || !confirmPassword)
            return res.status(400).json({ message: 'Please fill in all information' });
        if (password !== confirmPassword)
            return res.status(400).json({ message: 'Confirm password does not match' });
        if (password.length < 6)
            return res.status(400).json({ message: 'Password must be at least 6 characters' });

        const existingUser = await User.findOne({ $or: [{ userName }, { email }] });
        if (existingUser) {
            if (existingUser.userName === userName)
                return res.status(400).json({
                    message: 'Username already exists',
                    usernameTaken: true,
                    suggestions: [`${userName}_${Math.floor(Math.random() * 1000)}`, `${userName}123`]
                });
            if (existingUser.email === email)
                return res.status(400).json({ message: 'Email has already been registered' });
        }

        const user = new User({ userName, fullName, email, password, isVerified: false });
        await user.save();

        const otp = crypto.randomInt(100000, 999999).toString();
        user.emailVerificationOTP = otp;
        user.emailVerificationExpires = Date.now() + 10 * 60 * 1000;
        await user.save();

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Verify your email - AI Interview System',
            html: `<div style="font-family:Arial;padding:20px;">
                <h2>Welcome ${fullName}!</h2>
                <p>Your email verification OTP is:</p>
                <strong style="font-size:28px;">${otp}</strong>
                <p>This OTP is valid for 10 minutes.</p>
            </div>`,
        });

        const userResponse = user.toObject();
        delete userResponse.password;
        delete userResponse.emailVerificationOTP;
        delete userResponse.emailVerificationExpires;

        res.status(201).json({
            success: true,
            message: 'Registration successful! Please check your email to verify your account.',
            email: user.email,
            user: userResponse
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Server error, please try again later' });
    }
};

// ----------------------------------------------------------------------
// 2. VERIFY EMAIL OTP
// ----------------------------------------------------------------------
exports.verifyEmail = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'Email does not exist' });
        if (user.isVerified) return res.status(400).json({ message: 'Account has already been activated' });
        if (user.emailVerificationOTP !== otp || user.emailVerificationExpires < Date.now())
            return res.status(400).json({ message: 'Invalid or expired OTP' });

        user.isVerified = true;
        user.emailVerificationOTP = undefined;
        user.emailVerificationExpires = undefined;

        const { token, refreshToken } = generateTokenPair(user);
        user.refreshToken        = refreshToken;
        user.refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await user.save();

        res.json({
            success: true,
            message: 'Email verified successfully',
            token,
            refreshToken,
            user: {
                id: user._id,
                userName: user.userName,
                fullName: user.fullName,
                email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ----------------------------------------------------------------------
// 3. RESEND EMAIL VERIFICATION OTP
// ----------------------------------------------------------------------
exports.resendVerifyEmail = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'Email does not exist' });
        if (user.isVerified) return res.status(400).json({ message: 'Account is already activated' });

        const otp = crypto.randomInt(100000, 999999).toString();
        user.emailVerificationOTP = otp;
        user.emailVerificationExpires = Date.now() + 10 * 60 * 1000;
        await user.save();

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Resend email verification OTP - AI Interview',
            html: `<div><h2>Your new OTP: <strong>${otp}</strong></h2><p>Valid for 10 minutes</p></div>`,
        });

        res.json({ message: 'OTP resent successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Email sending error' });
    }
};

// ----------------------------------------------------------------------
// 4. LOGIN
// ----------------------------------------------------------------------
exports.login = async (req, res) => {
    try {
        const { email, password, rememberMe } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ message: 'Incorrect email or password' });

        if (!user.isVerified)
            return res.status(401).json({
                message: 'Account not verified. Please check your email to activate your account.',
            });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(401).json({ message: 'Incorrect email or password' });

        const { token, refreshToken } = generateTokenPair(user, rememberMe);
        user.refreshToken        = refreshToken;
        user.refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await user.save();

        res.json({
            success: true,
            token,
            refreshToken,
            user: {
                id: user._id,
                userName: user.userName,
                fullName: user.fullName,
                email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ----------------------------------------------------------------------
// 5. FORGOT PASSWORD
// ----------------------------------------------------------------------
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'Email not found' });

        const otp = crypto.randomInt(100000, 999999).toString();
        user.resetPasswordOTP = otp;
        user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
        await user.save();

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Reset password OTP - AI Interview',
            html: `<div style="font-family:Arial;padding:20px;">
                <h2>Reset password verification</h2>
                <p>Your OTP is: <strong style="font-size:24px;">${otp}</strong></p>
                <p>This OTP is valid for 10 minutes.</p>
            </div>`,
        });

        res.json({ message: 'OTP has been sent to your email', email });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Email sending error, please try again' });
    }
};

// ----------------------------------------------------------------------
// 6. VERIFY OTP FOR RESET PASSWORD
// ----------------------------------------------------------------------
exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'Email does not exist' });

        if (user.resetPasswordOTP !== otp || user.resetPasswordExpires < Date.now())
            return res.status(400).json({ message: 'Invalid or expired OTP' });

        res.json({ verified: true, message: 'OTP is valid' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ----------------------------------------------------------------------
// 7. RESET PASSWORD
// ----------------------------------------------------------------------
exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword, confirmPassword } = req.body;
        if (newPassword !== confirmPassword)
            return res.status(400).json({ message: 'Confirm password does not match' });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'Email does not exist' });

        if (user.resetPasswordOTP !== otp || user.resetPasswordExpires < Date.now())
            return res.status(400).json({ message: 'Invalid or expired OTP' });

        user.password = newPassword;
        user.resetPasswordOTP = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ message: 'Password has been reset successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ----------------------------------------------------------------------
// 8. LOGOUT
// ----------------------------------------------------------------------
exports.logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (refreshToken) {
            try {
                const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
                const user = await User.findById(decoded.id);
                if (user) await user.clearRefreshToken();
            } catch {
                // Token invalid/expired → vẫn logout thành công
            }
        }

        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.json({ success: true, message: 'Logged out successfully' });
    }
};

// ----------------------------------------------------------------------
// 9. REFRESH TOKEN
// ----------------------------------------------------------------------
exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken)
            return res.status(401).json({ message: 'No refresh token provided' });

        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        } catch {
            return res.status(401).json({ message: 'Invalid or expired refresh token' });
        }

        const user = await User.findById(decoded.id);
        if (!user) return res.status(401).json({ message: 'User not found' });

        if (!user.isRefreshTokenValid(refreshToken))
            return res.status(401).json({ message: 'Refresh token invalid or expired' });

        const { token: newToken, refreshToken: newRefreshToken } = generateTokenPair(user);
        user.refreshToken        = newRefreshToken;
        user.refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await user.save();

        res.json({
            success: true,
            token: newToken,
            refreshToken: newRefreshToken,
            user: {
                id: user._id,
                userName: user.userName,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
            }
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};