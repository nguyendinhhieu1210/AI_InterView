# ⚙️ Tài Liệu Backend – Khởi Tạo & Cấu Trúc

## 1. Khởi Tạo Project

### Yêu Cầu Hệ Thống
- Node.js >= 18.x
- npm >= 9.x
- MongoDB >= 6.x (local) hoặc MongoDB Atlas (cloud)

### Khởi Tạo & Cài Đặt
```bash
mkdir backend && cd backend
npm init -y

# Core dependencies
npm install express cors dotenv mongoose
npm install bcryptjs jsonwebtoken nodemailer

# File upload & parsing
npm install multer pdf-parse mammoth

# AI providers
npm install groq-sdk @google/generative-ai @google/genai
npm install @langchain/groq langchain

# Text utils
npm install remove-accents unidecode unorm

# Dev
npm install -D nodemon
```

### Chạy Server
```bash
cd backend
# Development (auto-restart)
npx nodemon server.js

# Production
node server.js
# → http://localhost:5000
```

---

## 2. Cấu Trúc Source Code

```
backend/
├── server.js              ← Entry point
├── .env                   ← Biến môi trường (không commit)
├── .gitignore
│
├── database/
│   ├── index.js           ← Export connectDatabase()
│   └── mongodb.js         ← mongoose.connect() logic
│
├── routes/                ← Định nghĩa URL endpoints
│   ├── authRoutes.js      ← /api/auth
│   ├── userRoutes.js      ← /api/users
│   ├── interviewRoutes.js ← /api/interview
│   ├── cv.js              ← /api/cv
│   ├── weaknessRoutes.js  ← /api/weakness
│   ├── adaptiveInterviewRoutes.js  ← /api/adaptive
│   ├── liveCodingRoutes.js         ← /api/live-coding
│   └── activityRoutes.js           ← /api/activity
│
├── controllers/           ← Nhận request, gọi service, trả response
│   ├── authController.js
│   ├── userController.js
│   ├── interviewController.js
│   ├── cvController.js
│   ├── adaptiveInterviewController.js
│   ├── liveCodingController.js
│   ├── weaknessController.js
│   └── activityController.js
│
├── services/              ← Business logic & AI integration
│   ├── aiService.js                ← Wrapper gọi AI chung
│   ├── weaknessService.js          ← Phân tích điểm yếu
│   ├── adaptiveInterviewService.js ← Logic phỏng vấn thích ứng
│   ├── ai/
│   │   ├── groqService.js          ← Khởi tạo Groq client
│   │   ├── parsers/                ← Parse JSON response từ AI
│   │   └── prompts/                ← Prompt templates
│   ├── cv/
│   │   ├── extractPdf.js           ← Đọc text từ PDF
│   │   ├── analyzeSkills.js        ← Phân tích & phân loại kỹ năng
│   │   ├── skillUtils.js           ← Helper functions cho skill
│   │   └── textUtils.js            ← Xử lý text (normalize, clean)
│   ├── interview/                  ← Logic sinh câu hỏi standard
│   └── liveCoding/                 ← Logic live coding
│
├── models/                ← Mongoose Schemas (xem database_schema.md)
│   ├── User.js
│   ├── InterviewResult.js
│   ├── AdaptiveSession.js
│   ├── CVInterviewSession.js
│   ├── LiveCodingSession.js
│   ├── Activity.js
│   └── Assessment.js
│
├── middleware/
│   └── auth.js            ← JWT middleware (verifyToken)
│
├── utils/                 ← Helper dùng chung
├── uploads/               ← Thư mục tạm lưu CV upload
└── public/                ← Static assets
```

---

## 3. Kết Nối Database

**File:** `backend/database/mongodb.js`

```javascript
const mongoose = require('mongoose');

const connectDatabase = async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
};

module.exports = { connectDatabase };
```

**Cấu hình trong `.env`:**
```env
MONGO_URI=mongodb://localhost:27017/ai_interview
# Hoặc Atlas:
# MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/ai_interview
```

---

## 4. Biến Môi Trường (.env)

```env
# Server
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database
MONGO_URI=mongodb://localhost:27017/ai_interview

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# Email (Nodemailer – Gmail)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# AI Providers
GROQ_API_KEY=gsk_...
GOOGLE_AI_API_KEY=AIza...
```

> ⚠️ **KHÔNG commit file `.env` lên Git!** File đã được thêm vào `.gitignore`.

---

## 5. Middleware Auth

**File:** `backend/middleware/auth.js`

```javascript
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Không có token, truy cập bị từ chối' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, iat, exp }
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};
```

**Cách dùng trong routes:**
```javascript
const auth = require('../middleware/auth');
router.get('/profile', auth, userController.getProfile);
```

---

## 6. Cấu Trúc Request/Response Chuẩn

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Mô tả thành công"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Mô tả lỗi",
  "error": "Chi tiết lỗi (dev only)"
}
```

---

## 7. Tích Hợp AI

### Groq API (LLaMA 3)
```javascript
// services/ai/groqService.js
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Ví dụ gọi
const response = await groq.chat.completions.create({
  model: 'llama3-8b-8192',
  messages: [{ role: 'user', content: prompt }],
  temperature: 0.7,
});
```

### Google Generative AI (Gemini)
```javascript
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
```

---

## 8. Upload File với Multer

```javascript
const multer = require('multer');

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Chỉ hỗ trợ file PDF'));
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});
```

---

## 9. Gửi Email OTP (Nodemailer)

```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // App password (không phải pass thường)
  }
});

// Gửi OTP
await transporter.sendMail({
  from: process.env.EMAIL_USER,
  to: userEmail,
  subject: 'Xác thực tài khoản AI InterView',
  html: `<p>Mã OTP: <strong>${otp}</strong> (hết hạn sau 10 phút)</p>`
});
```

---

## 10. Scripts Package.json

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest"
  }
}
```
