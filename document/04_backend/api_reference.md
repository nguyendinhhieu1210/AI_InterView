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
  "password": "Password123!",
  "confirmPassword": "Password123!"
}
```

**Response 201:**

```json
{
  "success": true,
  "message": "Registration successful! Please check your email to verify your account.",
  "email": "a@example.com",
  "user": {
    "userName": "nguyenvana",
    "fullName": "Nguyễn Văn A",
    "email": "a@example.com",
    "role": "user",
    "isVerified": false,
    "_id": "..."
  }
}
```

---

### POST `/api/auth/verify-email`

Xác thực OTP gửi về email sau khi đăng ký thành công để kích hoạt tài khoản.

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
  "message": "Email verified successfully",
  "token": "eyJhbGci...",
  "user": {
    "id": "...",
    "userName": "nguyenvana",
    "fullName": "Nguyễn Văn A",
    "email": "a@example.com",
    "role": "user"
  }
}
```

---

### POST `/api/auth/resend-verify-email`

Gửi lại mã OTP kích hoạt tài khoản về email.

**Request Body:**

```json
{
  "email": "a@example.com"
}
```

**Response 200:**

```json
{
  "message": "OTP resent successfully"
}
```

---

### POST `/api/auth/login`

Đăng nhập tài khoản. Trả về JWT token. Chỉ cho phép các tài khoản đã xác thực email.

**Request Body:**

```json
{
  "email": "a@example.com",
  "password": "Password123!",
  "rememberMe": false
}
```

**Response 200:**

```json
{
  "success": true,
  "token": "eyJhbGci...",
  "user": {
    "id": "...",
    "userName": "nguyenvana",
    "fullName": "Nguyễn Văn A",
    "email": "a@example.com",
    "role": "user"
  }
}
```

---

### POST `/api/auth/forgot-password`

Gửi mã OTP reset mật khẩu về email.

**Request Body:**

```json
{
  "email": "a@example.com"
}
```

**Response 200:**

```json
{
  "message": "OTP has been sent to your email",
  "email": "a@example.com"
}
```

---

### POST `/api/auth/verify-otp`

Xác thực mã OTP reset mật khẩu.

**Request Body:**

```json
{
  "email": "a@example.com",
  "otp": "654321"
}
```

**Response 200:**

```json
{
  "verified": true,
  "message": "OTP is valid"
}
```

---

### POST `/api/auth/reset-password`

Đặt lại mật khẩu mới sử dụng mã OTP đã xác nhận.

**Request Body:**

```json
{
  "email": "a@example.com",
  "otp": "654321",
  "newPassword": "NewPass456!",
  "confirmPassword": "NewPass456!"
}
```

**Response 200:**

```json
{
  "message": "Password has been reset successfully"
}
```

---

### POST `/api/auth/logout`

Đăng xuất tài khoản.

**Response 200:**

```json
{
  "message": "Logged out successfully"
}
```

---

## 2. User – `/api/users` 🔒

> Tất cả các routes yêu cầu Header `Authorization: Bearer <JWT_TOKEN>`.

### GET `/api/users/profile`

Lấy thông tin hồ sơ người dùng hiện tại từ token.

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

Cập nhật thông tin hồ sơ của người dùng hiện tại.

**Request Body:**

```json
{
  "fullName": "Nguyễn Văn B",
  "avatar": "https://new-avatar-url.com/img.jpg"
}
```

