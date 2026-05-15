const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    userName: { type: String, required: true, unique: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    avatar: { type: String, default: '' },
    isVerified: { type: Boolean, default: false },
    
    // 🔥 Các trường OTP xác thực email
    emailVerificationOTP: { type: String },
    emailVerificationExpires: { type: Date },
    
    // 🔥 Các trường OTP reset password (nếu có)
    resetPasswordOTP: { type: String },
    resetPasswordExpires: { type: Date },
}, { timestamps: true });

// ✅ Sửa middleware pre('save') – KHÔNG dùng next
userSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);