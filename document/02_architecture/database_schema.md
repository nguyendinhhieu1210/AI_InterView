# 🗄️ Sơ Đồ Cơ Sở Dữ Liệu – AI InterView

## 1. Tổng Quan Collections

MongoDB database có **7 collections** chính:

```
MongoDB Database: ai_interview (hoặc theo MONGO_URI)
├── users
├── interviewresults
├── adaptivesessions
├── cvinterviewsessions
├── livecodingsessions
├── activities
└── assessments
```

---

## 2. Chi Tiết Các Schema

### 📌 Collection: `users`
**File:** `backend/models/User.js`

| Field | Type | Constraints | Mô Tả |
|---|---|---|---|
| `_id` | ObjectId | auto | Primary key |
| `userName` | String | required, unique, trim | Tên đăng nhập |
| `fullName` | String | required, trim | Họ tên đầy đủ |
| `email` | String | required, unique, lowercase | Email |
| `password` | String | required, hashed | Mật khẩu (bcrypt) |
| `role` | String | enum: ['user','admin'] | Vai trò |
| `avatar` | String | default: '' | URL ảnh đại diện |
| `isVerified` | Boolean | default: false | Đã xác thực email? |
| `emailVerificationOTP` | String | - | OTP xác thực email |
| `emailVerificationExpires` | Date | - | Thời hạn OTP |
| `resetPasswordOTP` | String | - | OTP reset mật khẩu |
| `resetPasswordExpires` | Date | - | Thời hạn OTP reset |
| `createdAt` | Date | auto (timestamps) | Ngày tạo |
| `updatedAt` | Date | auto (timestamps) | Ngày cập nhật |

---

### 📌 Collection: `interviewresults`
**File:** `backend/models/InterviewResult.js`

| Field | Type | Constraints | Mô Tả |
|---|---|---|---|
| `_id` | ObjectId | auto | Primary key |
| `userId` | ObjectId | ref: User, required | ID người dùng |
| `topic` | String | - | Chủ đề phỏng vấn |
| `difficulty` | String | - | Độ khó |
| `mcqResults` | Array | - | Kết quả câu hỏi MCQ |
| `textResults` | Array | - | Kết quả câu hỏi tự luận |
| `totalScore` | Number | required | Tổng điểm (0-100) |
| `completedAt` | Date | default: Date.now | Thời điểm hoàn thành |

**Sub-schema `mcqResults`:**

| Field | Type | Mô Tả |
|---|---|---|
| `question` | String | Nội dung câu hỏi |
| `options` | [String] | Các lựa chọn A/B/C/D |
| `userAnswer` | String | Đáp án người dùng chọn |
| `correctAnswer` | String | Đáp án đúng |
| `isCorrect` | Boolean | Có đúng không? |
| `score` | Number | 0 hoặc 10 điểm |
| `explanation` | String | Giải thích đáp án |

**Sub-schema `textResults`:**

| Field | Type | Mô Tả |
|---|---|---|
| `question` | String | Câu hỏi tự luận |
| `idealAnswerKeywords` | [String] | Từ khóa đáp án mẫu |
| `sampleAnswer` | String | Đáp án mẫu |
| `userAnswer` | String | Câu trả lời của user |
| `score` | Number | 0-10 điểm |
| `explanation` | String | Lý do chấm điểm |
| `feedback` | String | Lời khuyên cải thiện |

---

### 📌 Collection: `adaptivesessions`
**File:** `backend/models/AdaptiveSession.js`

| Field | Type | Constraints | Mô Tả |
|---|---|---|---|
| `_id` | ObjectId | auto | Primary key |
| `userId` | ObjectId | ref: User, required | ID người dùng |
| `topic` | String | required | Chủ đề phỏng vấn |
| `status` | String | enum: ['active','completed'] | Trạng thái session |
| `currentDifficulty` | String | enum: ['easy','medium','hard'] | Độ khó hiện tại |
| `totalScore` | Number | default: 0 | Tổng điểm |
| `questionHistory` | Array | - | Lịch sử câu hỏi & đáp án (xem sub-schema bên dưới) |
| `createdAt` | Date | auto (timestamps) | Ngày tạo |
| `updatedAt` | Date | auto (timestamps) | Ngày cập nhật |

**Sub-schema `questionHistory`:**

| Field | Type | Mô Tả |
|---|---|---|
| `question` | String | Nội dung câu hỏi |
| `difficulty` | String | Độ khó câu hỏi này |
| `userAnswer` | String | Câu trả lời của user |
| `score` | Number | Điểm (0–10) |
| `feedback` | String | Feedback từ AI |