**Response 200:**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "_id": "...",
    "userName": "nguyenvana",
    "fullName": "Nguyễn Văn B",
    "email": "a@example.com",
    "avatar": "https://new-avatar-url.com/img.jpg"
  }
}
```

---

### PUT `/api/users/change-password`

Đổi mật khẩu tài khoản trực tiếp từ màn hình Settings.

**Request Body:**

```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456!"
}
```

**Response 200:**

```json
{
  "success": true,
  "message": "Thay đổi mật khẩu thành công"
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

Nộp bài phỏng vấn tiêu chuẩn và nhận kết quả chấm điểm từ AI.

**Request Body:**

```json
{
  "topic": "JavaScript",
  "difficulty": "medium",
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
  },
  "answers": {
    "mcq_0": "B",
    "text_0": "Event loop là cơ chế giúp Node.js thực thi bất đồng bộ..."
  }
}
```

**Response 200:**

```json
{
  "success": true,
  "results": {
    "totalScore": 75,
    "mcq": [
      {
        "question": "Closure trong JavaScript là gì?",
        "options": [ ... ],
        "userAnswer": "B",
        "correctAnswer": "B",
        "isCorrect": true,
        "score": 10,
        "explanation": "..."
      }
    ],
    "text": [
      {
        "question": "Giải thích Event Loop trong Node.js",
        "idealAnswerKeywords": [ ... ],
        "sampleAnswer": "...",
        "userAnswer": "Event loop là cơ chế...",
        "score": 5,
        "explanation": "...",
        "feedback": "..."
      }
    ]
  }
}
```

---

### GET `/api/interview/history`

Lấy danh sách lịch sử phỏng vấn tiêu chuẩn của user hiện tại.

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

Lấy chi tiết một bài phỏng vấn tiêu chuẩn cụ thể.

**Response 200:**

```json
{
  "success": true,
  "history": {
    "_id": "...",
    "userId": "...",
    "topic": "JavaScript",
    "difficulty": "medium",
    "mcqResults": [...],
    "textResults": [...],
    "totalScore": 75,
    "completedAt": "..."
  }
}
```

---

## 4. CV Interview – `/api/cv` 🔒

### POST `/api/cv/upload`

Tải lên file CV (PDF) để trích xuất thông tin.

- Yêu cầu Header `Authorization: Bearer <JWT_TOKEN>`.
- Sử dụng `multipart/form-data` với field `cv`.
- Server trích xuất nội dung và trả về danh sách kỹ năng gợi ý.

**Response 200:**

```json
{
  "success": true,
  "fullName": "Nguyễn Đình Hiếu",
  "skills": {
    "frontend": ["React", "HTML", "CSS"],
    "backend": ["Node.js", "Express"],
    "theory": ["OOP", "Data Structures"],
    "devops": ["Docker", "Git"]
  },
  "rawText": "...",
  "fileName": "CV_NguyenDinhHieu.pdf"
}
```

---

### POST `/api/cv/analyze-text`

Phân tích nội dung văn bản CV đã trích xuất (không yêu cầu upload lại file).

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
  "skills": {
    "frontend": ["React", "HTML"],
    "backend": ["Node.js"],
    "theory": ["OOP"],
    "devops": ["Docker"]
  }
}
```

---

### POST `/api/cv/generate-questions`

Sinh bộ câu hỏi phỏng vấn dựa trên nội dung CV và kỹ năng được chọn.

**Request Body:**

```json
{
  "cvText": "...",
  "selectedSkills": {
    "frontend": ["React"],
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
    "mcq": [
      {
        "question": "...",
        "options": [...],
        "correctAnswer": "A"
      }
    ],
    "text": [
      {
        "question": "..."
      }
    ]
  }
}
```

---

### POST `/api/cv/submit-answers`

Nộp câu trả lời cho bài phỏng vấn CV và lưu kết quả.

**Request Body:**

```json
{
  "questions": {
    "mcq": [...],
    "text": [...]
  },
  "answers": {
    "mcq_0": "A",
    "text_0": "..."
  },
  "selectedSkills": ["React", "Node.js", "OOP", "Docker"],
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
    "summary": {
      "overall": "...",
      "strengths": ["..."],
      "weaknesses": ["..."],
      "suggestions": ["..."]
    }
  }
}
```

---

### GET `/api/cv/history`

Lấy danh sách lịch sử phỏng vấn CV của user hiện tại.

**Response 200:**

```json
{
  "success": true,
  "history": [
    {
      "_id": "...",
      "cvName": "CV_NguyenDinhHieu.pdf",
      "topic": ["React", "Node.js"],
      "totalScore": 88,
      "createdAt": "..."
    }
  ]
}
```

---

### GET `/api/cv/history/:id`

Lấy chi tiết bài phỏng vấn CV theo ID.

**Response 200:**

```json
{
  "success": true,
  "history": {
    "_id": "...",
    "userId": "...",
    "cvName": "CV_NguyenDinhHieu.pdf",
    "topic": [...],
    "questions": {...},
    "answers": {...},
    "results": {...},
    "totalScore": 88,
    "summary": {...},
    "createdAt": "..."
  }
}
```

---

## 5. Adaptive Interview – `/api/adaptive` 🔒

> Yêu cầu Header `Authorization: Bearer <JWT_TOKEN>`.

### POST `/api/adaptive/start`

Bắt đầu session phỏng vấn thích ứng mới.

**Request Body:**

```json
{
  "topic": "React",
  "difficulty": "medium"
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
    "difficulty": "medium"
  }
}
```

---

### POST `/api/adaptive/answer`

Gửi câu trả lời tự luận hiện tại, nhận đánh giá tức thì và câu hỏi tiếp theo với độ khó được tự động điều chỉnh. Khi đạt giới hạn số câu hỏi, hệ thống trả về báo cáo tổng kết và lộ trình học tập.

**Request Body:**

```json
{
  "sessionId": "...",
  "answer": "React Hook là các hàm cho phép..."
}
```

**Response 200 (Nếu chưa hoàn thành):**

```json
{
  "success": true,
  "evaluation": {
    "score": 8,
    "feedback": "Câu trả lời tốt, nhưng cần đề cập thêm..."
  },
  "nextQuestion": {
    "content": "Giải thích useCallback vs useMemo",
    "difficulty": "hard",
    "type": "text"
  },
  "sessionComplete": false
}
```

**Response 200 (Nếu đã kết thúc session):**

```json
{
  "success": true,
  "evaluation": {
    "score": 9,
    "feedback": "..."
  },
  "sessionComplete": true,
  "finalScore": 8.5,
  "summary": {
    "overall": "...",
    "strengths": ["..."],
    "weaknesses": ["..."]
  },
  "detailedReport": { ... },
  "roadmap": {
    "structured": { ... },
    "flattened": [...]
  }
}
```

---

### GET `/api/adaptive/history`

Danh sách lịch sử Adaptive sessions của user.

**Response 200:**

```json
{
  "success": true,
  "history": [
    {
      "_id": "...",
      "topic": "React",
      "difficulty": "medium",
      "status": "completed",
      "finalScore": 8.5,
      "createdAt": "..."
    }
  ]
}
```

---

### GET `/api/adaptive/session/:sessionId`

Lấy thông tin chi tiết của một Adaptive session theo Session ID.

**Response 200:**

```json
{
  "success": true,
  "session": {
    "_id": "...",
    "topic": "React",
    "status": "completed",
    "conversation": [...],
    "finalScore": 8.5,
    "summary": {...},
    "roadmapStructured": {...},
    "roadmapFlattened": [...]
  }
}
```

---

## 6. Weakness Analysis – `/api/weakness` 🔒

### GET `/api/weakness/me`

Phân tích điểm mạnh, điểm yếu và đưa ra gợi ý ôn luyện dựa trên lịch sử phỏng vấn của user.

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
  "strengths": [{ "topic": "HTML/CSS", "averageScore": 88 }]
}
```

