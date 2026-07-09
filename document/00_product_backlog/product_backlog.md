# 📋 Product Backlog – AI InterView

> **Phiên bản:** 2.0  
> **Ngày cập nhật:** 2026-07-09  
> **Trạng thái:** Sprint 9 – Hoàn thiện tính năng Exam Sets & Question Bank  
> **Ghi chú:** Backlog ở mức Epic/Feature lớn. Chi tiết từng User Story sẽ được làm rõ trong từng Sprint.

---

## 1. Mục Tiêu Dự Án

**AI InterView** là nền tảng phỏng vấn thử thông minh hỗ trợ AI, giúp người dùng:

- Luyện tập kỹ năng phỏng vấn kỹ thuật theo nhiều hình thức
- Nhận đánh giá và feedback tự động từ AI
- Theo dõi tiến độ và phân tích điểm yếu để cải thiện
- Luyện tập với bộ đề thi MCQ do admin tạo sẵn (Question Bank & Exam Sets)

---

## 2. Các Actor (Người Dùng)

| Actor                            | Mô tả                                                         |
| -------------------------------- | ------------------------------------------------------------- |
| **Guest (Khách)**                | Người chưa đăng ký / chưa đăng nhập                           |
| **Registered User (Người dùng)** | Đã đăng ký và xác thực email                                  |
| **Admin (Quản trị viên)**        | Quản trị hệ thống, quản lý users, câu hỏi, bộ đề, xem lịch sử |

---

## 3. Product Backlog – Mức Epic

### 🔐 EPIC 1: Xác Thực & Quản Lý Tài Khoản

**Mô tả:** Toàn bộ luồng đăng ký, đăng nhập, xác thực email, và quản lý hồ sơ cá nhân.

**Priority:** 🔴 Cao (Must Have)

| ID    | Feature / User Story                                    | Ước Tính | Trạng Thái |
| ----- | ------------------------------------------------------- | -------- | ---------- |
| EP1-1 | Đăng ký tài khoản (username, fullName, email, password) | M        | ✅ Done    |
| EP1-2 | Xác thực email bằng OTP 6 chữ số                        | M        | ✅ Done    |
| EP1-3 | Đăng nhập bằng email + password → JWT token             | M        | ✅ Done    |
| EP1-4 | Quên mật khẩu → OTP → Reset password                    | M        | ✅ Done    |
| EP1-5 | Xem & chỉnh sửa hồ sơ cá nhân (fullName, avatar)        | S        | ✅ Done    |
| EP1-6 | Đổi mật khẩu khi đã đăng nhập                           | S        | ✅ Done    |
| EP1-7 | Bảo vệ route frontend (ProtectedRoute)                  | M        | ✅ Done    |
| EP1-8 | Refresh Token – tự động gia hạn JWT khi hết hạn         | M        | ✅ Done    |

---

### 🎤 EPIC 2: Phỏng Vấn Tiêu Chuẩn (Standard Interview)

**Mô tả:** Người dùng chọn chủ đề & độ khó, AI sinh câu hỏi MCQ + tự luận, chấm điểm và lưu kết quả.

**Priority:** 🔴 Cao (Must Have)

| ID    | Feature / User Story                                      | Ước Tính | Trạng Thái |
| ----- | --------------------------------------------------------- | -------- | ---------- |
| EP2-1 | Chọn chủ đề phỏng vấn (HTML, CSS, JS, React, Node, ...)   | M        | ✅ Done    |
| EP2-2 | Chọn độ khó (easy / medium / hard)                        | S        | ✅ Done    |
| EP2-3 | AI sinh câu hỏi MCQ + tự luận theo chủ đề                 | L        | ✅ Done    |
| EP2-4 | Giao diện phòng phỏng vấn trả lời từng câu                | L        | ✅ Done    |
| EP2-5 | AI chấm điểm MCQ tự động + chấm tự luận                   | L        | ✅ Done    |
| EP2-6 | Hiển thị kết quả (EvaluationModal / InterviewReportModal) | M        | ✅ Done    |
| EP2-7 | Lưu kết quả vào database (InterviewResult)                | M        | ✅ Done    |

