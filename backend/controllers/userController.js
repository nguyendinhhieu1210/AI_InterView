// controllers/userController.js
// Features: view profile, update profile, change password (requires old password confirmation)

const User = require('../models/User');

// @desc    Get profile information of the currently logged-in user
// @route   GET /api/users/profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password -resetPasswordOTP -resetPasswordExpires');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update profile information (fullName, avatar)
// @route   PUT /api/users/profile
exports.updateProfile = async (req, res) => {
    try {
        const { fullName, avatar } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { fullName, avatar },
            { new: true, runValidators: true }
        ).select('-password -resetPasswordOTP -resetPasswordExpires');

        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ user, message: 'Update successful' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Change password (requires old password)
// @route   PUT /api/users/change-password
exports.changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword, confirmPassword } = req.body;
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'New password does not match' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await user.comparePassword(oldPassword);
        if (!isMatch) {
            return res.status(401).json({ message: 'Old password is incorrect' });
        }

        user.password = newPassword; // will be auto-hashed
        await user.save();
        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};