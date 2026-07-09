# 🌐 Tổng Quan Hệ Thống – AI InterView

## 1. Mô Tả Dự Án

**AI InterView** là nền tảng phỏng vấn thử thông minh, cho phép người dùng:

- Upload CV (PDF/DOCX) để AI phân tích kỹ năng
- Tham gia phỏng vấn mô phỏng với câu hỏi do AI sinh ra theo chủ đề
- Luyện tập phỏng vấn theo CV (CV-based interview)
- Luyện tập phỏng vấn thích ứng (Adaptive Interview) – câu hỏi tự động điều chỉnh theo trình độ
- Thực hành Live Coding với AI đánh giá code và hỏi giải thích
- Làm bài thi từ ngân hàng câu hỏi MCQ (Exam Sets) do admin tạo sẵn
- Xem lịch sử phỏng vấn, phân tích điểm yếu, và biểu đồ tiến độ

Hệ thống có hai nhóm người dùng chính:

- **Registered User**: Sử dụng tất cả tính năng luyện tập
- **Admin**: Quản trị hệ thống, quản lý người dùng, câu hỏi, bộ đề, giám sát token AI

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
│  │ Exam Sets (User: làm bài thi MCQ từ bộ đề admin tạo)    │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Admin Panel (Users, Interviews, CV, Adaptive, LiveCode,  │   │
│  │  Question Bank, Exam Sets, Token Usage, System Logs)     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  Contexts: Auth | Theme | Interview | History                     │
│  Services: api.js | analyze-cv.js                                 │
│  Base Components: BaseButton | BaseCard | BaseBadge | BaseInput  │
│                   BaseModal | BaseDropdown                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │  axios (baseURL: REACT_APP_API_URL)
┌──────────────────────────▼──────────────────────────────────────┐
│                BACKEND (Node.js + Express 5)                     │
│                                                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────────┐  │
│  │   Auth   │ │Interview │ │    CV    │ │ Adaptive/LiveCode  │  │
│  │  Routes  │ │  Routes  │ │  Routes  │ │     Routes         │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬───────────┘  │
│       │            │            │                  │              │
│  ┌────┴────────────┼────────────┼──────────────────┘              │
│  │    ┌────────────▼────────────▼────┐                            │
│  │    │     User Exam Set Routes     │                            │
│  │    └──────────────────────────────┘                            │
│  │    ┌──────────────────────────────┐                            │
│  │    │  Admin Routes                │                            │
│  │    │  (Questions, ExamSets,       │                            │
│  │    │   Token, Users, Sessions)    │                            │
│  │    └─────────┬────────────────────┘                            │
│  │              │                                                 │
│  ┌────▼─────────▼────────────────────────────────────────────┐   │
│  │              Controllers Layer                               │   │
│  └────────────────────────┬──────────────────────────────────┘   │
│                            │                                      │
│  ┌─────────────────────────▼─────────────────────────────────┐   │
│  │              Services Layer (Business Logic)                │   │
│  │  standardinterview/aiService.js                             │   │
│  │  adaptive/ (adaptiveAI, adaptiveCore, adaptiveSession)      │   │
│  │  cv/ (analyzeSkills, extractPdf, skillUtils, textUtils)     │   │
│  │  interview/ (generateQuestions, gradingService)              │   │
│  │  liveCoding/ (llmProvider, codeEvaluation, sessionStore)    │   │
│  │  logic/ (adaptiveServices, cvServices, interviewService,    │   │
│  │          liveCodingServices)                                 │   │
│  │  email/ (emailService, templates/)                          │   │
│  │  weaknessService.js                                         │   │
│  └─────────────────────────┬─────────────────────────────────┘   │
│                            │                                      │
│  ┌─────────────────────────▼─────────────────────────────────┐   │
│  │              AI Engine                                      │   │
│  │  Groq SDK (LLaMA) | Google Generative AI (Gemini)          │   │
│  │  @google/genai | LangChain (Groq)                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                   │
│  Middleware: auth.js (JWT verify) | admin.js (role check)        │
│  Utils: aiLogger | jsonExtractor | normalizeQuestions |           │
│         pdfReader | saveActivity                                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │  Mongoose ODM
┌──────────────────────────▼──────────────────────────────────────┐
│                      MongoDB Database                            │
│                                                                   │
│  Collections: users | interviewresults | adaptivesessions        │
│               cvinterviewsessions | livecodingsessions           │
│               activities | assessments                           │
│               questions | examsets | userprogresses               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Các Module Chính

