const User = require("../../models/User");
const {
  createTransporter,
  verifyConnection,
} = require("../../config/emailConfig");

const { getInterviewTemplate } = require("./templates/interviewTemplate");
const { getCvInterviewTemplate } = require("./templates/cvInterviewTemplate");
// const { getAdaptInterviewTemplate } = require('./templates/adaptInterviewTemplate');
// const { getCodingInterviewTemplate } = require('./templates/codingInterviewTemplate');

let transporter = null;
let initPromise = null; // 🔒 Lock tránh race condition

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const maskEmail = (email) => email.replace(/(?<=.).(?=[^@]*@)/g, "*");

// ─────────────────────────────────────────────
// Init
// ─────────────────────────────────────────────

const initEmailService = async () => {
  try {
    transporter = createTransporter();
    if (transporter) {
      const isVerified = await verifyConnection(transporter);
      if (isVerified) {
        console.log("✅ Email service initialized successfully");
      } else {
        console.warn("⚠️ Email service initialized but connection failed");
      }
    } else {
      console.warn("⚠️ Email service not initialized (missing config)");
    }
    return transporter;
  } catch (error) {
    console.error("❌ Failed to initialize email service:", error.message);
    return null;
  }
};

/**
 * Lấy transporter an toàn — tránh race condition khi nhiều request cùng lúc
 */
const getTransporter = async () => {
  if (transporter) return transporter;
  if (!initPromise) {
    initPromise = initEmailService().finally(() => {
      initPromise = null;
    });
  }
  return await initPromise;
};

// ─────────────────────────────────────────────
// Template helpers
// ─────────────────────────────────────────────

const getTemplateByType = (type, userName, data) => {
  switch (type) {
    case "standard":
      return getInterviewTemplate(userName, data);
    case "cv":
      return getCvInterviewTemplate(userName, data);
    case "adapt":
      // TODO: uncomment import khi có template
      console.warn("⚠️ adapt template not implemented yet, using standard");
      return getInterviewTemplate(userName, data);
    case "coding":
      // TODO: uncomment import khi có template
      console.warn("⚠️ coding template not implemented yet, using standard");
      return getInterviewTemplate(userName, data);
    default:
      console.warn(`Unknown interview type: ${type}, using standard template`);
      return getInterviewTemplate(userName, data);
  }
};

const getSubjectByType = (type, data) => {
  switch (type) {
    case "standard":
      return `🎯 Kết quả phỏng vấn ${data.topic || ""} - ${data.totalScore || 0}/100 điểm`;
    case "cv":
      return `📄 Kết quả phỏng vấn CV - ${data.totalScore || 0}/100 điểm`;
    case "adapt":
      return `🔄 Kết quả phỏng vấn Thích ứng - ${data.totalScore || 0}/100 điểm`;
    case "coding":
      return `💻 Kết quả phỏng vấn Coding ${data.problemName ? `- ${data.problemName}` : ""} - ${data.totalScore || 0}/100 điểm`;
    default:
      return `Kết quả phỏng vấn - ${data.totalScore || 0}/100 điểm`;
  }
};

// ─────────────────────────────────────────────
// Send functions
// ─────────────────────────────────────────────

const sendInterviewResultEmail = async (
  userId,
  interviewType,
  interviewData,
) => {
  try {
    if (!userId) {
      console.error("❌ Missing userId");
      return false;
    }
    if (!interviewType) {
      console.error("❌ Missing interviewType");
      return false;
    }
    if (!interviewData) {
      console.error("❌ Missing interviewData");
      return false;
    }

    const user = await User.findById(userId).select(
      "userName email emailPreferences",
    );
    if (!user) {
      console.error(`❌ User not found: ${userId}`);
      return false;
    }

    if (user.emailPreferences?.interviewResults === false) {
      console.log(
        `⏭️ User ${maskEmail(user.email)} đã tắt nhận email kết quả phỏng vấn`,
      );
      return true;
    }

    // Fix Bug 2: dùng getTransporter thay vì check thủ công
    const t = await getTransporter();
    if (!t) {
      console.error("❌ Cannot initialize email transporter");
      return false;
    }

    const htmlContent = getTemplateByType(
      interviewType,
      user.userName,
      interviewData,
    );
    const subject = getSubjectByType(interviewType, interviewData);

    const mailOptions = {
      from: `"Interview System" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject,
      html: htmlContent,
      text: `
${subject}

Xin chào ${user.userName}!

Tổng điểm của bạn: ${interviewData.totalScore || 0}/100

Đăng nhập để xem chi tiết: ${process.env.FRONTEND_URL || "http://localhost:3000"}/interview-history

---
Email tự động từ hệ thống phỏng vấn. Vui lòng không trả lời email này.
      `,
    };

    const info = await t.sendMail(mailOptions);
    console.log(
      `✅ Email sent to ${maskEmail(user.email)} - Type: ${interviewType} - MessageID: ${info.messageId}`,
    );
    return true;
  } catch (error) {
    console.error(
      `❌ Error sending ${interviewType} interview email:`,
      error.message,
    );
    return false;
  }
};

const sendOtpEmail = async (email, userName, otp, type = "verification") => {
  try {
    // Fix Bug 3: validate email trước khi gửi
    if (!email || !isValidEmail(email)) {
      console.error(`❌ Invalid email: ${email}`);
      return false;
    }

    if (!otp) {
      console.error("❌ Missing OTP");
      return false;
    }

    // Fix Bug 2: dùng getTransporter
    const t = await getTransporter();
    if (!t) return false;

    const subject =
      type === "verification"
        ? "🔐 Xác thực email của bạn"
        : "🔑 Đặt lại mật khẩu";

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 500px; margin: 0 auto; padding: 20px; text-align: center; }
          .otp-code { font-size: 36px; font-weight: bold; color: #667eea; padding: 20px; letter-spacing: 5px; }
          .warning { font-size: 12px; color: #999; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>${subject}</h2>
          <p>Xin chào <strong>${userName}</strong>,</p>
          <p>Vui lòng sử dụng mã OTP sau để ${type === "verification" ? "xác thực email" : "đặt lại mật khẩu"} của bạn:</p>
          <div class="otp-code">${otp}</div>
          <p>Mã này có hiệu lực trong <strong>10 phút</strong>.</p>
          <p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
          <div class="warning">⚠️ Tuyệt đối không chia sẻ mã OTP cho bất kỳ ai.</div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"Interview System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html: htmlContent,
    };

    await t.sendMail(mailOptions);
    // Fix Bug 4: mask email trong log, KHÔNG log OTP
    console.log(`✅ OTP email sent to ${maskEmail(email)} - Type: ${type}`);
    return true;
  } catch (error) {
    console.error(
      `❌ Error sending OTP email to ${maskEmail(email)}:`,
      error.message,
    );
    return false;
  }
};

module.exports = {
  initEmailService,
  sendInterviewResultEmail,
  sendOtpEmail,
};
