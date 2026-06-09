# 🔄 Luồng Người Dùng Chính – AI InterView

## 1. Luồng Xác Thực (Authentication Flow)

```
[Lần đầu truy cập]
        │
        ▼
  ┌─────────────┐
  │  Trang "/"  │  → Register Page
  └──────┬──────┘
         │ Điền form (username, fullName, email, password)
         ▼
  ┌──────────────────┐
  │  Gửi OTP qua     │  → Backend gửi email OTP (Nodemailer)
  │  Email (VerifyOTP)│
  └──────┬───────────┘
         │ Nhập đúng OTP → isVerified = true
         ▼
  ┌─────────────┐
  │  Login Page │  → Nhập email + password → JWT token → localStorage
  └──────┬──────┘
         │ Token hợp lệ
         ▼
  ┌──────────────┐
  │ Welcome Page │  → Trang chủ sau đăng nhập
  └──────────────┘

[Quên mật khẩu]
  ForgotPassword → Nhập email → OTP gửi về email
  → VerifyOTP → ResetPassword → Đặt mật khẩu mới → Login
```

---

## 2. Luồng Phỏng Vấn Tiêu Chuẩn (Standard Interview)

```
  Welcome Page
       │
       │ Click "Bắt đầu phỏng vấn"
       ▼
  ┌──────────────────────────┐
  │  Interview Page          │
  │  - Chọn chủ đề (Topic)   │
  │  - Chọn độ khó           │
  └──────────┬───────────────┘
             │ Submit → API POST /api/interview/generate
             ▼
  ┌──────────────────────────┐
  │  AI sinh câu hỏi         │
  │  (7 MCQ + 3 tự luận)     │
  │  via Groq / Gemini AI    │
  └──────────┬───────────────┘
             │
             ▼
  ┌──────────────────────────┐
  │  Người dùng trả lời      │
  │  từng câu hỏi            │
  └──────────┬───────────────┘
             │ Submit tất cả → API POST /api/interview/submit
             ▼
  ┌──────────────────────────┐
  │  AI chấm điểm & feedback │
  │  → Lưu vào MongoDB       │
  │  (InterviewResult)       │
  └──────────┬───────────────┘
             │
             ▼
  ┌──────────────────────────┐
  │  Hiển thị kết quả        │
  │  (EvaluationModal /      │
  │   InterviewReportModal)  │
  └──────────┬───────────────┘
             │
             ▼
  ┌──────────────────────────┐
  │  History Page            │
  │  /history → /history/:id │
  └──────────────────────────┘
```

---

## 3. Luồng Phỏng Vấn Theo CV (CV Interview)

```
  Welcome Page → Click "Phỏng vấn theo CV"
       │
       ▼
  ┌──────────────────────────┐
  │  InterviewCVPage         │
  │  - Upload file CV        │
  │    (PDF/DOCX)            │
  └──────────┬───────────────┘
             │ POST /api/cv/upload + /api/cv/analyze
             ▼
  ┌──────────────────────────┐
  │  Backend:                │
  │  Multer nhận file        │
  │  → pdf-parse đọc text    │
  │  → AI phân tích kỹ năng  │
  │    (Frontend/Backend/    │
  │     Theory skills)       │
  └──────────┬───────────────┘
             │
             ▼
  ┌──────────────────────────┐
  │  CVInfoModal             │
  │  Hiển thị kỹ năng        │
  │  trích xuất từ CV        │
  └──────────┬───────────────┘
             │ Xác nhận → Sinh câu hỏi dựa trên CV
             ▼
  ┌──────────────────────────┐
  │  Phỏng vấn theo CV       │
  │  → Trả lời → Nộp bài     │
  │  → AI chấm → Lưu kết quả │
  │  (CVInterviewSession)    │
  └──────────┬───────────────┘
             │
             ▼
  ┌──────────────────────────┐
  │  CV History Page         │
  │  /cv-history → detail    │
  └──────────────────────────┘
```

---

## 4. Luồng Phỏng Vấn Thích Ứng (Adaptive Interview)

```
  Welcome Page → "Adaptive Interview"
       │
       ▼
  ┌──────────────────────────┐
  │  AdaptiveInterviewPage   │
  │  - Chọn chủ đề           │
  │  - Bắt đầu session       │
  └──────────┬───────────────┘
             │ POST /api/adaptive/start
             ▼
  ┌──────────────────────────┐
  │  AI sinh câu hỏi         │
  │  dựa trên trình độ hiện  │
  │  tại (difficulty level)  │
  └──────────┬───────────────┘
             │
  ┌──────────▼───────────────┐
  │  Người dùng trả lời →    │
  │  AI đánh giá ngay →      │◄──┐
  │  Điều chỉnh độ khó       │   │ Lặp lại
  └──────────┬───────────────┘   │ theo từng câu
             │ Kết thúc session  │
             │ (sessionComplete) │
             ▼
  ┌──────────────────────────┐
  │  Tổng kết session        │
  │  → AdaptiveHistoryPage   │
  │  → AdaptiveSessionDetail │
  └──────────────────────────┘
```

---

## 5. Luồng Xem Phân Tích & Lịch Sử

```
  Welcome Page (Sidebar)
       │
       ├──→ /history            → Lịch sử Standard Interview
       │        └──→ /history/:id  → Chi tiết 1 bài
       │
       ├──→ /cv-history         → Lịch sử CV Interview
       │        └──→ /cv-history/:id
       │
       ├──→ /adaptive-history   → Lịch sử Adaptive
       │        └──→ /adaptive-history/:sessionId
       │
       ├──→ /interview-history  → Toàn bộ lịch sử
       │
       └──→ /profile
                ├── Biểu đồ tiến độ (PerformanceTrendChart)
                ├── ActivityCalendar (heatmap hoạt động)
                └── WeaknessAnalysis (phân tích điểm yếu)
```

---

## 6. Luồng Quản Lý Tài Khoản

```
  /profile    → Xem & chỉnh sửa thông tin cá nhân, đổi avatar
  /settings   → Dark mode, ngôn ngữ (VI/EN), đổi mật khẩu
  /help       → Hướng dẫn sử dụng & FAQ
```

---

## 7. Sơ Đồ Navigation Tổng Thể

```
Public Routes:
  /              → Register
  /login         → Login
  /forgot-password → ForgotPassword
  /verify-otp    → VerifyOTP
  /reset-password → ResetPassword

Protected Routes (yêu cầu JWT):
  /welcome           → Trang chủ
  /interview         → Standard Interview
  /cvinterview       → CV Interview
  /adaptive-interview → Adaptive Interview
  /live-coding       → Live Coding
  /history           → Lịch sử Standard
  /history/:id       → Chi tiết Standard
  /cv-history        → Lịch sử CV
  /cv-history/:id    → Chi tiết CV
  /adaptive-history           → Lịch sử Adaptive
  /adaptive-history/:sessionId → Chi tiết Adaptive
  /interview-history → Toàn bộ lịch sử
  /profile           → Hồ sơ cá nhân
  /settings          → Cài đặt
  /help              → Hỗ trợ
```
