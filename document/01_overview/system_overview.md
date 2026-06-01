# 🌐 Tổng Quan Hệ Thống – AI InterView

## 1. Mô Tả Dự Án

**AI InterView** là nền tảng phỏng vấn thử thông minh, cho phép người dùng:
- Upload CV (PDF/DOCX) để AI phân tích kỹ năng
- Tham gia phỏng vấn mô phỏng với câu hỏi do AI sinh ra theo chủ đề
- Luyện tập phỏng vấn theo CV (CV-based interview)
- Luyện tập phỏng vấn thích ứng (Adaptive Interview) – câu hỏi tự động điều chỉnh theo trình độ
- Thực hành Live Coding
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
│                                                                   │
│  Contexts: Auth | Theme | Language | Interview                    │
│  Services: api.js | analyze-cv.js | interviewAPI.js               │
└──────────────────────────┬──────────────────────────────────────┘
                           │  axios (proxy → localhost:5000)
┌──────────────────────────▼──────────────────────────────────────┐
│                BACKEND (Node.js + Express 5)                     │
│                                                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────────┐  │
│  │   Auth   │ │Interview │ │    CV    │ │ Adaptive/LiveCode  │  │
│  │  Routes  │ │  Routes  │ │  Routes  │ │     Routes         │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬───────────┘  │
│       │            │            │                  │              │
│  ┌────▼─────────────▼────────────▼──────────────────▼─────────┐  │
│  │              Controllers Layer                               │  │
│  └────────────────────────┬────────────────────────────────────┘  │
│                            │                                      │
│  ┌─────────────────────────▼───────────────────────────────────┐  │
│  │              Services Layer (Business Logic)                  │  │
│  │  aiService | groqService | adaptiveInterviewService          │  │
│  │  cvService (extractPdf, analyzeSkills) | weaknessService     │  │
│  └─────────────────────────┬───────────────────────────────────┘  │
│                            │                                      │
│  ┌─────────────────────────▼───────────────────────────────────┐  │
│  │              AI Engine                                        │  │
│  │  Groq API (LLaMA 3) | Google Generative AI                   │  │
│  └─────────────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────────┘
                           │  Mongoose ODM
┌──────────────────────────▼──────────────────────────────────────┐
│                      MongoDB Database                            │
│                                                                   │
│  Collections: users | interviewresults | adaptivesessions        │
│               cvinterviewsessions | livecodingsessions           │
│               activities | assessments                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Các Module Chính

| Module | Mô Tả |
|---|---|
| **Authentication** | Đăng ký, đăng nhập, xác thực email bằng OTP, reset mật khẩu |
| **Standard Interview** | Phỏng vấn theo chủ đề chọn sẵn (MCQ + câu hỏi tự luận), AI chấm điểm |
| **CV Interview** | Upload CV → AI phân tích kỹ năng → sinh câu hỏi dựa trên CV |
| **Adaptive Interview** | Phỏng vấn thích ứng: AI điều chỉnh độ khó theo hiệu suất người dùng |
| **Live Coding** | Luyện tập code trực tiếp trong trình soạn thảo Monaco Editor |
| **History & Analytics** | Xem lịch sử phỏng vấn, biểu đồ xu hướng, phân tích điểm yếu |
| **Profile & Settings** | Quản lý hồ sơ cá nhân, theme sáng/tối, đa ngôn ngữ (i18n) |

---

## 4. Công Nghệ Sử Dụng

### Frontend
| Thư Viện | Mục Đích |
|---|---|
| React 19 | UI framework chính |
| React Router DOM v7 | Điều hướng trang |
| TailwindCSS 3 | Utility-first CSS |
| Framer Motion | Animations |
| Chart.js / Recharts | Biểu đồ thống kê |
| Monaco Editor | Trình soạn thảo code |
| i18next | Đa ngôn ngữ |
| react-hot-toast | Thông báo toast |
| lucide-react | Icon library |
| axios | HTTP client |

### Backend
| Thư Viện | Mục Đích |
|---|---|
| Express 5 | Web framework |
| Mongoose 9 | MongoDB ODM |
| JWT | Xác thực token |
| bcryptjs | Mã hóa mật khẩu |
| Multer | Upload file |
| pdf-parse | Đọc file PDF |
| Nodemailer | Gửi email OTP |
| Groq SDK | Gọi AI Groq (LLaMA) |
| Google Generative AI | Gọi AI Gemini |
| dotenv | Quản lý biến môi trường |

---

## 5. Môi Trường Chạy

| Service | Port | Ghi chú |
|---|---|---|
| Frontend (React) | 3000 | `npm start` trong `/frontend` |
| Backend (Express) | 5000 | `npm start` trong `/backend` |
| MongoDB | 27017 | Local hoặc MongoDB Atlas |
