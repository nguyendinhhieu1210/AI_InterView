// Base layout dùng chung cho tất cả các loại email
const getBaseLayout = (content, title, userName, customStyles = '') => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f4f4f7;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 32px 24px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .header p {
          margin: 8px 0 0;
          opacity: 0.9;
        }
        .content {
          padding: 32px 24px;
        }
        .greeting {
          font-size: 18px;
          margin-bottom: 24px;
        }
        .greeting strong {
          color: #667eea;
        }
        .action-button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          padding: 12px 32px;
          border-radius: 8px;
          font-weight: 600;
          margin: 16px 0;
          text-align: center;
        }
        .message-box {
          padding: 16px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .footer {
          background: #f8f9fa;
          padding: 20px 24px;
          text-align: center;
          font-size: 12px;
          color: #999;
          border-top: 1px solid #e0e0e0;
        }
        .footer a {
          color: #667eea;
          text-decoration: none;
        }
        ${customStyles}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${title}</h1>
          <p>Cảm ơn bạn đã tham gia bài kiểm tra</p>
        </div>
        
        <div class="content">
          <div class="greeting">
            Xin chào <strong>${userName}</strong>!
          </div>
          
          ${content}
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/interview-history" 
               class="action-button">
              📊 Xem Chi Tiết Bài Làm
            </a>
          </div>
          
          <p style="font-size: 13px; color: #666; text-align: center; margin-top: 24px;">
            Đăng nhập để xem đáp án chi tiết và giải thích cho từng câu hỏi.
          </p>
        </div>
        
        <div class="footer">
          <p>Email này được gửi tự động từ hệ thống phỏng vấn.</p>
          <p>© ${new Date().getFullYear()} Interview System. All rights reserved.</p>
          <p>
            <a href="${process.env.FRONTEND_URL}/settings/notifications">Cài đặt email</a> | 
            <a href="${process.env.FRONTEND_URL}/help">Trợ giúp</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = { getBaseLayout };