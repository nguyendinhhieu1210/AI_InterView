# 🌐 Tổng Quan Hệ Thống – AI InterView

## 1. Mô Tả Dự Án

**AI InterView** là nền tảng phỏng vấn thử thông minh, cho phép người dùng:

- Upload CV (PDF/DOCX) để AI phân tích kỹ năng
- Tham gia phỏng vấn mô phỏng với câu hỏi do AI sinh ra theo chủ đề
- Luyện tập phỏng vấn theo CV (CV-based interview)
- Luyện tập phỏng vấn thích ứng (Adaptive Interview) – câu hỏi tự động điều chỉnh theo trình độ
- Thực hành Live Coding với AI đánh giá code và hỏi giải thích
- Xem lịch sử phỏng vấn, phân tích điểm yếu, và biểu đồ tiến độ

---

## 2. Bố Cục Tổng Thể (System Layout)

```
┌─────────────────────────────────────────────────────────────────┐
│                        NGƯỜI DÙNG (Browser)                      │
└──────────────────────────┬──────────────────────────────────────┘
                           │  HTTP / REST API
┌──────────────────────────▼──────────────────────────────────────┐
│                  FRONTEND (React 19 + TailwindCSS)               │
│                                                                   │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────────┐   │
│  │  Auth Pages │  │ Interview    │  │  History & Analytics  │   │
│  │  (Login/    │  │ Pages (MCQ,  │  │  (Charts, Weakness,   │   │
│  │  Register/  │  │  CV, Adapt., │  │   Profile, Settings)  │   │
│  │  OTP/Reset) │  │  LiveCode)   │  │                       │   │
│  └─────────────┘  └──────────────┘  └───────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Admin Panel (Users, Interviews, CV, Adaptive, LiveCode)  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  Contexts: Auth | Theme | Interview | History                     │
│  Services: api.js | analyze-cv.js | generate-questions.js         │
│            interviewAPI.js                                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │  axios (baseURL: http://localhost:5000/api)
┌──────────────────────────▼──────────────────────────────────────┐
│                BACKEND (Node.js + Express 5)                     │
│                                                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────────┐  │
│  │   Auth   │ │Interview │ │    CV    │ │ Adaptive/LiveCode  │  │
│  │  Routes  │ │  Routes  │ │  Routes  │ │     Routes         │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬───────────┘  │
│       │            │            │                  │              │
│       └────────────┼────────────┼──────────────────┘              │
│               ┌────▼────────────▼────┐                            │
│               │     Admin Routes     │                            │
│               └─────────┬────────────┘                            │
│                         │                                         │
│  ┌────▼─────────────▼────────────▼──────────────────▼─────────┐  │
│  │              Controllers Layer                               │  │
│  └────────────────────────┬────────────────────────────────────┘  │
│                            │                                      │
│  ┌─────────────────────────▼───────────────────────────────────┐  │
│  │              Services Layer (Business Logic)                  │  │
│  │  aiService | adaptiveInterviewService | weaknessService      │  │
│  │  cv/ (analyzeSkills, extractPdf, skillUtils, textUtils)      │  │
│  │  interview/ (generateQuestions, gradingService)               │  │
│  │  liveCoding/ (llmProvider, codeEvaluationService,            │  │
│  │              sessionStore, sessionService)                    │  │
│  └─────────────────────────┬───────────────────────────────────┘  │
│                            │                                      │
│  ┌─────────────────────────▼───────────────────────────────────┐  │
│  │              AI Engine                                        │  │
│  │  Groq SDK (LLaMA) | Google Generative AI (Gemini)            │  │
│  └─────────────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────────┘
                           │  Mongoose ODM
┌──────────────────────────▼──────────────────────────────────────┐
│                      MongoDB Database                            │
│                                                                   │
│  Collections: users | interviewresults | adaptivesessions        │
│               interviewsessions (CV) | livecodingsessions        │
│               activities | assessments                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Các Module Chính

| Module                  | Mô Tả                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------ |
| **Authentication**      | Đăng ký, đăng nhập, xác thực email bằng OTP, reset mật khẩu, Remember Me             |
| **Standard Interview**  | Phỏng vấn theo chủ đề chọn sẵn (7 MCQ + 3 tự luận), AI chấm điểm, tổng 100 điểm      |
| **CV Interview**        | Upload CV (PDF/DOCX) → AI phân tích kỹ năng → sinh câu hỏi dựa trên CV               |
| **Adaptive Interview**  | Phỏng vấn thích ứng: AI điều chỉnh độ khó theo hiệu suất, tối đa 5 câu hỏi follow-up |
| **Live Coding**         | Luyện tập code → AI đánh giá → 3 câu hỏi giải thích → đánh giá tổng hợp              |
| **History & Analytics** | Xem lịch sử phỏng vấn (4 loại), biểu đồ xu hướng, phân tích điểm yếu                 |
| **Profile & Settings**  | Quản lý hồ sơ cá nhân, theme sáng/tối, đổi mật khẩu                                  |
| **Admin Panel**         | Quản lý người dùng, xem toàn bộ lịch sử phỏng vấn MCQ, CV, Adaptive và Live Coding   |

---

## 4. Công Nghệ Sử Dụng

### Frontend

| Thư Viện                   | Mục Đích                           |
| -------------------------- | ---------------------------------- |
| React 19                   | UI framework chính                 |
| React Router DOM v7        | Điều hướng trang                   |
| TailwindCSS 3              | Utility-first CSS                  |
| Framer Motion              | Animations                         |
| Chart.js / Recharts        | Biểu đồ thống kê                   |
| Monaco Editor              | Trình soạn thảo code (Live Coding) |
| react-hot-toast            | Thông báo toast                    |
| lucide-react / react-icons | Icon library                       |
| axios                      | HTTP client                        |
| canvas-confetti            | Hiệu ứng chúc mừng                 |

### Backend

| Thư Viện                             | Mục Đích                       |
| ------------------------------------ | ------------------------------ |
| Express 5                            | Web framework                  |
| Mongoose 9                           | MongoDB ODM                    |
| JWT (jsonwebtoken)                   | Xác thực token                 |
| bcryptjs                             | Mã hóa mật khẩu                |
| Multer                               | Upload file                    |
| pdf-parse                            | Đọc file PDF                   |
| mammoth                              | Đọc file DOCX                  |
| Nodemailer                           | Gửi email OTP                  |
| Groq SDK                             | Gọi AI Groq (LLaMA)            |
| @google/generative-ai, @google/genai | Gọi AI Google Gemini           |
| node-cache                           | Cache dữ liệu                  |
| dotenv                               | Quản lý biến môi trường        |
| uuid (v4)                            | Tạo session ID cho Live Coding |

---

## 5. Môi Trường Chạy

| Service           | Port  | Ghi chú                                  |
| ----------------- | ----- | ---------------------------------------- |
| Frontend (React)  | 3000  | `npm start` trong `/frontend`            |
| Backend (Express) | 5000  | `npx nodemon server.js` trong `/backend` |
| MongoDB           | 27017 | Local hoặc MongoDB Atlas                 |
