const nodemailer = require("nodemailer");

/**
 * Tạo transporter Gmail SMTP
 */
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error(
      "❌ Missing EMAIL_USER or EMAIL_PASS in environment variables",
    );
    return null;
  }

  console.log("📧 Creating email transporter for:", process.env.EMAIL_USER);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // Tăng timeout cho môi trường production (Render)
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
  });

  return transporter;
};

/**
 * Verify SMTP connection (optional, có thể bỏ qua nếu bị timeout)
 */
const verifyConnection = async (transporter) => {
  if (!transporter) {
    console.warn("⚠️ No transporter to verify");
    return false;
  }

  try {
    // Chỉ verify nếu cần, có thể bỏ qua để tránh timeout
    if (process.env.NODE_ENV === "production") {
      console.log("⏭️ Skipping SMTP verification in production");
      return true;
    }

    await transporter.verify();
    console.log("✅ SMTP connection verified");
    return true;
  } catch (error) {
    console.warn(
      "⚠️ SMTP verification failed (continuing anyway):",
      error.message,
    );
    // Vẫn return true để không block, email sẽ tự retry khi gửi
    return true;
  }
};

module.exports = {
  createTransporter,
  verifyConnection,
};
