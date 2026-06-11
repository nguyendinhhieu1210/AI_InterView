const nodemailer = require("nodemailer");

const createTransporter = () => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.error(
      "❌ Missing GMAIL_USER or GMAIL_APP_PASSWORD in environment variables",
    );
    return null;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  console.log("📧 Email transporter ready (Gmail SMTP)");
  return transporter;
};

const verifyConnection = async (transporter) => {
  if (!transporter) {
    console.warn("⚠️ No transporter to verify");
    return false;
  }
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
