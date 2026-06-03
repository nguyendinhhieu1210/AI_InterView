# 📡 API Reference – AI InterView Backend

> **Base URL:** `http://localhost:5000/api`  
> **Auth Header:** `Authorization: Bearer <JWT_TOKEN>` (với các route cần xác thực)

---

## 1. Authentication – `/api/auth`

### POST `/api/auth/register`
Đăng ký tài khoản mới. Gửi OTP xác thực về email.

**Request Body:**
```json
{
  "userName": "nguyenvana",
  "fullName": "Nguyễn Văn A",
  "email": "a@example.com",
  "password": "Password123!"
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Đăng ký thành công, vui lòng kiểm tra email để xác thực OTP"
}
```

---

### POST `/api/auth/verify-otp`
Xác thực OTP gửi về email.

**Request Body:**
```json
{
  "email": "a@example.com",
  "otp": "123456"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Xác thực email thành công"
}
```

---

### POST `/api/auth/login`
Đăng nhập. Trả về JWT token.

**Request Body:**
```json
{
  "email": "a@example.com",
  "password": "Password123!"
}
```

**Response 200:**
```json
{
  "success": true,
  "token": "eyJhbGci...",
  "user": {
    "_id": "...",
    "userName": "nguyenvana",
    "fullName": "Nguyễn Văn A",
    "email": "a@example.com",
    "avatar": "",
    "role": "user"
  }
}
```

---

### POST `/api/auth/forgot-password`
Gửi OTP reset mật khẩu về email.

**Request Body:**
```json
{ "email": "a@example.com" }
```

---

### POST `/api/auth/verify-reset-otp`
Xác thực OTP reset mật khẩu.

**Request Body:**
```json
{
  "email": "a@example.com",
  "otp": "654321"
}
```

---

### POST `/api/auth/reset-password`
Đặt mật khẩu mới.

**Request Body:**
```json
{
  "email": "a@example.com",
  "otp": "654321",
  "newPassword": "NewPass456!"
}
```

---

## 2. User – `/api/users` 🔒

> Tất cả routes cần JWT.

### GET `/api/users/profile`
Lấy thông tin hồ sơ người dùng hiện tại.

**Response 200:**
```json
{
  "success": true,
  "user": {
    "_id": "...",
    "userName": "nguyenvana",
    "fullName": "Nguyễn Văn A",
    "email": "a@example.com",
    "avatar": "https://...",
    "isVerified": true,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

---

### PUT `/api/users/profile`
Cập nhật thông tin hồ sơ.

**Request Body:**
```json
{
  "fullName": "Nguyễn Văn B",
  "avatar": "https://new-avatar-url.com/img.jpg"
}
```

---

### PUT `/api/users/change-password` 🔒
Đổi mật khẩu.

**Request Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456!"
}
```

---

## 3. Interview – `/api/interview` 🔒

### POST `/api/interview/generate`
Sinh bộ câu hỏi phỏng vấn tiêu chuẩn bằng AI.

**Request Body:**
```json
{
  "topic": "JavaScript",
  "difficulty": "medium"
}
```

**Response 200:**
```json
{
  "success": true,
  "questions": {
    "mcq": [
      {
        "question": "Closure trong JavaScript là gì?",
        "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
        "correctAnswer": "B"
      }
    ],
    "text": [
      {
        "question": "Giải thích Event Loop trong Node.js",
        "idealAnswerKeywords": ["call stack", "callback queue", "event loop"],
        "sampleAnswer": "..."
      }
    ]
  }
}
```

---

### POST `/api/interview/submit`
Nộp bài và nhận kết quả chấm điểm từ AI.

**Request Body:**
```json
{
  "topic": "JavaScript",
  "difficulty": "medium",
  "mcqAnswers": [
    { "questionIndex": 0, "userAnswer": "B" }
  ],
  "textAnswers": [
    { "questionIndex": 0, "userAnswer": "Event loop là cơ chế..." }
  ]
}
```

**Response 200:**
```json
{
  "success": true,
  "result": {
    "_id": "...",
    "totalScore": 75,
    "mcqResults": [ ... ],
    "textResults": [ ... ]
  }
}
```

---

### GET `/api/interview/history`
Lấy danh sách lịch sử phỏng vấn của user hiện tại.

