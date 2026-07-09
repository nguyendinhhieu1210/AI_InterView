# 🎭 Biểu Đồ Use Case – AI InterView

> **Mức độ:** Tổng quát  
> **Mục đích:** Giúp team hiểu hệ thống có những chức năng gì, ai sử dụng  
> **Cập nhật:** 2026-07-09

---

## 1. Các Actor

| Actor               | Mô Tả                                                                         |
| ------------------- | ----------------------------------------------------------------------------- |
| **Guest**           | Người chưa đăng nhập – chỉ truy cập được trang đăng ký/đăng nhập              |
| **Registered User** | Người dùng đã đăng ký và xác thực email – có toàn quyền sử dụng hệ thống      |
| **Admin**           | Quản trị viên – quản lý người dùng, câu hỏi, bộ đề, xem lịch sử toàn hệ thống |
| **AI System**       | Thành phần AI nội bộ (Groq/Gemini) – tự động sinh câu hỏi, chấm điểm          |
| **Email Service**   | Dịch vụ gửi email OTP (Nodemailer + Gmail)                                    |

---

## 2. Biểu Đồ Use Case Tổng Quát

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         HỆ THỐNG AI INTERVIEW                            │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                  AUTHENTICATION MODULE                              │  │
│  │                                                                      │  │
│  │   UC01 ── Đăng ký tài khoản                                        │  │
│  │   UC02 ── Xác thực email (OTP)                                     │  │
│  │   UC03 ── Đăng nhập (JWT + Refresh Token)                         │  │
│  │   UC04 ── Quên / Reset mật khẩu                                    │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                  INTERVIEW MODULE                                    │  │
│  │                                                                      │  │
│  │   UC05 ── Phỏng vấn tiêu chuẩn (chọn topic + độ khó)              │  │
│  │   UC06 ── Phỏng vấn theo CV (upload CV → AI phân tích)            │  │
│  │   UC07 ── Phỏng vấn thích ứng (AI điều chỉnh độ khó động)         │  │
│  │   UC08 ── Luyện tập Live Coding                                    │  │
│  │   UC09 ── Làm bài thi Exam Sets (MCQ từ ngân hàng câu hỏi)       │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                  ANALYTICS MODULE                                   │  │
│  │                                                                      │  │
│  │   UC10 ── Xem lịch sử phỏng vấn (4 loại + coding)                │  │
│  │   UC11 ── Xem chi tiết một bài phỏng vấn                          │  │
│  │   UC12 ── Xem biểu đồ xu hướng điểm                               │  │
│  │   UC13 ── Xem phân tích điểm yếu                                  │  │
│  │   UC14 ── Xem heatmap hoạt động                                    │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                  USER MANAGEMENT MODULE                             │  │
│  │                                                                      │  │
│  │   UC15 ── Xem & cập nhật hồ sơ cá nhân                            │  │
│  │   UC16 ── Đổi mật khẩu                                             │  │
│  │   UC17 ── Cài đặt giao diện (Dark/Light mode)                     │  │
│  │   UC18 ── Cài đặt ngôn ngữ (VI/EN)                                │  │
│  │   UC19 ── Xem hướng dẫn & FAQ                                     │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                  ADMIN MODULE                                        │  │
│  │                                                                      │  │
│  │   UC20 ── Dashboard tổng quan hệ thống                             │  │
│  │   UC21 ── Quản lý người dùng (CRUD, phân quyền, reset pass)       │  │
│  │   UC22 ── Quản lý lịch sử phỏng vấn toàn hệ thống                │  │
│  │   UC23 ── Quản lý ngân hàng câu hỏi (Question Bank)               │  │
│  │   UC24 ── Import/Export câu hỏi từ Excel                           │  │
│  │   UC25 ── Quản lý bộ đề thi (Exam Sets)                           │  │
│  │   UC26 ── Giám sát Token Usage AI                                  │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘

    ▲                          ▲                          ▲
    │                          │                          │
