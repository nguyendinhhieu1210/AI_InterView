const nodemailer = require("nodemailer");

const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error(
      "❌ Missing EMAIL_USER or EMAIL_PASS in environment variables",
    );
    return null;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  console.log("📧 Email transporter ready (Gmail SMTP)");
  return transporter;
};

const verifyConnection = async (transporter) => {
  if (!transporter) return false;

  try {
    await transporter.verify();
    console.log("✅ Email service ready (Gmail SMTP)");
    return true;
  } catch (error) {
    console.error("❌ Cannot initialize email transporter:", error.message);
    return false;
  }
};

module.exports = { createTransporter, verifyConnection };