---

### 📌 Collection: `cvinterviewsessions`
**File:** `backend/models/CVInterviewSession.js`

| Field | Type | Constraints | Mô Tả |
|---|---|---|---|
| `_id` | ObjectId | auto | Primary key |
| `userId` | ObjectId | ref: User, required | ID người dùng |
| `cvData` | Object | - | Dữ liệu CV đã phân tích (name, skills) |
| `cvData.name` | String | - | Tên ứng viên trích xuất từ CV |
| `cvData.skills.frontend` | [String] | - | Kỹ năng Frontend |
| `cvData.skills.backend` | [String] | - | Kỹ năng Backend |
| `cvData.skills.theory` | [String] | - | Kiến thức lý thuyết |
| `questions` | Array | - | Câu hỏi được AI sinh từ CV |
| `answers` | Array | - | Đáp án của người dùng |
| `totalScore` | Number | - | Tổng điểm |
| `completedAt` | Date | default: Date.now | Thời điểm hoàn thành |

---

### 📌 Collection: `livecodingsessions`
**File:** `backend/models/LiveCodingSession.js`

| Field | Type | Constraints | Mô Tả |
|---|---|---|---|
| `_id` | ObjectId | auto | Primary key |
| `userId` | ObjectId | ref: User, required | ID người dùng |
| `problem` | Object | - | Bài toán được AI sinh |
| `problem.title` | String | - | Tiêu đề bài toán |
| `problem.description` | String | - | Mô tả yêu cầu |
| `problem.difficulty` | String | - | Độ khó |
| `problem.language` | String | - | Ngôn ngữ lập trình |
| `userCode` | String | - | Code của người dùng |
| `score` | Number | - | Điểm (0–100) |
| `feedback` | String | - | Feedback từ AI |
| `completedAt` | Date | default: Date.now | Thời điểm hoàn thành |

---

### 📌 Collection: `activities`
**File:** `backend/models/Activity.js`

| Field | Type | Constraints | Mô Tả |
|---|---|---|---|
| `_id` | ObjectId | auto | Primary key |
| `userId` | ObjectId | ref: User, required | ID người dùng |
| `date` | String | required | Ngày (format: YYYY-MM-DD) |
| `count` | Number | default: 0 | Số lần practice trong ngày |
| `type` | String | - | Loại hoạt động (standard/cv/adaptive/livecoding) |
| `createdAt` | Date | auto (timestamps) | Ngày tạo |

> Dùng để render **ActivityCalendar** (heatmap tương tự GitHub contribution graph).

---

### 📌 Collection: `assessments`
**File:** `backend/models/Assessment.js`

| Field | Type | Constraints | Mô Tả |
|---|---|---|---|
| `_id` | ObjectId | auto | Primary key |
| `userId` | ObjectId | ref: User, required | ID người dùng |
| `topic` | String | required | Chủ đề được đánh giá |
| `averageScore` | Number | - | Điểm trung bình theo chủ đề |
| `totalAttempts` | Number | default: 0 | Số lần luyện tập chủ đề này |
| `weakPoints` | [String] | - | Các điểm yếu cụ thể |
| `recommendation` | String | - | Gợi ý cải thiện từ AI |
| `updatedAt` | Date | auto (timestamps) | Lần cập nhật gần nhất |

> Dùng cho tính năng **WeaknessAnalysis** – phân tích điểm yếu theo từng chủ đề.

---

## 3. Quan Hệ Giữa Các Collections

```
users (1)
  │
  ├──── (n) interviewresults       [userId → users._id]
  │
  ├──── (n) adaptivesessions       [userId → users._id]
  │
  ├──── (n) cvinterviewsessions    [userId → users._id]
  │
  ├──── (n) livecodingsessions     [userId → users._id]
  │
  ├──── (n) activities             [userId → users._id]
  │
  └──── (n) assessments            [userId → users._id]
```

> **Mô hình quan hệ:** One-to-Many (1 user → nhiều kết quả/session)

---

## 4. Indexes Nên Tạo (Performance)

```javascript
// users
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ userName: 1 }, { unique: true });

// interviewresults
db.interviewresults.createIndex({ userId: 1, completedAt: -1 });

// adaptivesessions
db.adaptivesessions.createIndex({ userId: 1, createdAt: -1 });

// activities
db.activities.createIndex({ userId: 1, date: -1 });
```

---

## 5. Kết Nối Database

**File:** `backend/database/mongodb.js`

```
MONGO_URI=mongodb://localhost:27017/ai_interview
// hoặc MongoDB Atlas:
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/ai_interview
```
