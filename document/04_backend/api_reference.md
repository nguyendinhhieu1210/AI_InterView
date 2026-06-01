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
Lấy chi tiết một bài phỏng vấn.

---

## 4. CV – `/api/cv` 🔒

### POST `/api/cv/upload`
Upload file CV (PDF).

**Request:** `multipart/form-data`
```
file: [CV.pdf]
```

**Response 200:**
```json
{
  "success": true,
  "filePath": "uploads/1234567890-CV.pdf",
  "rawText": "Nguyễn Văn A\nSkills: React, Node.js..."
}
```

---

### POST `/api/cv/analyze`
Phân tích kỹ năng từ text CV đã extract.

**Request Body:**
```json
{
  "rawText": "Nguyễn Văn A\nSkills: React, Node.js, MongoDB..."
}
```

**Response 200:**
```json
{
  "success": true,
  "cvData": {
    "name": "NGUYEN VAN A",
    "skills": {
      "frontend": ["React", "HTML", "CSS", "JavaScript"],
      "backend": ["Node.js", "Express"],
      "theory": ["REST API", "Git", "Agile"]
    }
  }
}
```

---

### POST `/api/cv/interview/generate`
Sinh câu hỏi phỏng vấn dựa trên kỹ năng trong CV.

**Request Body:**
```json
{
  "skills": {
    "frontend": ["React", "JavaScript"],
    "backend": ["Node.js"]
  }
}
```

---

### POST `/api/cv/interview/submit`
Nộp bài phỏng vấn CV và nhận kết quả.

---

### GET `/api/cv/history`
Lấy lịch sử phỏng vấn theo CV.

---

### GET `/api/cv/history/:id`
Chi tiết một session CV interview.

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

### POST `/api/live-coding/generate`
Sinh bài toán coding.

**Request Body:**
```json
{
  "language": "javascript",
  "difficulty": "medium",
  "topic": "Arrays"
}
```

---

### POST `/api/live-coding/evaluate`
Chấm điểm code của user.

**Request Body:**
```json
{
  "problemId": "...",
  "code": "function solution(arr) { return arr.sort(); }",
  "language": "javascript"
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