---

## 7. Live Coding – `/api/live-coding` 🔒

> Tất cả các route Live Coding yêu cầu Header `Authorization: Bearer <JWT_TOKEN>`.

### GET `/api/live-coding/domains`

Lấy danh sách domain lập trình theo ngôn ngữ.

**Query:**

- `language` (string) – ví dụ `javascript`, `python`, `java`

**Response 200:**

```json
{
  "domains": [
    "OOP",
    "Functional Programming",
    "Async",
    "DOM Manipulation",
    "Closures"
  ]
}
```

---

### GET `/api/live-coding/topics`

Lấy danh sách các topics dựa trên ngôn ngữ và domain lập trình.

**Query:**

- `language` (string)
- `domain` (string)

**Response 200:**

```json
{
  "topics": [
    "Prototypes",
    "Classes",
    "Inheritance",
    "Polymorphism",
    "Encapsulation"
  ]
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

Lấy câu hỏi code/giải thích hiện tại của session.

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

Gửi mã nguồn lập trình để AI biên dịch và đánh giá thuật toán.

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

Gửi câu trả lời giải thích (Q&A) sau khi giải đúng bài code.

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

Yêu cầu sinh câu hỏi coding mới sau khi đã hoàn tất toàn bộ câu hỏi giải thích.

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

Lấy báo cáo đánh giá cuối cùng của session từ database.

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

Lấy danh sách các session Live Coding đã thực hiện của user.

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

Lấy chi tiết lịch sử một session Live Coding cụ thể (bao gồm danh sách toàn bộ code đã nộp).

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
    "codeHistory": [
      {
        "code": "...",
        "problemStatement": "...",
        "submittedAt": "...",
        "explainAnswers": [...],
        "evaluation": {...}
      }
    ]
  }
}
```

