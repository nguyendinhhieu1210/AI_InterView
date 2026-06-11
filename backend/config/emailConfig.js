const { Resend } = require("resend");

const createTransporter = () => {
  if (!process.env.RESEND_API_KEY) {
    console.error("❌ Missing RESEND_API_KEY in environment variables");
    return null;
  }

  const client = new Resend(process.env.RESEND_API_KEY);
  console.log("📧 Email transporter ready (Resend)");

  // Giữ interface giống nodemailer để emailService.js không cần sửa
  return {
    sendMail: async ({ from, to, subject, html, text }) => {
      const { data, error } = await client.emails.send({
        from: from || `AI Interview <onboarding@resend.dev>`,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        ...(text && { text }),
      });
      if (error) throw new Error(error.message);
      return { messageId: data.id };
    },
    verify: async () => true,
  };
};

const verifyConnection = async (transporter) => {
  if (!transporter) {
    console.warn("⚠️ No transporter to verify");
    return false;
  }
  console.log("✅ Email service ready (Resend)");
  return true;
};

module.exports = { createTransporter, verifyConnection };
