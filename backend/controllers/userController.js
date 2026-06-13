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



// ================= ADMIN FUNCTIONS =================

// @desc    Get all users (admin) - paginated, search, filter by role
// @route   GET /api/users/admin/users
exports.getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', role } = req.query;
        const query = {};

        if (search) {
            query.$or = [
                { userName: { $regex: search, $options: 'i' } },
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }
        if (role) query.role = role;

        const users = await User.find(query)
            .select('-password -avatar -resetPasswordOTP -resetPasswordExpires -emailVerificationOTP -emailVerificationExpires')
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .sort({ createdAt: -1 });

        const total = await User.countDocuments(query);

        res.json({
            users,
            total,
            page: Number(page),
            pages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get user detail by id (admin)
// @route   GET /api/users/admin/users/:id
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password -resetPasswordOTP -resetPasswordExpires -emailVerificationOTP -emailVerificationExpires');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update user by admin (fullName, userName, email, role, isVerified)
// @route   PUT /api/users/admin/users/:id
exports.updateUserByAdmin = async (req, res) => {
    try {
        const { fullName, userName, email, role, isVerified } = req.body;

        if (role && !['user', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const updateData = {};
        if (fullName !== undefined) updateData.fullName = fullName;
        if (userName !== undefined) updateData.userName = userName;
        if (email !== undefined) updateData.email = email;
        if (role !== undefined) updateData.role = role;
        if (isVerified !== undefined) updateData.isVerified = isVerified;

        const user = await User.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true,
        }).select('-password -resetPasswordOTP -resetPasswordExpires');

        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ user, message: 'Update successful' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Admin reset password for a user (no old password required)
// @route   PUT /api/users/admin/users/:id/reset-password
exports.resetPasswordByAdmin = async (req, res) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.password = newPassword; // will be auto-hashed via pre-save hook
        await user.save();

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete user (admin)
// @route   DELETE /api/users/admin/users/:id
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get user statistics (admin)
// @route   GET /api/users/admin/users/stats
exports.getUserStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalAdmins = await User.countDocuments({ role: 'admin' });
        const verifiedUsers = await User.countDocuments({ isVerified: true });
        const unverifiedUsers = totalUsers - verifiedUsers;

        res.json({ totalUsers, totalAdmins, verifiedUsers, unverifiedUsers });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};