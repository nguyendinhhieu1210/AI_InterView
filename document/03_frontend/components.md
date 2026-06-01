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

Hiển thị thông tin kỹ năng đã được AI trích xuất từ CV:
- Tên ứng viên
- Kỹ năng Frontend (danh sách)
- Kỹ năng Backend (danh sách)
- Kiến thức lý thuyết (Theory)

**Props:** Nhận `cvData` từ API `/api/cv/analyze`

---

### 💻 CodingInterface
**File:** `components/CodingInterface.jsx` (~24KB)

Trình soạn thảo code tích hợp cho tính năng Live Coding:
- Monaco Editor (VS Code engine)
- Hỗ trợ nhiều ngôn ngữ lập trình
- Chạy/test code
- Hiển thị output và test cases

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
- Drag & drop hoặc click to upload
- Hỗ trợ PDF
- Preview tên file
- Progress indicator

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
- CVInfoModal xem kỹ năng
- Sinh câu hỏi dựa trên CV
- Phòng phỏng vấn

### 🤖 AdaptiveInterviewPage – ~26KB
Adaptive Interview:
- Chọn chủ đề
- Loop: câu hỏi → trả lời → AI điều chỉnh độ khó
- Màn hình kết thúc session

### 💻 LiveCodingPage – ~0.8KB
Wrapper cho CodingInterface.

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