**Response 200:**
```json
{
  "success": true,
  "results": [
    {
      "_id": "...",
      "topic": "JavaScript",
      "difficulty": "medium",
      "totalScore": 75,
      "completedAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

### GET `/api/interview/history/:id`
Lấy chi tiết một bài phỏng vấn cụ thể.

**Response 200:**
```json
{
  "success": true,
  "history": {
    "_id": "...",
    "topic": "JavaScript",
    "difficulty": "medium",
    "questions": [...],
    "answers": [...],
    "results": [...]
  }
}
```

---

## 4. CV Interview – `/api/cv`

### POST `/api/cv/upload` 🔒
Upload file CV (PDF) để trích xuất thông tin.

- Yêu cầu authentication.
- Sử dụng `multipart/form-data` với field `cv`.
- Server chỉ lưu tệp tạm thời để trích xuất rồi xoá ngay.

**Request:**
- Header: `Authorization: Bearer <JWT_TOKEN>`
- Body: `FormData` với `cv` file PDF

**Response 200:**
```json
{
  "success": true,
  "fullName": "Nguyễn Đình Hiếu",
  "skills": {
    "frontend": [...],
    "backend": [...],
    "theory": [...],
    "devops": [...]
  },
  "rawText": "...",
  "fileName": "CV_NguyenDinhHieu.pdf"
}
```

---

### POST `/api/cv/analyze-text`
Phân tích nội dung CV đã trích xuất sẵn.

- Không yêu cầu upload file.
- Nhận payload JSON chứa `cvText`.
- Trả về `fullName` và `skills`.

**Request Body:**
```json
{
  "cvText": "..."
}
```

**Response 200:**
```json
{
  "success": true,
  "fullName": "Nguyễn Đình Hiếu",
  "skills": { "frontend": [...], "backend": [...], "theory": [...], "devops": [...] }
}
```

---

### POST `/api/cv/generate-questions`
Sinh bộ câu hỏi phỏng vấn dựa trên nội dung CV và kỹ năng đã chọn.

- Không yêu cầu JWT.
- Nhận payload JSON chứa `cvText` và `selectedSkills`.

**Request Body:**
```json
{
  "cvText": "...",
  "selectedSkills": {
    "frontend": ["React", "HTML"],
    "backend": ["Node.js"],
    "theory": ["OOP"],
    "devops": ["Docker"]
  }
}
```

**Response 200:**
```json
{
  "success": true,
  "questions": {
    "mcq": [...],
    "text": [...]
  }
}
```

---

### POST `/api/cv/submit-answers` 🔒
Nộp câu trả lời cho bài phỏng vấn CV và lưu lịch sử.

- Yêu cầu authentication.
- Nhận `questions`, `answers`, `selectedSkills`, và `cvName`.

**Request Body:**
```json
{
  "questions": { ... },
  "answers": { ... },
  "selectedSkills": { ... },
  "cvName": "CV_NguyenDinhHieu.pdf"
}
```

**Response 200:**
```json
{
  "success": true,
  "results": {
    "mcq": [...],
    "text": [...],
    "totalScore": 88,
    "summary": "..."
  }
}
```

---

### GET `/api/cv/history` 🔒
Lấy danh sách lịch sử phỏng vấn CV của user.

**Response 200:**
```json
{
  "success": true,
  "history": [ ... ]
}
```

---

### GET `/api/cv/history/:id` 🔒
Lấy chi tiết session CV cụ thể.

**Response 200:**
```json
{
  "success": true,
  "history": { ... }
}
```

---

## 5. Adaptive Interview – `/api/adaptive` 🔒

### POST `/api/adaptive/start`
Bắt đầu session phỏng vấn thích ứng.

**Request Body:**
```json
{
  "topic": "React",
  "initialDifficulty": "easy"
}
```

**Response 200:**
```json
{
  "success": true,
  "sessionId": "...",
  "question": {
    "content": "React Hook là gì?",
    "type": "text",
    "difficulty": "easy"
  }
}
```

---

### POST `/api/adaptive/answer`
Gửi câu trả lời và nhận câu hỏi tiếp theo (độ khó đã điều chỉnh).

**Request Body:**
```json
{
  "sessionId": "...",
  "answer": "React Hook là các hàm cho phép..."
}
```

**Response 200:**
```json
{
  "success": true,
  "evaluation": {
    "score": 8,
    "feedback": "Câu trả lời tốt, nhưng cần đề cập thêm..."
  },
  "nextQuestion": {
    "content": "Giải thích useCallback vs useMemo",
    "difficulty": "medium"
  },
  "sessionComplete": false
}
```

---

### POST `/api/adaptive/complete`
Kết thúc session và lưu tổng kết.

**Request Body:**
```json
{ "sessionId": "..." }
```

---

### GET `/api/adaptive/history`
Danh sách lịch sử Adaptive sessions.

---

### GET `/api/adaptive/history/:sessionId`
Chi tiết một Adaptive session.

---

## 6. Weakness Analysis – `/api/weakness` 🔒

### GET `/api/weakness/analyze`
Phân tích điểm yếu của user dựa trên lịch sử phỏng vấn.

**Response 200:**
```json
{
  "success": true,
  "weaknesses": [
    {
      "topic": "JavaScript",
      "averageScore": 45,
      "recommendation": "Tập trung vào Closures, Promises, và Async/Await"
    }
  ],
  "strengths": [
    { "topic": "HTML/CSS", "averageScore": 88 }
  ]
}
```

---

## 7. Live Coding – `/api/live-coding` 🔒

> Tất cả các route Live Coding yêu cầu JWT token hợp lệ.

### GET `/api/live-coding/domains`
Lấy danh sách domain theo ngôn ngữ.

**Query:**
- `language` (string) – ví dụ `javascript`, `python`, `java`

**Response 200:**
```json
{
  "domains": ["OOP", "Functional Programming", "Async", "DOM Manipulation", "Closures"]
}
```

---

### GET `/api/live-coding/topics`
Lấy danh sách topics theo ngôn ngữ và domain.

**Query:**
- `language` (string)
- `domain` (string)

**Response 200:**
```json
{
  "topics": ["Prototypes", "Classes", "Inheritance", "Polymorphism", "Encapsulation"]
}
```

---

### POST `/api/live-coding/start`
Bắt đầu session Live Coding mới.

**Request Body:**
```json
{
  "language": "javascript",
  "domain": "Async",
  "topicName": "Event Loop",
  "difficulty": "intermediate"
}
```

**Response 201:**
```json
{
  "sessionId": "uuid-v4-session-id",
  "question": {
    "problemStatement": "Write a function that...",
    "testCriteria": "...",
    "exampleInput": "...",
    "exampleOutput": "...",
    "type": "code"
  }
}
```

---

### GET `/api/live-coding/session/:sessionId/current-question`
Lấy câu hỏi hiện tại của session.

**Response 200:**
```json
{
  "currentQuestion": {
    "type": "code",
    "problemStatement": "...",
    "testCriteria": "..."
  }
}
```

---

### POST `/api/live-coding/session/:sessionId/submit`
Gửi code để AI đánh giá.

**Request Body:**
```json
{
  "code": "function solve() { ... }"
}
```

**Response 200:**
```json
{
  "correct": true,
  "feedback": "Correct! Now explain your code.",
  "nextQuestion": {
    "type": "explain",
    "question": "Explain the time complexity of your solution."
  }
}
```

---

### POST `/api/live-coding/session/:sessionId/explain`
Gửi câu trả lời giải thích sau khi code đúng.

**Request Body:**
```json
{
  "answer": "I used a hash map to reduce complexity to O(n)..."
}
```

**Response 200:**
```json
{
  "correct": true,
  "feedback": "Good answer.",
  "nextQuestion": {
    "type": "explain",
    "question": "Describe how you handled edge cases."
  }
}
```

---

### POST `/api/live-coding/session/:sessionId/next-code`
Yêu cầu câu hỏi code mới sau khi hoàn thành chu kỳ giải thích.

**Response 200:**
```json
{
  "nextQuestion": {
    "type": "code",
    "problemStatement": "...",
    "testCriteria": "..."
  }
}
```

---

### GET `/api/live-coding/session/:sessionId/last-evaluation`
Lấy đánh giá cuối cùng của session từ DB.

**Response 200:**
```json
{
  "evaluation": {
    "summary": "...",
    "feedback": "...",
    "strengths": ["..."],
    "weaknesses": ["..."]
  }
}
```

---

### GET `/api/live-coding/history`
Lấy danh sách session Live Coding đã lưu trong DB.

**Response 200:**
```json
{
  "success": true,
  "history": [
    {
      "id": "uuid-v4-session-id",
      "language": "javascript",
      "domain": "Async",
      "topic": "Event Loop",
      "difficulty": "intermediate",
      "createdAt": "...",
      "updatedAt": "...",
      "totalQuestions": 1
    }
  ]
}
```

---

### GET `/api/live-coding/sessions/:sessionId`
Lấy chi tiết session Live Coding, bao gồm `codeHistory`.

**Response 200:**
```json
{
  "success": true,
  "session": {
    "id": "uuid-v4-session-id",
    "language": "javascript",
    "domain": "Async",
    "topic": "Event Loop",
    "difficulty": "intermediate",
    "createdAt": "...",
    "updatedAt": "...",
    "codeHistory": [ ... ]
  }
}
```

---

## 8. Activity – `/api/activity` 🔒

### GET `/api/activity`
Lấy dữ liệu hoạt động hàng ngày (cho ActivityCalendar).

**Response 200:**
```json
{
  "success": true,
  "activities": [
    { "date": "2024-01-15", "count": 3 },
    { "date": "2024-01-16", "count": 1 }
  ]
}
```

---

## 9. Health Check

### GET `/health`
Kiểm tra server đang hoạt động.

**Response 200:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

---

## 10. HTTP Status Codes

| Code | Ý Nghĩa |
|---|---|
| 200 | Thành công |
| 201 | Tạo mới thành công |
| 400 | Bad Request (dữ liệu không hợp lệ) |
| 401 | Unauthorized (chưa đăng nhập / token hết hạn) |
| 403 | Forbidden (không có quyền) |
| 404 | Not Found |
| 500 | Internal Server Error |