---

### 📄 EPIC 3: Phỏng Vấn Theo CV (CV Interview)

**Mô tả:** Người dùng upload CV (PDF), AI phân tích kỹ năng và sinh câu hỏi phỏng vấn phù hợp.

**Priority:** 🔴 Cao (Must Have)

| ID    | Feature / User Story                              | Ước Tính | Trạng Thái |
| ----- | ------------------------------------------------- | -------- | ---------- |
| EP3-1 | Upload file CV (PDF, tối đa 5MB)                  | M        | ✅ Done    |
| EP3-2 | Backend extract text từ PDF (pdf-parse)           | M        | ✅ Done    |
| EP3-3 | AI phân tích kỹ năng: Frontend / Backend / Theory | L        | ✅ Done    |
| EP3-4 | Hiển thị kỹ năng trích xuất (CVInfoModal)         | M        | ✅ Done    |
| EP3-5 | Sinh câu hỏi dựa trên kỹ năng trong CV            | L        | ✅ Done    |
| EP3-6 | Phòng phỏng vấn CV, nộp bài, AI chấm điểm         | L        | ✅ Done    |
| EP3-7 | Lưu CV Interview Session vào database             | M        | ✅ Done    |

---

### 🤖 EPIC 4: Phỏng Vấn Thích Ứng (Adaptive Interview)

**Mô tả:** AI tự động điều chỉnh độ khó câu hỏi dựa trên hiệu suất trả lời của người dùng trong session.

**Priority:** 🟡 Trung bình (Should Have)

| ID    | Feature / User Story                               | Ước Tính | Trạng Thái |
| ----- | -------------------------------------------------- | -------- | ---------- |
| EP4-1 | Bắt đầu session adaptive (chọn chủ đề)             | M        | ✅ Done    |
| EP4-2 | AI sinh câu hỏi đầu tiên theo độ khó ban đầu       | M        | ✅ Done    |
| EP4-3 | Người dùng trả lời → AI đánh giá ngay              | L        | ✅ Done    |
| EP4-4 | AI điều chỉnh độ khó câu tiếp theo (tăng/giảm)     | L        | ✅ Done    |
| EP4-5 | Kết thúc session → Tổng kết điểm + Roadmap học tập | M        | ✅ Done    |
| EP4-6 | Lưu AdaptiveSession vào database                   | M        | ✅ Done    |

---

### 💻 EPIC 5: Luyện Tập Live Coding

**Mô tả:** Người dùng được giao bài toán lập trình, giải trong Monaco Editor, và nhận kết quả đánh giá.

**Priority:** 🟡 Trung bình (Should Have)

| ID    | Feature / User Story                                            | Ước Tính | Trạng Thái |
| ----- | --------------------------------------------------------------- | -------- | ---------- |
| EP5-1 | AI sinh bài toán coding (theo ngôn ngữ, domain, topic & độ khó) | L        | ✅ Done    |
| EP5-2 | Monaco Editor tích hợp trong trình duyệt                        | L        | ✅ Done    |
| EP5-3 | Hỗ trợ nhiều ngôn ngữ lập trình                                 | M        | ✅ Done    |
| EP5-4 | AI chấm điểm code + 3 câu hỏi giải thích + feedback             | L        | ✅ Done    |
| EP5-5 | Lưu LiveCodingSession vào database (có userId)                  | M        | ✅ Done    |
| EP5-6 | Xem lịch sử coding (CodingHistoryPage, CodingHistoryDetailPage) | M        | ✅ Done    |

---

### 📊 EPIC 6: Lịch Sử & Phân Tích (History & Analytics)

**Mô tả:** Xem lại toàn bộ lịch sử phỏng vấn, phân tích xu hướng điểm số, và xác định điểm yếu cần cải thiện.

**Priority:** 🔴 Cao (Must Have)

