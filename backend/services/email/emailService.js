const User = require("../../models/User");
const {
  createTransporter,
  verifyConnection,
} = require("../../config/emailConfig");

// Import tất cả templates
const { getInterviewTemplate } = require("./templates/interviewTemplate");
const { getCvInterviewTemplate } = require("./templates/cvInterviewTemplate");
// const { getAdaptInterviewTemplate } = require('./templates/adaptInterviewTemplate');
// const { getCodingInterviewTemplate } = require('./templates/codingInterviewTemplate');

let transporter = null;

/**
 * Khởi tạo email service
 * Gọi function này khi server start
 */
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
 * Chọn template HTML dựa trên loại phỏng vấn
 */
const getTemplateByType = (type, userName, data) => {
  switch (type) {
    case "standard":
      return getInterviewTemplate(userName, data);
    case "cv":
      return getCvInterviewTemplate(userName, data);
    case "adapt":
      return getAdaptInterviewTemplate(userName, data);
    case "coding":
      return getCodingInterviewTemplate(userName, data);
    default:
      console.warn(`Unknown interview type: ${type}, using standard template`);
      return getInterviewTemplate(userName, data);
  }
};

/**
 * Chọn subject email dựa trên loại phỏng vấn
 */
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

/**
 * Gửi email kết quả phỏng vấn (hỗ trợ tất cả các loại)
 *
 * @param {string} userId - ID của người dùng
 * @param {string} interviewType - Loại phỏng vấn: 'standard', 'cv', 'adapt', 'coding'
 * @param {object} interviewData - Dữ liệu kết quả phỏng vấn
 * @returns {Promise<boolean>} - true nếu gửi thành công, false nếu thất bại
 */
const sendInterviewResultEmail = async (
  userId,
  interviewType,
  interviewData,
) => {
  try {
    // 1. Kiểm tra tham số đầu vào
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

    // 2. Lấy thông tin user từ database
    const user = await User.findById(userId).select(
      "userName email emailPreferences",
    );

    if (!user) {
      console.error(`❌ User not found: ${userId}`);
      return false;
    }

    // 3. Kiểm tra cài đặt nhận email của user
    if (
      user.emailPreferences &&
      user.emailPreferences.interviewResults === false
    ) {
      console.log(`⏭️ User ${user.email} đã tắt nhận email kết quả phỏng vấn`);
      return true; // Không gửi nhưng coi như thành công
    }

    // 4. Khởi tạo transporter nếu chưa có
    if (!transporter) {
      transporter = await initEmailService();
      if (!transporter) {
        console.error("❌ Cannot initialize email transporter");
        return false;
      }
    }

    // 5. Tạo nội dung email
    const htmlContent = getTemplateByType(
      interviewType,
      user.userName,
      interviewData,
    );
    const subject = getSubjectByType(interviewType, interviewData);

    // 6. Cấu hình email options
    const mailOptions = {
      from: `"Interview System" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: subject,
      html: htmlContent,
      // Text thuần (phòng trường hợp email client không hiển thị HTML)
      text: `
${subject}

Xin chào ${user.userName}!

Tổng điểm của bạn: ${interviewData.totalScore || 0}/100

Đăng nhập để xem chi tiết: ${process.env.FRONTEND_URL || "http://localhost:3000"}/interview-history

---
Email tự động từ hệ thống phỏng vấn. Vui lòng không trả lời email này.
      `,
    };

    // 7. Gửi email
    const info = await transporter.sendMail(mailOptions);
    console.log(
      `✅ Email sent to ${user.email} - Type: ${interviewType} - MessageID: ${info.messageId}`,
    );
    return true;
  } catch (error) {
    console.error(
      `❌ Error sending ${interviewType} interview email:`,
      error.message,
    );
    // Không throw lỗi để không làm gián đoạn luồng chính của ứng dụng
    return false;
  }
};

/**
 * Gửi email OTP xác thực (dùng cho đăng ký/ quên mật khẩu)
 *
 * @param {string} email - Email người nhận
 * @param {string} userName - Tên người dùng
 * @param {string} otp - Mã OTP
 * @param {string} type - Loại: 'verification' hoặc 'reset-password'
 */
const sendOtpEmail = async (email, userName, otp, type = "verification") => {
  try {
    if (!transporter) {
      transporter = await initEmailService();
      if (!transporter) return false;
    }

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
      subject: subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent to ${email} - Type: ${type}`);
    return true;
  } catch (error) {
    console.error(`❌ Error sending OTP email to ${email}:`, error.message);
    return false;
  }
};

module.exports = {
  initEmailService,
  sendInterviewResultEmail,
  sendOtpEmail,
};
