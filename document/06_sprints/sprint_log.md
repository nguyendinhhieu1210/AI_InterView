# 📅 Sprint Log – AI InterView

> **Ghi chú:** File này ghi lại tóm tắt mục tiêu, kết quả, và retrospective của từng Sprint.

---

## 🏁 Sprint 0 – Thiết Lập Nền Tảng

**Thời gian:** Tháng 5/2026  
**Mục tiêu:** Thiết lập nền tảng dự án, xác định phạm vi ban đầu, và xây dựng bộ tài liệu cơ bản để cả team hiểu chung.

### 1. Product Backlog ban đầu

- Sinh viên cùng mentor thảo luận để:
  - Hiểu rõ mục tiêu dự án.
  - Xác định các nhóm chức năng chính (Epic) của hệ thống.
- BA xây dựng **Product Backlog ban đầu** ở mức chức năng lớn, chưa cần chi tiết từng User Story.
- Product Backlog ban đầu dùng để:
  - Lập kế hoạch Sprint tiếp theo.
  - Điều chỉnh phạm vi dự án trong quá trình thực hiện.
  - Thiết lập base dự án, tránh làm việc trùng lặp.

### 2. Tài liệu cần thiết cho dự án

Team và mentor thỏa thuận lựa chọn các tài liệu phù hợp. Các tài liệu nên có:

- **Biểu đồ Use Case tổng quát**
  - Mục đích: hiểu rõ hệ thống có chức năng gì và ai sử dụng.
  - Không nhất thiết phải chi tiết từng luồng.

- **Thiết kế ERD ban đầu**
  - Mục đích: hình dung cấu trúc dữ liệu chính.
  - Chỉ cần ở mức khung, có thể điều chỉnh trong sprint.

- **Kiến trúc hệ thống**
  - Mô tả luồng dữ liệu, các thành phần frontend/backend, và cách chúng tương tác.

- **UI/UX Style Guideline**
  - Màu sắc, font chữ, layout cơ bản.
  - Giúp thiết kế và phát triển giao diện nhất quán.

- **Coding Convention**
  - Quy tắc đặt tên biến, hàm, folder.
  - Quy tắc commit và quy ước branch Git.
  - Làm cơ sở để tạo cấu hình lint cho frontend/backend.

> Những tài liệu này không cần hoàn hảo, nhưng phải đủ để toàn bộ team hiểu và làm việc đồng bộ.

### 3. Thiết lập base dự án

Trong Sprint 0, team cần hoàn thành:

#### 3.1 Base Design
- Thiết kế wireframe hoặc mockup cơ bản.
- Thể hiện bố cục chính và luồng người dùng.

#### 3.2 Base Frontend
- Khởi tạo project frontend.
- Thiết lập cấu trúc thư mục.
- Tích hợp thư viện cần thiết.
- Áp dụng UI/UX guideline đã thống nhất.

#### 3.3 Base Backend
- Khởi tạo project backend.
- Thiết lập cấu trúc source code.
- Kết nối database.
- Chuẩn bị các module cơ bản (auth, config,... nếu cần).

#### 3.4 Git và quy trình làm việc
- Tạo repository Git.
- Thống nhất cách tạo branch.
- Thống nhất quy tắc commit.
- Thống nhất quy trình merge code.

### 4. Kết quả Sprint 0

| Hạng mục | Nội dung | Kết quả |
|---|---|---|
| Product Backlog | Xác định các Epic & phạm vi chính | ✅ Hoàn thành |
| Use Case | Biểu đồ Use Case tổng quát | ✅ Hoàn thành |
| ERD | Database schema khung | ✅ Hoàn thành |
| System Architecture | Kiến trúc tổng thể | ✅ Hoàn thành |
| UI/UX Guideline | Màu sắc, font, bố cục cơ bản | ✅ Hoàn thành |
| Coding Convention | Quy ước code & Git | ✅ Hoàn thành |
| Base Frontend | Khởi tạo frontend + cấu trúc | ✅ Hoàn thành |
| Base Backend | Khởi tạo backend + kết nối DB | ✅ Hoàn thành |
| Git Flow | Repository, branch, commit | ✅ Hoàn thành |
| Tài liệu dự án | Thư mục `document/` | ✅ Hoàn thành |

### Retrospective Sprint 0

