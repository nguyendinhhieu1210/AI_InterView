// controllers/authController.js
// Full version supporting registration + email OTP, email verification, login, forgot password, reset password

const User = require('../models/User');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Email configuration (using Gmail)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Generate JWT token (only after email verification)
const generateToken = (userId, role) => {
    return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN, // default "30m"
    });
};

// ----------------------------------------------------------------------
// 1. REGISTER – Create user, generate OTP, send verification email
// ----------------------------------------------------------------------
exports.register = async (req, res) => {
    try {
        const { userName, fullName, email, password, confirmPassword } = req.body;

        // Validation
        if (!userName || !fullName || !email || !password || !confirmPassword) {
            return res.status(400).json({ message: 'Please fill in all information' });
        }
        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Confirm password does not match' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Check for existing userName or email
        const existingUser = await User.findOne({ $or: [{ userName }, { email }] });
        if (existingUser) {
            if (existingUser.userName === userName) {
                return res.status(400).json({
                    message: 'Username already exists',
                    usernameTaken: true,
                    suggestions: [`${userName}_${Math.floor(Math.random() * 1000)}`, `${userName}123`]
                });
            }
            if (existingUser.email === email) {
                return res.status(400).json({ message: 'Email has already been registered' });
            }
        }

        // Create new user (not verified yet)
        const user = new User({ userName, fullName, email, password, isVerified: false });
        await user.save();

        // Generate 6-digit OTP, save to user
        const otp = crypto.randomInt(100000, 999999).toString();
        user.emailVerificationOTP = otp;
        user.emailVerificationExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        // Send OTP email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Verify your email - AI Interview System',
            html: `<div style="font-family: Arial; padding:20px;">
                <h2>Welcome ${fullName}!</h2>
                <p>Your email verification OTP is:</p>
                <strong style="font-size:28px;">${otp}</strong>
                <p>This OTP is valid for 10 minutes.</p>
            </div>`,
        };
        await transporter.sendMail(mailOptions);

        // Return success, include email for frontend
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
// 2. VERIFY EMAIL OTP – Activate account and issue token
// ----------------------------------------------------------------------
exports.verifyEmail = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'Email does not exist' });

        if (user.isVerified) {
            return res.status(400).json({ message: 'Account has already been activated' });
        }

        if (user.emailVerificationOTP !== otp || user.emailVerificationExpires < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Activate account and clear OTP
        user.isVerified = true;
        user.emailVerificationOTP = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        const token = generateToken(user._id, user.role);

        res.json({
            success: true,
            message: 'Email verified successfully',
            token,
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

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Resend email verification OTP - AI Interview',
            html: `<div><h2>Your new OTP: <strong>${otp}</strong></h2><p>Valid for 10 minutes</p></div>`,
        };
        await transporter.sendMail(mailOptions);

        res.json({ message: 'OTP resent successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Email sending error' });
    }
};

// ----------------------------------------------------------------------
// 4. LOGIN – Only allow accounts that have verified email
// ----------------------------------------------------------------------
exports.login = async (req, res) => {
    try {
        const { email, password, rememberMe } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ message: 'Incorrect email or password' });

        // Check if email has been verified
        if (!user.isVerified) {
            return res.status(401).json({
                message: 'Account not verified. Please check your email to activate your account.',
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(401).json({ message: 'Incorrect email or password' });

        let expiresIn = process.env.JWT_EXPIRES_IN; // default 30 minutes
        if (rememberMe) expiresIn = '30d';

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn });

        res.json({
            success: true,
            token,
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
// 5. FORGOT PASSWORD – Send reset password OTP
// ----------------------------------------------------------------------
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'Email not found' });

        const otp = crypto.randomInt(100000, 999999).toString();
        user.resetPasswordOTP = otp;
        user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Reset password OTP - AI Interview',
            html: `<div style="font-family: Arial; padding:20px;">
                <h2>Reset password verification</h2>
                <p>Your OTP is: <strong style="font-size:24px;">${otp}</strong></p>
                <p>This OTP is valid for 10 minutes.</p>
            </div>`,
        };
        await transporter.sendMail(mailOptions);
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

        if (user.resetPasswordOTP !== otp || user.resetPasswordExpires < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        res.json({ verified: true, message: 'OTP is valid' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ----------------------------------------------------------------------
// 7. RESET PASSWORD WITH NEW PASSWORD (after reset OTP)
// ----------------------------------------------------------------------
exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword, confirmPassword } = req.body;
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'Confirm password does not match' });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'Email does not exist' });

        if (user.resetPasswordOTP !== otp || user.resetPasswordExpires < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Assign new password (will be auto-hashed thanks to pre-save in model)
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
exports.logout = (req, res) => {
    res.json({ message: 'Logged out successfully' });
};