| Module                  | Mô Tả                                                                         |
| ----------------------- | ----------------------------------------------------------------------------- |
| **Authentication**      | Đăng ký, đăng nhập, xác thực email bằng OTP, reset mật khẩu, Refresh Token    |
| **Standard Interview**  | Phỏng vấn theo chủ đề chọn sẵn (MCQ + tự luận), AI chấm điểm, tổng 100 điểm   |
| **CV Interview**        | Upload CV (PDF) → AI phân tích kỹ năng → sinh câu hỏi dựa trên CV             |
| **Adaptive Interview**  | Phỏng vấn thích ứng: AI điều chỉnh độ khó theo hiệu suất, roadmap học tập     |
| **Live Coding**         | Luyện tập code → AI đánh giá → 3 câu hỏi giải thích → đánh giá tổng hợp       |
| **Exam Sets**           | User làm bài thi MCQ từ bộ đề admin tạo sẵn, chấm điểm tự động                |
| **History & Analytics** | Xem lịch sử phỏng vấn (4 loại + coding), biểu đồ xu hướng, phân tích điểm yếu |
| **Profile & Settings**  | Quản lý hồ sơ cá nhân, theme sáng/tối, đổi mật khẩu, đa ngôn ngữ              |
| **Admin Panel**         | Quản lý users, xem lịch sử toàn hệ thống, Question Bank, Exam Sets, Token AI  |

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
| @headlessui/react          | Headless UI components             |
| @fontsource/inter          | Font Inter                         |
| clsx / tailwind-merge      | Utility CSS class merging          |
| date-fns                   | Xử lý ngày tháng                   |
| i18next + react-i18next    | Đa ngôn ngữ (VI/EN)                |

### Backend

| Thư Viện                             | Mục Đích                          |
| ------------------------------------ | --------------------------------- |
| Express 5                            | Web framework                     |
| Mongoose 9                           | MongoDB ODM                       |
| JWT (jsonwebtoken)                   | Xác thực token (Access + Refresh) |
| bcryptjs / bcrypt                    | Mã hóa mật khẩu                   |
| Multer                               | Upload file (PDF, Excel)          |
| pdf-parse / pdfjs-dist               | Đọc file PDF                      |
| mammoth                              | Đọc file DOCX                     |
| xlsx                                 | Import/Export Excel               |
| Nodemailer / Resend                  | Gửi email OTP                     |
| Groq SDK                             | Gọi AI Groq (LLaMA)               |
| @google/generative-ai, @google/genai | Gọi AI Google Gemini              |
| @langchain/groq, langchain           | LangChain integration             |
| OpenAI SDK                           | OpenAI API integration            |
| node-cache                           | Cache dữ liệu                     |
| dotenv                               | Quản lý biến môi trường           |
| uuid (v4)                            | Tạo session ID cho Live Coding    |
| winston + daily-rotate-file          | Logging & token usage tracking    |
| express-validator                    | Validate request body             |

---

## 5. Môi Trường Chạy

| Service           | Port  | Ghi chú                        |
| ----------------- | ----- | ------------------------------ |
| Frontend (React)  | 3000  | `npm start` trong `/frontend`  |
| Backend (Express) | 5000  | `npm run dev` trong `/backend` |
| MongoDB           | 27017 | Local hoặc MongoDB Atlas       |