**Điểm mạnh:**
- Tài liệu giai đoạn đầu đã được chuẩn hóa.
- Quy trình Git và workflow được thiết lập rõ.
- Team có chung nhận thức về scope và công nghệ.

**Cần cải thiện:**
- Bổ sung wireframe/mockup giao diện rõ hơn.
- Chi tiết thêm database schema ở cấp collection.

---

## 🚀 Sprint 1 – Xác Thực Người Dùng

**Thời gian:** _(Điền khi bắt đầu sprint)_  
**Goal:** Hoàn thiện toàn bộ luồng Authentication (Đăng ký → OTP → Đăng nhập → Reset mật khẩu)

### User Stories

| ID | User Story | Story Points | Kết Quả |
|---|---|---|---|
| EP1-1 | Đăng ký tài khoản | 3 | ✅ |
| EP1-2 | Xác thực email OTP | 5 | ✅ |
| EP1-3 | Đăng nhập → JWT | 3 | ✅ |
| EP1-4 | Quên / Reset mật khẩu | 5 | ✅ |
| EP1-5 | Xem & sửa hồ sơ cá nhân | 3 | ✅ |
| EP1-6 | Đổi mật khẩu | 2 | ✅ |
| EP1-7 | ProtectedRoute frontend | 2 | ✅ |

### Retrospective Sprint 1

**Điều tốt:** _(Điền sau sprint)_  
**Điều cần cải thiện:** _(Điền sau sprint)_

---

## 🚀 Sprint 2 – Standard Interview

**Thời gian:** _(Điền khi bắt đầu sprint)_  
**Goal:** Hoàn thiện luồng phỏng vấn tiêu chuẩn (chọn topic → AI sinh câu → trả lời → chấm điểm)

### User Stories

| ID | User Story | Story Points | Kết Quả |
|---|---|---|---|
| EP2-1 | Chọn chủ đề phỏng vấn | 3 | ✅ |
| EP2-2 | Chọn độ khó | 1 | ✅ |
| EP2-3 | AI sinh 5 MCQ + 5 tự luận | 8 | ✅ |
| EP2-4 | Giao diện phòng phỏng vấn | 8 | ✅ |
| EP2-5 | AI chấm điểm | 8 | ✅ |
| EP2-6 | Hiển thị kết quả (Modal) | 5 | ✅ |
| EP2-7 | Lưu kết quả database | 3 | ✅ |

### Retrospective Sprint 2

**Điều tốt:** _(Điền sau sprint)_  
**Điều cần cải thiện:** _(Điền sau sprint)_

---

## 🚀 Sprint 3 – CV Interview

**Thời gian:** _(Điền khi bắt đầu sprint)_  
**Goal:** Luồng phỏng vấn dựa trên CV (upload → phân tích kỹ năng → sinh câu hỏi → chấm)

### User Stories

| ID | User Story | Story Points | Kết Quả |
|---|---|---|---|
| EP3-1 | Upload file CV (PDF ≤5MB) | 3 | ✅ |
| EP3-2 | Backend extract PDF text | 5 | ✅ |
| EP3-3 | AI phân tích kỹ năng | 8 | ✅ |
| EP3-4 | CVInfoModal hiển thị kỹ năng | 5 | ✅ |
| EP3-5 | Sinh câu hỏi từ CV | 8 | ✅ |
| EP3-6 | Phỏng vấn + chấm điểm | 8 | ✅ |
| EP3-7 | Lưu CVInterviewSession | 3 | ✅ |

### Retrospective Sprint 3

**Điều tốt:** _(Điền sau sprint)_  
**Điều cần cải thiện:** _(Điền sau sprint)_

---

## 🚀 Sprint 4 – History & Analytics

**Thời gian:** _(Điền khi bắt đầu sprint)_  
**Goal:** Hệ thống lịch sử, biểu đồ tiến độ, phân tích điểm yếu

### User Stories

| ID | User Story | Story Points | Kết Quả |
|---|---|---|---|
| EP6-1 | Lịch sử Standard Interview | 5 | ✅ |
| EP6-2 | Lịch sử CV Interview | 5 | ✅ |
| EP6-3 | Lịch sử Adaptive Interview | 5 | ✅ |
| EP6-4 | Trang tổng hợp lịch sử | 5 | ✅ |
| EP6-5 | PerformanceTrendChart | 8 | ✅ |
| EP6-6 | ActivityCalendar (heatmap) | 5 | ✅ |
| EP6-7 | WeaknessAnalysis | 8 | ✅ |

