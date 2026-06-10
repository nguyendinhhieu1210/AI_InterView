# 🚀 Sprint 7 – UX Polish & Settings

**Goal:** Tối ưu hóa trải nghiệm người dùng (UX), đồng bộ giao diện Dark/Light mode, tích hợp hệ thống đa ngôn ngữ (i18n), xây dựng trang trợ giúp FAQ và hoàn thiện cài đặt tài khoản.

---

## 1. Danh Sách User Stories

| ID | User Story | Story Points | Kết Quả | Chi Tiết Kỹ Thuật |
|---|---|---|---|---|
| **EP7-1** | Hỗ trợ đa ngôn ngữ (i18n) | 5 | ✅ Hoàn thành | Sử dụng thư viện `i18next` + `react-i18next` để cấu hình đa ngôn ngữ Tiếng Việt & Tiếng Anh. Dịch toàn bộ giao diện tĩnh của app. |
| **EP7-2** | Đồng bộ giao diện Dark/Light mode | 3 | ✅ Hoàn thành | Tích hợp Tailwind CSS dark mode class-based kết hợp React Context (`ThemeContext`). Đồng bộ màu sắc cho toàn bộ components (charts, editor, modals). |
| **EP7-3** | Trang Trợ giúp & FAQ | 2 | ✅ Hoàn thành | Trang `/help` hiển thị hướng dẫn sử dụng chi tiết bằng cách sử dụng các Accordion component giúp người dùng nhanh chóng tìm thấy câu trả lời. |
| **EP7-4** | Cấu hình cài đặt tài khoản | 3 | ✅ Hoàn thành | Trang `/settings` cho phép chỉnh sửa thông tin, đổi mật khẩu và lưu tùy chọn nhận thông báo (email/browser) trên frontend bằng `localStorage`. |
| **EP7-5** | Sửa đổi mật khẩu bảo mật | 2 | ✅ Hoàn thành | API `PUT /api/users/change-password`. Xác thực mật khẩu hiện tại trước khi mã hóa mật khẩu mới và lưu vào DB. |
| **EP7-6** | Tối ưu hóa UI/UX & Fix bugs | 3 | ✅ Hoàn thành | Sửa lỗi vỡ layout trên màn hình di động, cải thiện tốc độ tải trang, tối ưu các hiệu ứng chuyển trang bằng Framer Motion mượt mà. |

---

## 2. Kết Quả Sau Khi Tối Ưu Hóa Giao Diện

- **Dark Mode:** Toàn bộ trang web được áp dụng màu nền tối dịu mắt (Deep Charcoal & Dark Slate), các panel sử dụng hiệu ứng Glassmorphism giúp giao diện hiện đại và cao cấp.
- **i18n:** Người dùng có thể dễ dàng chuyển đổi ngôn ngữ Việt / Anh ngay tại thanh Header hoặc trong màn hình Cài đặt mà không cần tải lại trang.
- **Responsive:** Giao diện co giãn tốt từ màn hình Desktop siêu rộng cho tới điện thoại Mobile nhỏ gọn (hỗ trợ mobile navigation bar).

---

## 3. Retrospective Sprint 7

**Điểm tốt (What went well):**
- Thư viện `i18next` giúp việc dịch nội dung và chuyển đổi ngôn ngữ diễn ra tức thì, không làm gián đoạn trạng thái ứng dụng.
- Phối màu Dark mode nhận được phản hồi rất tích cực, độ tương phản văn bản cao dễ đọc.

**Cần cải thiện (To improve):**
- Một số biểu đồ Recharts trong dark mode ban đầu có nhãn văn bản (labels) màu tối khó nhìn. Đã sửa lại bằng cách truyền biến CSS của Tailwind (`text-text` hoặc `text-muted`) vào thuộc tính màu của Recharts.
