# 🧩 Mô Tả Components – AI InterView Frontend

## 1. Tổng Quan Components

Tất cả components tái sử dụng nằm trong `frontend/src/components/`.

---

## 2. Components Chi Tiết

### 🔐 ProtectedRoute
**File:** `components/ProtectedRoute.jsx`

Bảo vệ các route yêu cầu đăng nhập. Nếu user chưa xác thực → redirect về `/login`.

```jsx
// Cách dùng trong App.js
<Route path="/welcome" element={
  <ProtectedRoute>
    <WelcomePage />
  </ProtectedRoute>
} />
```

---

### 📄 CVInfoModal
**File:** `components/CVInfoModal.jsx` (~19KB)

Modal hiển thị thông tin CV và phân tích skills:
- Preview PDF file bằng `react-pdf`
- Hiển thị tên file CV, tên ứng viên, kỹ năng đã trích xuất
- Cho phép chọn tối đa 4 kỹ năng từ các nhóm Frontend / Backend / Theory / DevOps
- Gọi API `/api/cv/analyze-text` để phân tích nội dung CV khi preview
- Sinh câu hỏi phỏng vấn dựa trên kỹ năng đã chọn

**Props:**
- `cvData`: object chứa `{ fileUrl, fileName, fullName, skills, rawText }`
- `onClose()`: đóng modal
- `onStartInterview(data)`: callback khi bắt đầu phỏng vấn
- `onQuestionsGenerated(data)`: callback khi AI trả về câu hỏi

**Ghi chú:**
- `CVInfoModal` là modal overlay, được render từ `WellcomePage.jsx` sau khi upload CV thành công.

---

### 💻 CodingInterface
**File:** `components/CodingInterface.jsx` (~24KB)

CodingInterface là giao diện chính của Live Coding:
- Monaco Editor tích hợp để viết code trong trình duyệt
- Nhận dữ liệu `sessionId`, `problemStatement`, `language`, `topic`, `domain`, `difficulty`, `testCriteria`, `exampleInput`, `exampleOutput`
- Quản lý các phase: `coding`, `explain_pending`, `explaining`, `review`
- Gọi API Live Coding:
  - `POST /api/live-coding/session/:sessionId/submit` để nộp code
  - `POST /api/live-coding/session/:sessionId/explain` để trả lời câu hỏi giải thích
  - `POST /api/live-coding/session/:sessionId/next-code` để lấy bài code mới
- Hiển thị feedback AI, đánh giá code, và mở `EvaluationModal` khi hoàn thành chu kỳ giải thích
- Tự động reset editor và chuyển trang khi đổi topic hoặc thoát

---

### 📊 EvaluationModal
**File:** `components/EvaluationModal.jsx` (~8KB)

Modal hiển thị kết quả đánh giá ngay sau khi hoàn thành bài phỏng vấn:
- Tổng điểm
- Điểm từng câu
- Đáp án đúng và giải thích

---

### 📝 InterviewReportModal
**File:** `components/InterviewReportModal.jsx` (~10KB)

Modal báo cáo chi tiết phỏng vấn:
- Breakdown điểm MCQ vs Tự luận
- Feedback chi tiết từng câu
- Lời khuyên cải thiện

---

### 🚀 StartInterviewModal
**File:** `components/StartInterviewModal.jsx` (~7.6KB)

Modal xác nhận bắt đầu phỏng vấn:
- Hiển thị thông tin bài (chủ đề, độ khó, số câu)
- Nút bắt đầu / hủy

---

### 📌 TopicSelection
**File:** `components/TopicSelection.jsx` (~9KB)

Component chọn chủ đề phỏng vấn:
- Grid các topic (HTML, CSS, JavaScript, React, Node.js, ...)
- Filter theo category
- Hiển thị selected state

---

### 📤 UploadCV
**File:** `components/UploadCV.jsx` (~6.2KB)

Component upload CV:
- Drag & drop hoặc click để chọn file
- Hỗ trợ PDF (frontend) và gửi `multipart/form-data` đến backend
- Hiển thị tên file, trạng thái upload và nút huỷ bỏ
- Tạo object URL tạm để preview PDF khi chọn file
- Gọi `/api/cv/upload` với JWT token trong header
- Trả về dữ liệu CV cho parent component (`WellcomePage`) dưới dạng:
  - `{ fileUrl, fileName, fullName, skills, rawText }`

**Flow:**
1. User chọn file PDF
2. UploadCV gửi file lên `POST /api/cv/upload`
3. Server trả về `fullName`, `skills`, `rawText`, `fileName`
4. Parent mở `CVInfoModal` để hiển thị preview và cho phép chọn thêm kỹ năng

---