### Retrospective Sprint 4

**Điều tốt:** _(Điền sau sprint)_  
**Điều cần cải thiện:** _(Điền sau sprint)_

---

## 🚀 Sprint 5 – Adaptive Interview

**Thời gian:** _(Điền khi bắt đầu sprint)_  
**Goal:** Phỏng vấn thích ứng – AI tự điều chỉnh độ khó theo năng lực người dùng

| ID | User Story | Story Points | Kết Quả |
|---|---|---|---|
| EP4-1 | Bắt đầu session adaptive | 3 | ✅ |
| EP4-2 | AI sinh câu đầu tiên | 5 | ✅ |
| EP4-3 | AI đánh giá real-time | 8 | ✅ |
| EP4-4 | Điều chỉnh độ khó động | 8 | ✅ |
| EP4-5 | Tổng kết session | 5 | ✅ |
| EP4-6 | Lưu AdaptiveSession | 3 | ✅ |

---

## 🚀 Sprint 6 – Live Coding

**Thời gian:** Sprint 6 (Live Coding)
**Goal:** Xây dựng quy trình Live Coding đầy đủ: chọn ngôn ngữ → chọn domain/topic → sinh đề code → viết code trên Monaco Editor → AI chấm code + hỏi giải thích → lưu kết quả session

| ID | User Story | Story Points | Kết Quả |
|---|---|---|---|
| EP5-1 | Tạo session Live Coding theo ngôn ngữ và trả về danh sách domains | 5 | ✅ |
| EP5-2 | Chọn domain và lấy danh sách topics tương ứng | 5 | ✅ |
| EP5-3 | Chọn topic + difficulty và sinh câu hỏi code bằng AI | 8 | ✅ |
| EP5-4 | Tích hợp Monaco Editor và submit code qua API | 5 | ✅ |
| EP5-5 | AI đánh giá code, chuyển sang chuỗi câu hỏi giải thích (explain flow) | 8 | ✅ |
| EP5-6 | Lưu LiveCodingSession với codeHistory cuối chu kỳ và hỗ trợ câu hỏi code tiếp theo | 5 | ✅ |

**Các điểm đã làm:**
- Backend `liveCodingController` hiện lưu session và xử lý toàn bộ luồng: tạo session, chọn domain/topic, submit code, submit giải thích, lấy câu hỏi hiện tại và làm mới bài code.
- `codeEvaluationService` dùng AI để chấm code trả về `correct`/`feedback` và có fallback khi API AI lỗi.
- Frontend có `TopicSelection` để khởi tạo session, chọn ngôn ngữ/domain/topic/difficulty.
- `CodingInterface` sử dụng Monaco Editor và hiển thị bài toán, input/output mẫu, feedback, giải thích và chuyển đổi sang bài code mới.
- Luồng hoàn chỉnh: khi code đúng thì yêu cầu giải thích tiếp, cuối chu kỳ đánh giá tổng thể và ghi `codeHistory` trong `LiveCodingSession`.

## 🚀 Sprint 7 – UX Polish & Settings

**Thời gian:** _(Điền khi bắt đầu sprint)_  
**Goal:** Hoàn thiện cài đặt, đa ngôn ngữ, và UX tổng thể

| ID | User Story | Story Points | Kết Quả |
|---|---|---|---|
| EP7-1 | Dark/Light mode | 3 | ✅ |
| EP7-2 | Đa ngôn ngữ VI/EN (i18n) | 5 | ✅ |
| EP7-3 | HelpSupportPage + FAQ | 5 | ✅ |
| EP7-4 | Cài đặt thông báo | 2 | ✅ |

---

## 📈 Velocity Summary

| Sprint | Story Points Planned | Story Points Done | Velocity |
|---|---|---|---|
| Sprint 0 | - | - | Setup |
| Sprint 1 | 23 | 23 | 100% |
| Sprint 2 | 36 | 36 | 100% |
| Sprint 3 | 40 | 40 | 100% |
| Sprint 4 | 41 | 41 | 100% |
| Sprint 5 | 32 | 32 | 100% |
| Sprint 6 | 29 | 29 | 100% |
| Sprint 7 | 18 | 18 | 100% |

> **Tổng cộng:** 219 Story Points | **Thời gian:** Sprint 0 + 7 Sprints
