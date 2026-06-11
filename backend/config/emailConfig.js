const nodemailer = require("nodemailer");

/**
 * Tạo transporter Gmail SMTP (ổn định cho Render)
 */
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("❌ Missing EMAIL_USER or EMAIL_PASS");
    return null;
  }

  const createTransporter = () => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("❌ Missing EMAIL_USER or EMAIL_PASS");
      return null;
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587, // đổi từ 465 → 587
      secure: false, // false = STARTTLS
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false, // tránh lỗi cert trên một số môi trường
      },
      connectionTimeout: 15000,
      socketTimeout: 20000,
    });

    return transporter;
  };

  return transporter;
};

/**
 * Verify SMTP connection (NON-BLOCKING)
 */
const verifyConnection = async (transporter) => {
  if (!transporter) return false;

  try {
    await transporter.verify();
    console.log("✅ Email SMTP ready");
    return true;
  } catch (error) {
    console.warn("⚠️ Email SMTP not reachable:", error.message);
    console.warn("👉 Server will still run (email disabled if needed)");
    return false;
  }
};
module.exports = {
  createTransporter,
  verifyConnection,
};