---

## 8. Activity – `/api/activity` 🔒

### GET `/api/activity`

Lấy danh sách dữ liệu hoạt động luyện tập hàng ngày của người dùng (phục vụ vẽ ActivityCalendar heatmap).

**Response 200:**

```json
{
  "success": true,
  "activities": [
    { "date": "2024-01-15T00:00:00.000Z", "type": "interview" },
    { "date": "2024-01-16T00:00:00.000Z", "type": "adaptiveinterview" }
  ]
}
```

---

## 9. Health Check

### GET `/health`

Kiểm tra tình trạng hoạt động của máy chủ backend.

**Response 200:**

```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

---

## 10. Admin APIs – Quản trị hệ thống 🔒

> **Yêu cầu Header:** `Authorization: Bearer <JWT_TOKEN>` và tài khoản phải có role `admin`.

### 10.1 Quản lý Người dùng

#### GET `/api/users/admin/users`

Lấy danh sách tất cả người dùng hệ thống.

- **Query:** `limit`, `page`

#### GET `/api/users/admin/users/stats`

Lấy thống kê tổng quan người dùng (tổng số, số người đã verify, số lượng admin).

#### GET `/api/users/admin/users/:id`

Lấy thông tin chi tiết của một người dùng theo ID.

#### PUT `/api/users/admin/users/:id`

Cập nhật thông tin/quyền hạn của người dùng từ phía admin.

#### PUT `/api/users/admin/users/:id/reset-password`

Reset mật khẩu của người dùng từ phía admin.

#### DELETE `/api/users/admin/users/:id`

Xóa tài khoản người dùng khỏi hệ thống.

---

### 10.2 Quản lý Phỏng Vấn (Standard)

#### GET `/api/interview/admin/interviews`

Lấy danh sách toàn bộ lịch sử phỏng vấn của tất cả người dùng.

#### GET `/api/interview/admin/interviews/stats`

Thống kê số lượng phỏng vấn, điểm trung bình,...

#### GET `/api/interview/admin/interviews/:id`

Lấy chi tiết một bài phỏng vấn bất kỳ.

#### DELETE `/api/interview/admin/interviews/:id`

Xóa bản ghi phỏng vấn khỏi hệ thống.

---

### 10.3 Quản lý CV Sessions

#### GET `/api/cv/admin/sessions`

Lấy danh sách toàn bộ CV sessions trên hệ thống.

#### GET `/api/cv/admin/sessions/:id`

Xem chi tiết một CV session bất kỳ.

#### DELETE `/api/cv/admin/sessions/:id`

Xóa CV session khỏi hệ thống.

---

### 10.4 Quản lý Adaptive Sessions

#### GET `/api/adaptive/admin/sessions`

Lấy danh sách toàn bộ các phiên phỏng vấn thích ứng (Adaptive) của tất cả người dùng trên hệ thống.

#### GET `/api/adaptive/admin/session/:sessionId`

Xem thông tin chi tiết một phiên phỏng vấn thích ứng cụ thể (bao gồm lịch sử chat, đánh giá, roadmap).

#### DELETE `/api/adaptive/admin/session/:sessionId`

Xóa bản ghi phỏng vấn thích ứng khỏi hệ thống.

---

### 10.5 Quản lý Live Coding Sessions

#### GET `/api/live-coding/admin/sessions`

Lấy danh sách toàn bộ các phiên Live Coding của tất cả người dùng trên hệ thống.

#### GET `/api/live-coding/admin/sessions/:id`

Xem chi tiết lịch sử một phiên Live Coding cụ thể (bao gồm toàn bộ code nộp, lịch sử Q&A giải thích, test criteria).

#### DELETE `/api/live-coding/admin/sessions/:id`

Xóa phiên Live Coding khỏi hệ thống.

---

### 10.6 Quản lý Question Bank

#### GET `/api/admin/questions`

Lấy danh sách câu hỏi MCQ có hỗ trợ filter, search, pagination và thống kê tổng quan.

- **Query:** `page`, `limit`, `programmingLanguage`, `difficulty`, `tags`, `search`, `isActive`, `isFeatured`

#### POST `/api/admin/questions`

Tạo câu hỏi mới cho Question Bank.

- **Body:** `question`, `options` (`A/B/C/D`), `correctAnswer`, `explanation`, `programmingLanguage`, `difficulty`, `tags`, `isFeatured`

#### PUT `/api/admin/questions/:id`

Cập nhật câu hỏi (trạng thái active/featured, nội dung đáp án, giải thích, tags).

#### DELETE `/api/admin/questions/:id`

Xóa câu hỏi khỏi hệ thống. Chỉ cho phép xóa khi câu hỏi đã bị vô hiệu hóa và không còn nằm trong bộ đề active.

#### POST `/api/admin/questions/import`

Import danh sách câu hỏi từ file Excel (.xlsx/.xls).

#### GET `/api/admin/questions/export`

Export toàn bộ câu hỏi hiện có ra file Excel.

#### GET `/api/admin/programming-languages`

Lấy danh sách ngôn ngữ lập trình đang có câu hỏi trong hệ thống.

---

### 10.7 Quản lý Exam Sets

#### GET `/api/admin/exam-sets`

Lấy danh sách các bộ đề thi, hỗ trợ filter theo ngôn ngữ và search theo tên.

#### GET `/api/admin/exam-sets/:id`

Lấy chi tiết một bộ đề thi cùng danh sách câu hỏi bên trong.

#### POST `/api/admin/exam-sets`

Tạo bộ đề thi mới từ các câu hỏi active có sẵn trong Question Bank.

- **Body:** `name`, `programmingLanguage`, `description`, `numberOfQuestions`

#### PUT `/api/admin/exam-sets/:id`

Cập nhật thông tin bộ đề, bao gồm tên, mô tả và trạng thái active/inactive.

#### DELETE `/api/admin/exam-sets/:id`

Xóa vĩnh viễn một bộ đề thi.

#### POST `/api/admin/exam-sets/:id/questions`

Thêm câu hỏi vào bộ đề thi.

#### DELETE `/api/admin/exam-sets/:id/questions/:questionId`

Xóa câu hỏi khỏi bộ đề thi.

---

## 11. HTTP Status Codes

| Code | Ý Nghĩa                                          |
| ---- | ------------------------------------------------ |
| 200  | Thành công (Success)                             |
| 201  | Tạo mới thành công (Created)                     |
| 400  | Dữ liệu đầu vào không hợp lệ (Bad Request)       |
| 401  | Chưa xác thực / JWT Token hết hạn (Unauthorized) |
| 403  | Không có quyền truy cập (Forbidden)              |
| 404  | Không tìm thấy tài nguyên (Not Found)            |
| 500  | Lỗi hệ thống server (Internal Server Error)      |
