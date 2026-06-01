# 🎭 Biểu Đồ Use Case – AI InterView

> **Mức độ:** Tổng quát (không yêu cầu chi tiết từng luồng)  
> **Mục đích:** Giúp team hiểu hệ thống có những chức năng gì, ai sử dụng

---

## 1. Các Actor

| Actor | Mô Tả |
|---|---|
| **Guest** | Người chưa đăng nhập – chỉ truy cập được trang đăng ký/đăng nhập |
| **Registered User** | Người dùng đã đăng ký và xác thực email – có toàn quyền sử dụng hệ thống |
| **AI System** | Thành phần AI nội bộ (Groq/Gemini) – tự động sinh câu hỏi, chấm điểm |
| **Email Service** | Dịch vụ gửi email OTP (Nodemailer + Gmail) |

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
│  │   UC03 ── Đăng nhập                                                │  │
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
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                  ANALYTICS MODULE                                   │  │
│  │                                                                      │  │
│  │   UC09 ── Xem lịch sử phỏng vấn                                   │  │
│  │   UC10 ── Xem chi tiết một bài phỏng vấn                          │  │
│  │   UC11 ── Xem biểu đồ xu hướng điểm                               │  │
│  │   UC12 ── Xem phân tích điểm yếu                                  │  │
│  │   UC13 ── Xem heatmap hoạt động                                    │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                  USER MANAGEMENT MODULE                             │  │
│  │                                                                      │  │
│  │   UC14 ── Xem & cập nhật hồ sơ cá nhân                            │  │
│  │   UC15 ── Đổi mật khẩu                                             │  │
│  │   UC16 ── Cài đặt giao diện (Dark/Light mode)                     │  │
│  │   UC17 ── Cài đặt ngôn ngữ (VI/EN)                                │  │
│  │   UC18 ── Xem hướng dẫn & FAQ                                     │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘

        ▲                               ▲
        │                               │
   ┌────┴────┐                    ┌─────┴─────┐
   │  Guest  │                    │ Registered │
   └─────────┘                    │    User    │
   UC01, UC03                     └────────────┘
   UC04 (bước 1)                  UC01–UC18
```

---

## 3. Chi Tiết Từng Use Case

### 🔐 UC01 – Đăng Ký Tài Khoản

| Thông tin | Nội dung |
|---|---|
| **Actor** | Guest |
| **Mô tả** | Guest điền form đăng ký (username, fullName, email, password) |
| **Tiền điều kiện** | Chưa có tài khoản với email đó |
| **Kết quả** | Tài khoản được tạo (chưa xác thực), OTP gửi về email |
| **Liên quan** | UC02 (xác thực email tiếp theo) |

---

### 📧 UC02 – Xác Thực Email (OTP)

| Thông tin | Nội dung |
|---|---|
| **Actor** | Guest / Registered User |
| **Mô tả** | Nhập mã OTP 6 chữ số gửi về email để kích hoạt tài khoản |
| **Tiền điều kiện** | Đã thực hiện UC01 |
| **Kết quả** | `isVerified = true`, có thể đăng nhập |

---

### 🔑 UC03 – Đăng Nhập

| Thông tin | Nội dung |
|---|---|
| **Actor** | Guest |
| **Mô tả** | Nhập email + password, hệ thống trả về JWT token |
| **Tiền điều kiện** | Tài khoản đã xác thực email |
| **Kết quả** | JWT token lưu vào localStorage, chuyển đến `/welcome` |

---

### 🔓 UC04 – Quên / Reset Mật Khẩu

| Thông tin | Nội dung |
|---|---|
| **Actor** | Guest |
| **Mô tả** | Nhập email → nhận OTP → xác thực → đặt mật khẩu mới |
| **Kết quả** | Mật khẩu được cập nhật, người dùng có thể đăng nhập lại |

---

### 🎤 UC05 – Phỏng Vấn Tiêu Chuẩn

| Thông tin | Nội dung |
|---|---|
| **Actor** | Registered User, AI System |
| **Mô tả** | User chọn topic và độ khó → AI sinh 5 MCQ + 5 tự luận → User trả lời → AI chấm → Xem kết quả |
| **Tiền điều kiện** | Đã đăng nhập |
| **Kết quả** | Bài phỏng vấn được lưu vào `interviewresults` |

---

### 📄 UC06 – Phỏng Vấn Theo CV

| Thông tin | Nội dung |
|---|---|
| **Actor** | Registered User, AI System |
| **Mô tả** | User upload CV PDF → AI extract text và phân tích kỹ năng → sinh câu hỏi từ CV → User trả lời → Lưu kết quả |
| **Tiền điều kiện** | Đã đăng nhập, có file CV PDF |
| **Kết quả** | CV Interview Session lưu vào `cvinterviewsessions` |

---

### 🤖 UC07 – Phỏng Vấn Thích Ứng

| Thông tin | Nội dung |
|---|---|
| **Actor** | Registered User, AI System |
| **Mô tả** | AI sinh câu hỏi → User trả lời → AI đánh giá và điều chỉnh độ khó → lặp lại đến khi kết thúc session |
| **Tiền điều kiện** | Đã đăng nhập |
| **Kết quả** | Adaptive Session lưu vào `adaptivesessions` |

---

### 💻 UC08 – Live Coding

| Thông tin | Nội dung |
|---|---|
| **Actor** | Registered User, AI System |
| **Mô tả** | AI sinh bài toán coding → User code trong Monaco Editor → Submit → AI chấm điểm |
| **Tiền điều kiện** | Đã đăng nhập |
| **Kết quả** | LiveCoding Session lưu vào `livecodingsessions` |

---

### 📊 UC09–UC13 – History & Analytics

| UC | Mô Tả |
|---|---|
| UC09 | Xem danh sách lịch sử theo loại (Standard / CV / Adaptive) |
| UC10 | Click vào một bài → xem chi tiết câu hỏi, đáp án, điểm |
| UC11 | Biểu đồ xu hướng điểm theo thời gian (PerformanceTrendChart) |
| UC12 | Phân tích chủ đề yếu, gợi ý cải thiện (WeaknessAnalysis) |
| UC13 | Heatmap hoạt động hàng ngày tương tự GitHub (ActivityCalendar) |

---

### 👤 UC14–UC18 – User Management

| UC | Mô Tả |
|---|---|
| UC14 | Xem & cập nhật thông tin cá nhân, đổi avatar |
| UC15 | Đổi mật khẩu (cần nhập mật khẩu hiện tại) |
| UC16 | Bật/tắt Dark mode (persistent qua localStorage) |
| UC17 | Chuyển ngôn ngữ VI ↔ EN (i18next) |
| UC18 | Xem FAQ và hướng dẫn sử dụng từng tính năng |

---

## 4. Phạm Vi Hệ Thống (System Boundary)

**Trong phạm vi (In-scope):**
- Toàn bộ 18 Use Case trên

**Ngoài phạm vi (Out-of-scope) – v1:**
- Admin dashboard quản lý người dùng
- Tính năng phỏng vấn nhóm / real-time
- Tích hợp video call
- Thanh toán / subscription