| ID    | Feature / User Story                                  | Ước Tính | Trạng Thái |
| ----- | ----------------------------------------------------- | -------- | ---------- |
| EP6-1 | Lịch sử Standard Interview (danh sách + chi tiết)     | M        | ✅ Done    |
| EP6-2 | Lịch sử CV Interview (danh sách + chi tiết)           | M        | ✅ Done    |
| EP6-3 | Lịch sử Adaptive Interview (danh sách + chi tiết)     | M        | ✅ Done    |
| EP6-4 | Lịch sử Live Coding (danh sách + chi tiết)            | M        | ✅ Done    |
| EP6-5 | Trang tổng hợp toàn bộ lịch sử (InterviewHistoryPage) | M        | ✅ Done    |
| EP6-6 | Biểu đồ xu hướng điểm (PerformanceTrendChart)         | L        | ✅ Done    |
| EP6-7 | Heatmap hoạt động hàng ngày (ActivityCalendar)        | M        | ✅ Done    |
| EP6-8 | Phân tích điểm yếu theo chủ đề (WeaknessAnalysis)     | L        | ✅ Done    |

---

### ⚙️ EPIC 7: Cài Đặt & Trải Nghiệm Người Dùng

**Mô tả:** Các tính năng cá nhân hóa: dark mode, đa ngôn ngữ, hỗ trợ.

**Priority:** 🟢 Thấp (Nice to Have)

| ID    | Feature / User Story                      | Ước Tính | Trạng Thái |
| ----- | ----------------------------------------- | -------- | ---------- |
| EP7-1 | Chuyển đổi Dark / Light mode              | S        | ✅ Done    |
| EP7-2 | Đa ngôn ngữ Tiếng Việt / Tiếng Anh (i18n) | M        | ✅ Done    |
| EP7-3 | Trang hỗ trợ & FAQ (HelpSupportPage)      | M        | ✅ Done    |
| EP7-4 | Cài đặt thông báo email                   | S        | ✅ Done    |

---

### 🏗️ EPIC 8: Hạ Tầng & DevOps (Sprint 0 – Base)

**Mô tả:** Thiết lập nền tảng kỹ thuật, repository, và môi trường phát triển.

**Priority:** 🔴 Cao (Must Have – Sprint 0)

| ID    | Feature / User Story                                 | Ước Tính | Trạng Thái |
| ----- | ---------------------------------------------------- | -------- | ---------- |
| EP8-1 | Tạo monorepo (frontend/ + backend/ + document/)      | S        | ✅ Done    |
| EP8-2 | Thiết lập cấu trúc thư mục frontend (CRA + Tailwind) | M        | ✅ Done    |
| EP8-3 | Thiết lập cấu trúc thư mục backend (Express MVC)     | M        | ✅ Done    |
| EP8-4 | Kết nối MongoDB (local & Atlas)                      | M        | ✅ Done    |
| EP8-5 | Cấu hình biến môi trường (.env)                      | S        | ✅ Done    |
| EP8-6 | Thiết lập Git Flow (main/develop/feature)            | S        | ✅ Done    |
| EP8-7 | Xây dựng tài liệu dự án (document/)                  | L        | ✅ Done    |

---

### 🛡️ EPIC 9: Admin Panel – Quản Trị Hệ Thống

**Mô tả:** Hệ thống quản trị dành cho admin để quản lý người dùng, xem lịch sử phỏng vấn toàn hệ thống, giám sát token AI.

**Priority:** 🟡 Trung bình (Should Have)

