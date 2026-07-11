# 🏗️ Kiến Trúc Hệ Thống – AI InterView

## 1. Mô Hình Kiến Trúc

Dự án sử dụng kiến trúc **Client-Server truyền thống** với mô hình **MVC** ở phía Backend và **Component-based** ở phía Frontend.

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT TIER                              │
│                React SPA (Single Page App)                   │
│   Port 3000 | Proxy → Backend 5000                          │
└─────────────────────┬───────────────────────────────────────┘
                      │  REST API (JSON)
                      │  Authorization: Bearer <JWT>
┌─────────────────────▼───────────────────────────────────────┐
│                    SERVER TIER                               │
│              Node.js + Express 5 Backend                     │
│                      Port 5000                               │
│                                                              │
│  ┌──────────┐   ┌──────────────┐   ┌────────────────────┐   │
│  │  Routes  │──▶│ Controllers  │──▶│     Services       │   │
│  └──────────┘   └──────────────┘   └────────┬───────────┘   │
│                                             │                │
│                              ┌──────────────▼─────────────┐  │
│                              │       AI Providers          │  │
│                              │  Groq API | Google AI API   │  │
│                              └────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────────┘
                      │  Mongoose ODM
┌─────────────────────▼───────────────────────────────────────┐
│                    DATA TIER                                 │
│                MongoDB Database                              │
│          (Local / MongoDB Atlas Cloud)                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Kiến Trúc Backend Chi Tiết

```
backend/
├── server.js              ← Entry point, khởi tạo Express, kết nối DB
├── database/
│   ├── index.js           ← Export hàm connectDatabase()
│   └── mongodb.js         ← Logic kết nối MongoDB với mongoose
├── routes/                ← Định nghĩa endpoints
│   ├── authRoutes.js      ← /api/auth/*
│   ├── userRoutes.js      ← /api/users/*
│   ├── interviewRoutes.js ← /api/interview/*
│   ├── cv.js              ← /api/cv/*
│   ├── weaknessRoutes.js  ← /api/weakness/*
│   ├── adaptiveInterviewRoutes.js ← /api/adaptive/*
│   ├── liveCodingRoutes.js        ← /api/live-coding/*
│   ├── activityRoutes.js          ← /api/activity/*
│   ├── admin/questionRoutes.js    ← /api/admin/questions, /api/admin/programming-languages
│   └── admin/examSetRoutes.js     ← /api/admin/exam-sets
├── controllers/           ← Xử lý request/response (thin layer)
│   ├── authController.js
│   ├── interviewController.js
│   ├── cvController.js
│   ├── adaptiveInterviewController.js
│   ├── liveCodingController.js
│   ├── weaknessController.js
│   ├── userController.js
│   ├── activityController.js
│   ├── admin/questionController.js
│   └── admin/examSetController.js
├── services/              ← Business logic chính
│   ├── aiService.js       ← Gọi AI API tổng hợp
│   ├── weaknessService.js ← Phân tích điểm yếu
│   ├── adaptiveInterviewService.js ← Logic adaptive
│   ├── ai/
│   │   ├── groqService.js ← Kết nối Groq LLaMA
│   │   ├── parsers/       ← Parsing response AI
│   │   └── prompts/       ← Prompt templates
│   ├── cv/
│   │   ├── extractPdf.js  ← Đọc text từ PDF
│   │   ├── analyzeSkills.js ← Phân tích kỹ năng CV
│   │   ├── skillUtils.js  ← Tiện ích xử lý skill
│   │   └── textUtils.js   ← Tiện ích xử lý text
│   ├── interview/         ← Logic phỏng vấn tiêu chuẩn
│   └── liveCoding/        ← Logic live coding
├── models/                ← Mongoose Schemas
│   ├── User.js
│   ├── InterviewResult.js
│   ├── AdaptiveSession.js
│   ├── CVInterviewSession.js
│   ├── LiveCodingSession.js
│   ├── Activity.js
│   ├── Assessment.js
│   ├── Question.js
│   └── ExamSet.js
├── middleware/
│   └── auth.js            ← JWT verification middleware
├── utils/                 ← Tiện ích chung
├── uploads/               ← Lưu file CV upload tạm thời
└── public/                ← Static files
```

