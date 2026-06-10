const nodemailer = require("nodemailer");

/**
 * Tạo transporter để gửi email
 */
const createTransporter = () => {
  // Kiểm tra biến môi trường
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("❌ Thiếu EMAIL_USER hoặc EMAIL_PASS trong file .env");
    console.error("   Vui lòng thêm vào .env:");
    console.error("   EMAIL_USER=your-email@gmail.com");
    console.error("   EMAIL_PASS=your-app-password");
    return null;
  }

  // Cấu hình cho Gmail
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // Tùy chọn thêm để tránh lỗi
    tls: {
      rejectUnauthorized: false,
    },
    // Thời gian timeout
    timeout: 30000,
  });

  return transporter;
};

/**
 * Kiểm tra kết nối email
 */
const verifyConnection = async (transporter) => {
  try {
    await transporter.verify();
    console.log("✅ Email service ready - Đã sẵn sàng gửi mail");
    return true;
  } catch (error) {
    console.error("❌ Email service error:", error.message);
    if (error.message.includes("Invalid login")) {
      console.error("   → Sai EMAIL_USER hoặc EMAIL_PASS");
      console.error(
        '   → Với Gmail, phải dùng "Mật khẩu ứng dụng" (App Password), không phải mật khẩu đăng nhập',
      );
    }
    return false;
  }
};

module.exports = { createTransporter, verifyConnection };
