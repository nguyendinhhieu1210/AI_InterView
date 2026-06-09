# 🏁 Sprint 0 – Thiết Lập Nền Tảng

**Thời gian:** Tháng 5/2026  
**Mục tiêu:** Thiết lập nền tảng dự án, xác định phạm vi ban đầu, và xây dựng bộ tài liệu cơ bản để cả team hiểu chung.

---

## 1. Product Backlog Ban Đầu

Sinh viên cùng mentor thảo luận để:
- Hiểu rõ mục tiêu dự án.
- Xác định các nhóm chức năng chính (Epic) của hệ thống.
- BA xây dựng **Product Backlog ban đầu** ở mức chức năng lớn, chưa cần chi tiết từng User Story.
- Product Backlog ban đầu dùng để:
  - Lập kế hoạch Sprint tiếp theo.
  - Điều chỉnh phạm vi dự án trong quá trình thực hiện.
  - Thiết lập base dự án, tránh làm việc trùng lặp.

---

## 2. Tài Liệu Cần Thiết Cho Dự Án

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

> [!NOTE]
> Những tài liệu này không cần hoàn hảo, nhưng phải đủ để toàn bộ team hiểu và làm việc đồng bộ.

---

## 3. Thiết Lập Base Dự Án

Trong Sprint 0, team cần hoàn thành:

### 3.1 Base Design
- Thiết kế wireframe hoặc mockup cơ bản.
- Thể hiện bố cục chính và luồng người dùng.

### 3.2 Base Frontend
- Khởi tạo project frontend sử dụng React 19.
- Thiết lập cấu trúc thư mục tiêu chuẩn (`src/components`, `src/Pages`, `src/contexts`, `src/services`, ...).
- Tích hợp các thư viện UI và tiện ích cơ bản.
- Áp dụng UI/UX guideline đã thống nhất.

### 3.3 Base Backend
- Khởi tạo project backend sử dụng Node.js & Express.
- Thiết lập cấu trúc source code (`controllers`, `routes`, `models`, `services`, `middleware`, ...).
- Kết nối cơ sở dữ liệu MongoDB bằng Mongoose.
- Chuẩn bị các module cơ bản (auth, config).

### 3.4 Git và quy trình làm việc
- Tạo repository Git.
- Thống nhất cách tạo branch (Git Flow).
- Thống nhất quy tắc commit.
- Thống nhất quy trình merge code thông qua Pull Request.

---

## 4. Kết Quả Sprint 0

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

---

## 5. Retrospective Sprint 0

**Điểm mạnh:**
- Tài liệu giai đoạn đầu đã được chuẩn hóa.
- Quy trình Git và workflow được thiết lập rõ.
- Team có chung nhận thức về scope và công nghệ.

**Cần cải thiện:**
- Bổ sung wireframe/mockup giao diện rõ hơn.
- Chi tiết thêm database schema ở cấp collection.