### 🤖 AIFeedback
**File:** `components/AIFeedback.jsx` (~1.5KB)

Hiển thị feedback từ AI dạng đơn giản (text card).

---

### 👁️ PDFPreview
**File:** `components/PDFPreview.jsx` (~1.8KB)

Preview file PDF đã upload (dùng `react-pdf`).

---

### 📅 ActivityCalendar
**File:** `components/ActivityCalendar.jsx` (~11KB)

Heatmap lịch hoạt động theo ngày (tương tự GitHub contribution graph):
- Hiển thị 1 năm gần nhất
- Màu đậm nhạt theo số lần practice
- Tooltip khi hover

---

### 📈 PerformanceTrendChart
**File:** `components/PerformanceTrendChart.jsx` (~30KB)

Biểu đồ xu hướng hiệu suất theo thời gian:
- Line chart điểm qua các lần phỏng vấn
- Filter theo loại phỏng vấn (Standard / CV / Adaptive)
- So sánh các chủ đề khác nhau
- Sử dụng Recharts

---

### 🎯 WeaknessAnalysis
**File:** `components/WeaknessAnalysis.jsx` (~21KB)

Phân tích điểm yếu của người dùng:
- Radar chart theo chủ đề
- Danh sách chủ đề cần cải thiện
- Gợi ý tài nguyên học tập

---

### 📉 ProgressChart
**File:** `components/ProgressChart.jsx` (~1.3KB)

Biểu đồ tiến độ đơn giản (mini chart).

---

### 🌙 DarkModeToggle
**File:** `components/DarkModeToggle.jsx` (~0.65KB)

Nút toggle chuyển đổi Dark/Light mode.

```jsx
// Cách dùng
<DarkModeToggle />
// Tự động kết nối với ThemeContext
```

---

## 3. Pages Chi Tiết

### 🏠 WelcomePage (`WellcomePage.jsx`) – ~30KB
Trang chủ sau khi đăng nhập:
- Dashboard tổng quan (số lần practice, điểm TB)
- Navigation đến các tính năng chính
- Hiển thị hoạt động gần đây
- ActivityCalendar & PerformanceTrendChart

### 🎤 InterviewPage – ~29KB
Standard Interview:
- Bước 1: Chọn topic (TopicSelection)
- Bước 2: Chọn độ khó
- Bước 3: StartInterviewModal
- Bước 4: Phòng phỏng vấn (MCQ + Text)
- Bước 5: EvaluationModal kết quả

### 📋 InterviewCVPage – ~29KB
CV-based Interview:
- Upload CV (UploadCV component)
- CVInfoModal xem kỹ năng và preview PDF
- Sinh câu hỏi dựa trên CV qua `/api/cv/generate-questions`
- Lưu lịch sử phỏng vấn CV khi nộp bài
- Phòng phỏng vấn hiển thị câu hỏi MCQ và text

### 🤖 AdaptiveInterviewPage – ~26KB
Adaptive Interview:
- Chọn chủ đề
- Loop: câu hỏi → trả lời → AI điều chỉnh độ khó
- Màn hình kết thúc session

### 💻 LiveCodingPage – ~0.8KB
LiveCodingPage là trang khởi tạo session Live Coding:
- Sử dụng `TopicSelection` để chọn ngôn ngữ, domain, topic và độ khó
- Sau khi lựa chọn xong, gọi `POST /api/live-coding/start`
- Nhận `sessionId` và câu hỏi đầu tiên, sau đó render `CodingInterface`
- Giữ giao diện đơn giản, chỉ chuyển từ bước chọn sang editor

### 👤 ProfilePage – ~32KB
Hồ sơ người dùng:
- Thông tin cá nhân & avatar
- Thống kê tổng (total interviews, avg score)
- PerformanceTrendChart
- WeaknessAnalysis
- ActivityCalendar

### ⚙️ SettingsPage – ~22KB
Cài đặt:
- Dark/Light mode
- Ngôn ngữ (VI/EN)
- Đổi mật khẩu
- Thông báo

### ❓ HelpSupportPage – ~36KB
Hỗ trợ & FAQ:
- Hướng dẫn sử dụng từng tính năng
- FAQ accordion
- Contact

---

## 4. Quy Ước Component

| Quy Ước | Mô Tả |
|---|---|
| File đặt tên | PascalCase (ví dụ: `CVInfoModal.jsx`) |
| Functional components | Dùng hooks, không dùng class components |
| State management | useState + useContext (không dùng Redux) |
| Styling | TailwindCSS inline classes |
| Animation | Framer Motion (`motion.div`, `AnimatePresence`) |
| API calls | Trong `useEffect` hoặc event handlers, qua `services/` |