┌───┴────┐              ┌─────┴─────┐              ┌─────┴─────┐
│ Guest  │              │ Registered │              │   Admin   │
└────────┘              │    User    │              └───────────┘
UC01, UC03              └────────────┘              UC01–UC26
UC04 (bước 1)           UC01–UC19
```

---

## 3. Chi Tiết Từng Use Case

### 🔐 UC01 – Đăng Ký Tài Khoản

| Thông tin          | Nội dung                                                      |
| ------------------ | ------------------------------------------------------------- |
| **Actor**          | Guest                                                         |
| **Mô tả**          | Guest điền form đăng ký (username, fullName, email, password) |
| **Tiền điều kiện** | Chưa có tài khoản với email đó                                |
| **Kết quả**        | Tài khoản được tạo (chưa xác thực), OTP gửi về email          |
| **Liên quan**      | UC02 (xác thực email tiếp theo)                               |

---

### 📧 UC02 – Xác Thực Email (OTP)

| Thông tin          | Nội dung                                                 |
| ------------------ | -------------------------------------------------------- |
| **Actor**          | Guest / Registered User                                  |
| **Mô tả**          | Nhập mã OTP 6 chữ số gửi về email để kích hoạt tài khoản |
| **Tiền điều kiện** | Đã thực hiện UC01                                        |
| **Kết quả**        | `isVerified = true`, có thể đăng nhập                    |

---

### 🔑 UC03 – Đăng Nhập

| Thông tin          | Nội dung                                                                |
| ------------------ | ----------------------------------------------------------------------- |
| **Actor**          | Guest                                                                   |
| **Mô tả**          | Nhập email + password, hệ thống trả về JWT access token + refresh token |
| **Tiền điều kiện** | Tài khoản đã xác thực email                                             |
| **Kết quả**        | JWT token lưu vào localStorage, chuyển đến `/welcome`                   |

---

### 🔓 UC04 – Quên / Reset Mật Khẩu

| Thông tin   | Nội dung                                                |
| ----------- | ------------------------------------------------------- |
| **Actor**   | Guest                                                   |
| **Mô tả**   | Nhập email → nhận OTP → xác thực → đặt mật khẩu mới     |
| **Kết quả** | Mật khẩu được cập nhật, người dùng có thể đăng nhập lại |

---

### 🎤 UC05 – Phỏng Vấn Tiêu Chuẩn

| Thông tin          | Nội dung                                                                                 |
| ------------------ | ---------------------------------------------------------------------------------------- |
| **Actor**          | Registered User, AI System                                                               |
| **Mô tả**          | User chọn topic và độ khó → AI sinh MCQ + tự luận → User trả lời → AI chấm → Xem kết quả |
| **Tiền điều kiện** | Đã đăng nhập                                                                             |
| **Kết quả**        | Bài phỏng vấn được lưu vào `interviewresults`                                            |

---

### 📄 UC06 – Phỏng Vấn Theo CV

| Thông tin          | Nội dung                                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------------------------- |
| **Actor**          | Registered User, AI System                                                                                  |
| **Mô tả**          | User upload CV PDF → AI extract text và phân tích kỹ năng → sinh câu hỏi từ CV → User trả lời → Lưu kết quả |
| **Tiền điều kiện** | Đã đăng nhập, có file CV PDF                                                                                |
| **Kết quả**        | CV Interview Session lưu vào `cvinterviewsessions`                                                          |

---

### 🤖 UC07 – Phỏng Vấn Thích Ứng

| Thông tin          | Nội dung                                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| **Actor**          | Registered User, AI System                                                                                                |
| **Mô tả**          | AI sinh câu hỏi → User trả lời → AI đánh giá và điều chỉnh độ khó → lặp lại đến khi kết thúc session → Tổng kết + Roadmap |
| **Tiền điều kiện** | Đã đăng nhập                                                                                                              |
| **Kết quả**        | Adaptive Session lưu vào `adaptivesessions`                                                                               |

---

### 💻 UC08 – Live Coding

| Thông tin          | Nội dung                                                                                                          |
| ------------------ | ----------------------------------------------------------------------------------------------------------------- |
| **Actor**          | Registered User, AI System                                                                                        |
| **Mô tả**          | AI sinh bài toán coding → User code trong Monaco Editor → Submit → AI chấm → 3 câu giải thích → Đánh giá tổng hợp |
| **Tiền điều kiện** | Đã đăng nhập                                                                                                      |
| **Kết quả**        | LiveCoding Session lưu vào `livecodingsessions`                                                                   |

---

### 📝 UC09 – Làm Bài Thi Exam Sets

| Thông tin          | Nội dung                                                                                                  |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| **Actor**          | Registered User                                                                                           |
| **Mô tả**          | User duyệt danh sách bộ đề → chọn bộ đề → trả lời MCQ → Submit → Xem kết quả (điểm, đúng/sai, giải thích) |
| **Tiền điều kiện** | Đã đăng nhập, bộ đề đã được admin tạo và kích hoạt                                                        |
| **Kết quả**        | Kết quả bài thi được tính điểm, lưu UserProgress                                                          |

---

### 📊 UC10–UC14 – History & Analytics

| UC   | Mô Tả                                                               |
| ---- | ------------------------------------------------------------------- |
| UC10 | Xem danh sách lịch sử theo loại (Standard / CV / Adaptive / Coding) |
| UC11 | Click vào một bài → xem chi tiết câu hỏi, đáp án, điểm              |
| UC12 | Biểu đồ xu hướng điểm theo thời gian (PerformanceTrendChart)        |
| UC13 | Phân tích chủ đề yếu, gợi ý cải thiện (WeaknessAnalysis)            |
| UC14 | Heatmap hoạt động hàng ngày tương tự GitHub (ActivityCalendar)      |

---

### 👤 UC15–UC19 – User Management

| UC   | Mô Tả                                           |
| ---- | ----------------------------------------------- |
| UC15 | Xem & cập nhật thông tin cá nhân, đổi avatar    |
| UC16 | Đổi mật khẩu (cần nhập mật khẩu hiện tại)       |
| UC17 | Bật/tắt Dark mode (persistent qua localStorage) |
| UC18 | Chuyển ngôn ngữ VI ↔ EN (i18next)               |
| UC19 | Xem FAQ và hướng dẫn sử dụng từng tính năng     |

---

### 🛡️ UC20–UC26 – Admin Module

| UC   | Mô Tả                                                                        |
| ---- | ---------------------------------------------------------------------------- |
| UC20 | Dashboard: thống kê users, bài phỏng vấn gần đây, tổng quan hệ thống         |
| UC21 | Quản lý Users: danh sách, chi tiết, phân quyền, reset password, xóa          |
| UC22 | Quản lý lịch sử phỏng vấn: Standard, CV, Adaptive, Live Coding (xem/xóa)     |
| UC23 | Quản lý Question Bank: tạo, sửa, xóa câu hỏi MCQ (theo programming language) |
| UC24 | Import câu hỏi từ Excel (.xlsx) / Export ra Excel                            |
| UC25 | Quản lý Exam Sets: tạo bộ đề, thêm/xóa câu hỏi vào bộ đề, kích hoạt/vô hiệu  |
| UC26 | Giám sát Token AI: xem token hôm nay, lịch sử token theo ngày/feature        |

---

## 4. Phạm Vi Hệ Thống (System Boundary)

**Trong phạm vi (In-scope):**

- Toàn bộ 26 Use Case trên

**Ngoài phạm vi (Out-of-scope) – v1:**

- Tính năng phỏng vấn nhóm / real-time
- Tích hợp video call
- Thanh toán / subscription
- Thống kê chi tiết cho Exam Sets (leaderboard, ranking)
