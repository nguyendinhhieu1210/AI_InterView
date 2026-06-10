# 🗄️ Sơ Đồ Cơ Sở Dữ Liệu – AI InterView

## 1. Tổng Quan Collections

MongoDB database có **7 collections** chính:

```
MongoDB Database: ai_interview (hoặc theo MONGO_URI)
├── users
├── interviewresults
├── adaptivesessions
├── cvinterviewsessions (Model: InterviewSession)
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
| `mcqResults` | Array | - | Kết quả câu hỏi MCQ (xem sub-schema) |
| `textResults` | Array | - | Kết quả câu hỏi tự luận (xem sub-schema) |
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
| `difficulty` | String | enum: ['easy','medium','hard'] | Độ khó ban đầu |
| `status` | String | enum: ['active','completed','abandoned'] | Trạng thái session |
| `conversation` | Array | - | Danh sách tin nhắn trao đổi (xem messageSchema) |
| `finalScore` | Number | min: 0, max: 10 | Điểm trung bình (thang 10) |
| `summary` | Mixed | default: {} | Tóm tắt kết quả |
| `detailedReport` | Mixed | - | Báo cáo chi tiết |
| `startedAt` | Date | default: Date.now | Thời điểm bắt đầu |
| `endedAt` | Date | - | Thời điểm kết thúc |
| `maxFollowUps` | Number | default: 8 | Số câu hỏi tối đa |
| `coveredTopics` | [String] | - | Các subtopic đã hỏi |
| `currentSubtopic` | String | - | Subtopic hiện tại |
| `subtopicDepth` | Number | default: 0 | Độ sâu của subtopic |
| `lastAnswerSharp` | Boolean | default: false | Câu trả lời trước sắc bén không? |
| `lastAnswerSubtopic`| String | - | Subtopic của câu trả lời trước |
| `askedQuestions` | [String] | - | Các câu hỏi đã hỏi |
| `questionTypeHistory`| [String] | - | Lịch sử loại câu hỏi |
| `roadmapStructured` | Mixed | - | Sơ đồ lộ trình học tập cấu trúc |
| `roadmapFlattened` | [String] | - | Lộ trình học tập dạng danh sách phẳng |

**Sub-schema `conversation` (messageSchema):**

| Field | Type | Constraints | Mô Tả |
|---|---|---|---|
| `role` | String | enum: ['assistant', 'user'] | Vai trò (AI hoặc Người dùng) |
| `content` | String | required | Nội dung hội thoại |
| `type` | String | enum: ['question', 'answer', 'system'] | Loại tin nhắn |
| `subtopic` | String | - | Chủ đề phụ đang nói tới |
| `score` | Number | min: 0, max: 10 | Điểm chấm cho câu trả lời |
| `strengths` | [String] | - | Điểm mạnh của câu trả lời |
| `weaknesses` | [String] | - | Điểm yếu / Thiếu sót |
| `missingConcepts` | [String] | - | Khái niệm bị bỏ sót |

---

### 📌 Collection: `cvinterviewsessions`
**File:** `backend/models/CVInterviewSession.js` (Lưu dưới model name: `InterviewSession`)

| Field | Type | Constraints | Mô Tả |
|---|---|---|---|
| `_id` | ObjectId | auto | Primary key |
| `userId` | ObjectId | ref: User, required | ID người dùng |
| `cvId` | ObjectId | ref: CV, default null | ID CV tham chiếu |
| `cvName` | String | default: '' | Tên tệp hoặc tên ứng viên trên CV |
| `topic` | [String] | - | Các kỹ năng (skills) được chọn phỏng vấn |
| `questions` | Mixed | required | Danh sách câu hỏi AI sinh từ CV |
| `answers` | Mixed | required | Câu trả lời của người dùng |
| `results` | Mixed | required | Kết quả chấm điểm chi tiết |
| `totalScore` | Number | required | Tổng điểm (0-100) |
| `summary` | Object | - | Báo cáo tóm tắt (overall, strengths, weaknesses, suggestions) |
| `createdAt` | Date | default: Date.now | Thời điểm tạo |

---

### 📌 Collection: `livecodingsessions`
**File:** `backend/models/LiveCodingSession.js`

| Field | Type | Constraints | Mô Tả |
|---|---|---|---|
| `_id` | ObjectId | auto | Primary key |
| `id` | String | required, unique, index | Session ID (uuidv4) |
| `language` | String | required | Ngôn ngữ lập trình (javascript, python, v.v.) |
| `domain` | String | required | Nhóm kiến thức (Async, OOP, v.v.) |
| `topic` | String | required | Chủ đề thuật toán cụ thể |
| `difficulty` | String | enum: ['beginner', 'intermediate', 'advanced'] | Độ khó |
| `codeHistory` | Array | - | Lịch sử nộp code & đánh giá (xem sub-schema) |
| `createdAt` | Date | default: Date.now, index | Ngày tạo |
| `updatedAt` | Date | default: Date.now | Ngày cập nhật gần nhất |

**Sub-schema `codeHistoryEntry`:**

| Field | Type | Mô Tả |
|---|---|---|
| `code` | String | Mã nguồn người dùng đã nộp |
| `problemStatement` | String | Đề bài coding AI sinh ra |
| `submittedAt` | Date | Thời điểm nộp bài |
| `explainAnswers` | Array | Các câu trả lời giải thích phụ (question, answer, isCorrect, feedback, modelAnswer) |
| `evaluation` | Object | Đánh giá tổng hợp cho mã nguồn (summary, feedback, strengths, weaknesses) |

---

### 📌 Collection: `activities`
**File:** `backend/models/Activity.js`

| Field | Type | Constraints | Mô Tả |
|---|---|---|---|
| `_id` | ObjectId | auto | Primary key |
| `userId` | ObjectId | ref: User, required | ID người dùng |
| `date` | Date | required, index | Ngày ghi nhận hoạt động (đã được quy về 00:00 UTC) |
| `type` | String | enum: ['interview', 'cvinterview', 'adaptiveinterview'] | Loại hoạt động |
| `createdAt` | Date | auto (timestamps) | Ngày tạo |

> [!NOTE]
> Collection này có unique index kép `{ userId: 1, date: 1 }` để đảm bảo mỗi người dùng chỉ ghi nhận tối đa 1 hoạt động mỗi ngày cho từng loại, dùng để vẽ GitHub-like contribution heatmap.

---

### 📌 Collection: `assessments`
**File:** `backend/models/Assessment.js`

| Field | Type | Constraints | Mô Tả |
|---|---|---|---|
| `_id` | ObjectId | auto | Primary key |
| `userId` | String | required, index | ID người dùng |
| `cvId` | String | - | ID CV tham chiếu |
| `cvName` | String | - | Tên tệp CV |
| `topic` | [String] | default: [] | Các chủ đề kỹ năng được đánh giá |
| `difficulty` | String | default: 'medium' | Độ khó |
| `answers` | Array | - | Kết quả chi tiết từng câu trả lời (xem sub-schema) |
| `totalScore` | Number | default: 0 | Tổng điểm của bài thi |
| `averageScore` | Number | default: 0 | Điểm trung bình |
| `summary` | Object | - | Tóm tắt từ AI (strengths, weaknesses, recommendation) |
| `completedAt` | Date | - | Thời điểm hoàn thành |

**Sub-schema `answers` (answerSchema):**

| Field | Type | Mô Tả |
|---|---|---|
| `questionId` | String | ID câu hỏi |
| `type` | String (enum: ['mcq', 'text']) | Loại câu hỏi |
| `topic` | String | Chủ đề của câu hỏi này |
| `question` | String | Nội dung câu hỏi |
| `correctAnswer` | Mixed | Đáp án đúng |
| `userAnswer` | Mixed | Câu trả lời của người dùng |
| `isCorrect` | Boolean | Có chính xác không |
| `score` | Number | Điểm số đạt được |
| `aiFeedback` | String | Phản hồi chi tiết của AI |
| `weaknessTags` | [String] | Gắn thẻ điểm yếu |
| `difficulty` | String | Độ khó câu hỏi |

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
  ├──── (n) activities             [userId → users._id]
  │
  └──── (n) assessments            [userId → users._id]
```

> **Lưu ý:** `livecodingsessions` hiện tại lưu trữ độc lập theo mã `id` (Session ID dạng UUIDv4) và được truy vấn không qua liên kết trực tiếp khóa ngoại Mongoose ref, phục vụ mục đích phỏng vấn ẩn danh hoặc qua chia sẻ link.

---

## 4. Indexes Quan Trọng (Performance)

```javascript
// users
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ userName: 1 }, { unique: true });

// interviewresults
db.interviewresults.createIndex({ userId: 1, completedAt: -1 });

// adaptivesessions
db.adaptivesessions.createIndex({ userId: 1, createdAt: -1 });

// activities
db.activities.createIndex({ userId: 1, date: 1 }, { unique: true });

// assessments
db.assessments.createIndex({ userId: 1 });
```
