# 📅 Nhật Ký Sprint – AI InterView

Tài liệu này chứa tóm tắt tiến độ phát triển dự án qua từng Sprint. Dữ liệu chi tiết về mục tiêu, User Stories, sơ đồ hoạt động, và Retrospective của mỗi Sprint được chia nhỏ thành các tài liệu riêng biệt dưới đây:

---

> **Ghi chú đối chiếu thực tế:** các Sprint từ 0 đến 7 đã tương đối phù hợp với code hiện tại; điểm cần điều chỉnh là Sprint 7 mô tả cài đặt thông báo qua mail hơi quá mức, vì hiện tại tính năng này chỉ được lưu ở frontend bằng `localStorage` và chưa có luồng gửi kết quả phỏng vấn qua email.

## 🚀 Danh Sách Chi Tiết Sprints

- [🏁 **Sprint 0** – Thiết Lập Nền Tảng](file:///d:/DuAnMoi/document/06_sprints/sprint_0.md)
  - *Nội dung:* Xác định Backlog, ERD, Use Case, Coding Convention, khởi tạo Base Frontend & Base Backend.
- [🚀 **Sprint 1** – Xác Thực Người Dùng](file:///d:/DuAnMoi/document/06_sprints/sprint_1.md)
  - *Nội dung:* Đăng ký, xác thực OTP email, đăng nhập JWT, đổi mật khẩu, quản lý hồ sơ (Profile) & ProtectedRoute.
- [🚀 **Sprint 2** – Standard Interview](file:///d:/DuAnMoi/document/06_sprints/sprint_2.md)
  - *Nội dung:* Chọn chủ đề/độ khó, AI sinh 7 MCQ + 3 Essay, phòng phỏng vấn tiêu chuẩn, AI chấm điểm tự luận.
- [🚀 **Sprint 3** – CV Interview](file:///d:/DuAnMoi/document/06_sprints/sprint_3.md)
  - *Nội dung:* Tải lên CV (PDF), trích xuất chữ (`pdf-parse`), phân loại kỹ năng bằng AI, sinh câu hỏi phỏng vấn cá nhân hóa theo CV.
- [🚀 **Sprint 4** – History & Analytics](file:///d:/DuAnMoi/document/06_sprints/sprint_4.md)
  - *Nội dung:* Xem lịch sử bài thi, vẽ biểu đồ đường xu hướng điểm (`recharts`), heatmap tần suất luyện tập, phân tích điểm yếu (Radar chart).
- [🚀 **Sprint 5** – Adaptive Interview](file:///d:/DuAnMoi/document/06_sprints/sprint_5.md)
  - *Nội dung:* Phỏng vấn thích ứng dạng hội thoại (chat-like), AI chấm điểm từng câu và tự động tăng/giảm độ khó thời gian thực.
- [🚀 **Sprint 6** – Live Coding](file:///d:/DuAnMoi/document/06_sprints/sprint_6.md)
  - *Nội dung:* Tích hợp Monaco Editor, sinh đề bài thuật toán, AI chấm code & chu kỳ câu hỏi giải thích độ phức tạp.
- [🚀 **Sprint 7** – UX Polish & Settings](file:///d:/DuAnMoi/document/06_sprints/sprint_7.md)
  - *Nội dung:* Dark/Light mode đồng bộ, đa ngôn ngữ i18n (VI/EN), trang trợ giúp FAQ, cấu hình cài đặt tài khoản.
- [📧 **Sprint 8** – Interview Result Email Delivery](file:///d:/DuAnMoi/document/06_sprints/sprint_8.md)
  - *Nội dung:* Sau khi hoàn thành bài phỏng vấn thành công, hệ thống gửi email chứa điểm tổng, kết quả và đường dẫn xem lịch sử cho người dùng.

---

## 📈 Velocity Summary

Dưới đây là bảng tổng hợp Story Points (SP) đã lập kế hoạch và hoàn thành qua các sprint:

| Sprint | Story Points Planned | Story Points Done | Velocity | Chi Tiết |
|---|---|---|---|---|
| **Sprint 0** | - | - | Setup | [Xem chi tiết](file:///d:/DuAnMoi/document/06_sprints/sprint_0.md) |
| **Sprint 1** | 23 | 23 | 100% | [Xem chi tiết](file:///d:/DuAnMoi/document/06_sprints/sprint_1.md) |
| **Sprint 2** | 36 | 36 | 100% | [Xem chi tiết](file:///d:/DuAnMoi/document/06_sprints/sprint_2.md) |
| **Sprint 3** | 40 | 40 | 100% | [Xem chi tiết](file:///d:/DuAnMoi/document/06_sprints/sprint_3.md) |
| **Sprint 4** | 41 | 41 | 100% | [Xem chi tiết](file:///d:/DuAnMoi/document/06_sprints/sprint_4.md) |
| **Sprint 5** | 32 | 32 | 100% | [Xem chi tiết](file:///d:/DuAnMoi/document/06_sprints/sprint_5.md) |
| **Sprint 6** | 29 | 29 | 100% | [Xem chi tiết](file:///d:/DuAnMoi/document/06_sprints/sprint_6.md) |
| **Sprint 7** | 18 | 18 | 100% | [Xem chi tiết](file:///d:/DuAnMoi/document/06_sprints/sprint_7.md) |
| **Sprint 8** | 16 | 0 | 0% | [Xem chi tiết](file:///d:/DuAnMoi/document/06_sprints/sprint_8.md) |

> **Tổng cộng:** 235 Story Points | **Thời gian phát triển:** Sprint 0 + 8 Sprints chính thức.
