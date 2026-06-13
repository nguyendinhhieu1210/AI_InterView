const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    userName: { type: String, required: true, unique: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    avatar: { type: String, default: "" },
    isVerified: { type: Boolean, default: false },

    // OTP xác thực email
    emailVerificationOTP:     { type: String,  default: null },
    emailVerificationExpires: { type: Date,    default: null },

    emailPreferences: {
      interviewResults: { type: Boolean, default: true },
    },

    // OTP reset password
    resetPasswordOTP:     { type: String, default: null },
    resetPasswordExpires: { type: Date,   default: null },

    // ── Refresh token (thêm mới) ──
    refreshToken:           { type: String,  default: null },
    refreshTokenExpires:    { type: Date,    default: null },
  },
  { timestamps: true },
);

// Hash password trước khi save
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// ── Method kiểm tra refresh token còn hạn không ──
userSchema.methods.isRefreshTokenValid = function (token) {
  return (
    this.refreshToken === token &&
    this.refreshTokenExpires &&
    this.refreshTokenExpires > Date.now()
  );
};

// ── Method xóa refresh token (dùng khi logout) ──
userSchema.methods.clearRefreshToken = async function () {
  this.refreshToken = null;
  this.refreshTokenExpires = null;
  await this.save();
};

module.exports = mongoose.model("User", userSchema);