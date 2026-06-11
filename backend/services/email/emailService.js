const User = require("../../models/User");
const {
  createTransporter,
  verifyConnection,
} = require("../../config/emailConfig");

// Import tất cả templates
const { getInterviewTemplate } = require("./templates/interviewTemplate");
const { getCvInterviewTemplate } = require("./templates/cvInterviewTemplate");
// Import các template khác khi cần
// const { getAdaptInterviewTemplate } = require('./templates/adaptInterviewTemplate');
// const { getCodingInterviewTemplate } = require('./templates/codingInterviewTemplate');

let transporter = null;

/**
 * Khởi tạo email service
 */
const initEmailService = async () => {
  try {
    // createTransporter giờ là sync, không cần await
    const newTransporter = createTransporter();

    if (!newTransporter) {
      console.error("❌ Cannot initialize email transporter");
      return null;
    }

    transporter = newTransporter;

    // Skip verify trên production để tránh timeout
    if (process.env.NODE_ENV !== "production") {
      await verifyConnection(transporter);
    } else {
      console.log("✅ Email service initialized (production mode)");
    }

    return transporter;
  } catch (error) {
    console.error("❌ Failed to initialize email service:", error.message);
    return null;
  }
};
/**
 * Gửi email với retry mechanism
 */
const sendEmailWithRetry = async (mailOptions, maxRetries = 2) => {
  if (!transporter) {
    console.log("🔄 Initializing email service before sending...");
    transporter = await initEmailService();
    if (!transporter) {
      return {
        success: false,
        error: new Error("No email transporter available"),
      };
    }
  }

  for (let i = 0; i < maxRetries; i++) {
    try {
      const info = await transporter.sendMail(mailOptions);
      return { success: true, info };
    } catch (error) {
      console.log(
        `📧 Email attempt ${i + 1}/${maxRetries} failed:`,
        error.message,
      );

      if (
        error.message.includes("ECONNECTION") ||
        error.message.includes("timeout")
      ) {
        console.log("🔄 Connection issue, recreating transporter...");
        transporter = await initEmailService();
      }

      if (i === maxRetries - 1) {
        return { success: false, error };
      }

      // Chờ trước khi retry
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
  return { success: false, error: new Error("All retries failed") };
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
    // case "adapt":
    //   return getAdaptInterviewTemplate(userName, data);
    // case "coding":
    //   return getCodingInterviewTemplate(userName, data);
    default:
      console.warn(`Unknown interview type: ${type}, using standard template`);
      return getInterviewTemplate(userName, data);
  }
};

/**
 * Chọn subject email
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
 * Gửi email kết quả phỏng vấn
 */
const sendInterviewResultEmail = async (
  userId,
  interviewType,
  interviewData,
) => {
  try {
    // Kiểm tra params
    if (!userId || !interviewType || !interviewData) {
      console.error("❌ Missing required parameters:", {
        userId,
        interviewType,
        interviewData: !!interviewData,
      });
      return false;
    }

    // Lấy user info
    const user = await User.findById(userId).select(
      "userName email emailPreferences",
    );
    if (!user) {
      console.error(`❌ User not found: ${userId}`);
      return false;
    }

    // Kiểm tra preferences
    if (user.emailPreferences?.interviewResults === false) {
      console.log(`⏭️ User ${user.email} disabled interview result emails`);
      return true;
    }

    // Tạo nội dung email
    const htmlContent = getTemplateByType(
      interviewType,
      user.userName,
      interviewData,
    );
    const subject = getSubjectByType(interviewType, interviewData);

    const mailOptions = {
      from: `"Interview System" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: subject,
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

    // Gửi email với retry
    const result = await sendEmailWithRetry(mailOptions);

    if (result.success) {
      console.log(
        `✅ Interview result email sent to ${user.email} (${interviewType})`,
      );
      return true;
    } else {
      console.error(
        `❌ Failed to send email to ${user.email}:`,
        result.error.message,
      );
      return false;
    }
  } catch (error) {
    console.error(`❌ Error in sendInterviewResultEmail:`, error.message);
    return false;
  }
};

/**
 * Gửi email OTP
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
          <p>Vui lòng sử dụng mã OTP sau để ${type === "verification" ? "xác thực email" : "đặt lại mật khẩu"}:</p>
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

    const result = await sendEmailWithRetry(mailOptions);

    if (result.success) {
      console.log(`✅ OTP email sent to ${email} (${type})`);
      return true;
    } else {
      console.error(`❌ Failed to send OTP to ${email}:`, result.error.message);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error in sendOtpEmail:`, error.message);
    return false;
  }
};

// Khởi tạo email service khi module được load
initEmailService().catch(console.error);

module.exports = {
  initEmailService,
  sendInterviewResultEmail,
  sendOtpEmail,
};