| ID    | Feature / User Story                                                 | Ước Tính | Trạng Thái |
| ----- | -------------------------------------------------------------------- | -------- | ---------- |
| EP9-1 | AdminLayout (Sidebar + Header + AdminRoute bảo vệ)                   | M        | ✅ Done    |
| EP9-2 | Dashboard tổng quan (thống kê users, recent registrations)           | M        | ✅ Done    |
| EP9-3 | Quản lý Users (danh sách, chi tiết, phân quyền, reset password, xóa) | L        | ✅ Done    |
| EP9-4 | Quản lý Standard Interviews (danh sách, chi tiết, xóa)               | M        | ✅ Done    |
| EP9-5 | Quản lý CV Sessions (danh sách, chi tiết, xóa)                       | M        | ✅ Done    |
| EP9-6 | Quản lý Adaptive Sessions (danh sách, chi tiết, xóa)                 | M        | ✅ Done    |
| EP9-7 | Quản lý Live Coding Sessions (danh sách, chi tiết, xóa)              | M        | ✅ Done    |
| EP9-8 | System Logs & Settings (placeholder)                                 | S        | ✅ Done    |
| EP9-9 | Giám sát Token Usage AI (hôm nay, lịch sử, theo feature)             | M        | ✅ Done    |

---

### 📝 EPIC 10: Question Bank & Exam Sets

**Mô tả:** Admin tạo và quản lý ngân hàng câu hỏi MCQ, tổ chức thành bộ đề thi. User có thể làm bài thi từ bộ đề.

**Priority:** 🟡 Trung bình (Should Have)

| ID     | Feature / User Story                                 | Ước Tính | Trạng Thái |
| ------ | ---------------------------------------------------- | -------- | ---------- |
| EP10-1 | Admin CRUD câu hỏi MCQ (Question Bank)               | L        | ✅ Done    |
| EP10-2 | Import câu hỏi từ file Excel (.xlsx)                 | M        | ✅ Done    |
| EP10-3 | Export câu hỏi ra file Excel                         | M        | ✅ Done    |
| EP10-4 | Admin CRUD bộ đề thi (Exam Sets)                     | L        | ✅ Done    |
| EP10-5 | Admin thêm/xóa câu hỏi trong bộ đề                   | M        | ✅ Done    |
| EP10-6 | User xem danh sách bộ đề (UserExamSetsPage)          | M        | ✅ Done    |
| EP10-7 | User làm bài thi và xem kết quả (UserExamDetailPage) | L        | ✅ Done    |
| EP10-8 | Theo dõi tiến trình học tập (UserProgress model)     | M        | ✅ Done    |

---

## 4. Tóm Tắt Theo MoSCoW

| Độ Ưu Tiên       | Epic                    | Ghi Chú                  |
| ---------------- | ----------------------- | ------------------------ |
| **Must Have**    | EP1, EP2, EP3, EP6, EP8 | Core features – bắt buộc |
| **Should Have**  | EP4, EP5, EP9, EP10     | Quan trọng – nên có      |
| **Nice to Have** | EP7                     | Cải thiện UX             |

---

## 5. Ước Tính T-Shirt Size

| Size           | Ý Nghĩa  |
| -------------- | -------- |
| **S** (Small)  | ≤ 1 ngày |
| **M** (Medium) | 2–3 ngày |
| **L**          | 4–7 ngày |
| **XL**         | > 1 tuần |

---

## 6. Cơ Sở Lập Kế Hoạch Sprint

Dựa vào Product Backlog này, các sprint được lập kế hoạch như sau:

| Sprint       | Nội Dung Chính                                    | Epic |
| ------------ | ------------------------------------------------- | ---- |
| **Sprint 0** | Base setup, tài liệu, Git Flow, kiến trúc nền     | EP8  |
| **Sprint 1** | Authentication hoàn chỉnh                         | EP1  |
| **Sprint 2** | Standard Interview (AI generate + submit + score) | EP2  |
| **Sprint 3** | CV Interview                                      | EP3  |
| **Sprint 4** | History & Analytics                               | EP6  |
| **Sprint 5** | Adaptive Interview                                | EP4  |
| **Sprint 6** | Live Coding                                       | EP5  |
| **Sprint 7** | Settings, i18n, UX polish                         | EP7  |
| **Sprint 8** | Admin Panel (Users, Sessions, Dashboard)          | EP9  |
| **Sprint 9** | Question Bank & Exam Sets                         | EP10 |

> **Lưu ý:** Thứ tự và phạm vi sprint có thể điều chỉnh theo tiến độ thực tế và phản hồi từ mentor.