---

## 3. Kiến Trúc Frontend Chi Tiết

```
frontend/src/
├── App.js                 ← Root component, định nghĩa tất cả Routes
├── index.js               ← Entry point, render vào DOM
├── i18n.js                ← Cấu hình đa ngôn ngữ
├── Pages/                 ← Các trang ứng với routes
│   ├── [Auth]
│   │   ├── Register.jsx
│   │   ├── Login.jsx
│   │   ├── ForgotPassword.jsx
│   │   ├── VerifyOTP.jsx
│   │   └── ResetPassword.jsx
│   ├── [Interview]
│   │   ├── InterviewPage.jsx       ← Standard Interview
│   │   ├── InterviewCVPage.jsx     ← CV Interview
│   │   ├── AdaptiveInterviewPage.jsx
│   │   └── LiveCodingPage.jsx
│   ├── [History]
│   │   ├── HistoryPage.jsx
│   │   ├── InterviewDetailPage.jsx
│   │   ├── CVHistoryPage.jsx
│   │   ├── CVHistoryDetailPage.jsx
│   │   ├── AdaptiveHistoryPage.jsx
│   │   ├── AdaptiveSessionDetailPage.jsx
│   │   └── InterviewHistoryPage.jsx
│   └── [User]
│       ├── WellcomePage.jsx
│       ├── ProfilePage.jsx
│       ├── SettingsPage.jsx
│       └── HelpSupportPage.jsx
├── components/            ← Reusable UI Components
│   ├── ProtectedRoute.jsx
│   ├── CVInfoModal.jsx
│   ├── CodingInterface.jsx
│   ├── EvaluationModal.jsx
│   ├── InterviewReportModal.jsx
│   ├── StartInterviewModal.jsx
│   ├── TopicSelection.jsx
│   ├── UploadCV.jsx
│   ├── AIFeedback.jsx
│   ├── PDFPreview.jsx
│   ├── ActivityCalendar.jsx
│   ├── PerformanceTrendChart.jsx
│   ├── WeaknessAnalysis.jsx
│   ├── ProgressChart.jsx
│   └── DarkModeToggle.jsx
├── contexts/              ← React Context (Global State)
│   ├── AuthContext.jsx    ← User auth state, token
│   ├── ThemeContext.jsx   ← Dark/Light mode
│   ├── LanguageContext.jsx ← VI/EN language
│   └── InterviewContext.jsx
├── services/              ← API call functions
│   ├── api.js             ← Base axios instance
│   ├── analyze-cv.js      ← CV analysis API calls
│   ├── generate-questions.js
│   └── interviewAPI.js
└── store/                 ← (Redux hoặc Zustand – hiện trống)
```

---

## 4. Data Flow (Luồng Dữ Liệu)

```
[User Action] → [React Component]
                      │
                      ▼ axios call
               [Frontend Service]
                      │
                      ▼ HTTP Request + JWT
               [Express Router]
                      │
                      ▼
               [Middleware auth.js] ← Verify JWT
                      │
                      ▼
               [Controller] ← Parse req, handle errors
                      │
                      ▼
               [Service Layer] ← Business logic
                      │
                 ┌────┴────┐
                 ▼          ▼
          [MongoDB]    [AI Provider]
         (Mongoose)  (Groq / Gemini)
                 │          │
                 └────┬─────┘
                      ▼
               [Controller] ← Format response
                      │
                      ▼ JSON Response
               [React Component] ← Update state/UI
```

---

## 5. Bảo Mật

| Cơ Chế             | Mô Tả                                                               |
| ------------------ | ------------------------------------------------------------------- |
| JWT Authentication | Token lưu trong localStorage, đính kèm header mỗi request           |
| Password Hashing   | bcryptjs với salt 10 rounds                                         |
| Email Verification | OTP 6 chữ số, hết hạn sau 10 phút                                   |
| CORS               | Chỉ cho phép origin từ FRONTEND_URL                                 |
| Protected Routes   | Frontend dùng `<ProtectedRoute>`, Backend dùng middleware `auth.js` |
| File Upload        | Multer giới hạn loại file và kích thước                             |
