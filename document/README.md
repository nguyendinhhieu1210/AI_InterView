# 📚 Tài Liệu Dự Án – AI InterView

Thư mục này chứa toàn bộ tài liệu kỹ thuật của hệ thống **AI InterView** – nền tảng phỏng vấn thử thông minh được hỗ trợ bởi AI.

---

## 📁 Cấu Trúc Thư Mục Tài Liệu

```
document/
├── README.md                          ← File này
├── 00_product_backlog/
│   └── product_backlog.md             ← Product Backlog theo MoSCoW
├── 01_overview/
│   ├── system_overview.md             ← Tổng quan hệ thống
│   ├── use_case.md                    ← Biểu đồ Use Case
│   └── user_flow.md                   ← Luồng người dùng chính
├── 02_architecture/
│   ├── architecture.md                ← Kiến trúc tổng thể
│   └── database_schema.md             ← Sơ đồ cơ sở dữ liệu
├── 03_frontend/
│   ├── frontend_setup.md              ← Khởi tạo & cấu trúc frontend
│   ├── components.md                  ← Mô tả các component
│   └── uiux_guideline.md             ← Hướng dẫn UI/UX
├── 04_backend/
│   ├── backend_setup.md               ← Khởi tạo & cấu trúc backend
│   └── api_reference.md               ← Tài liệu API đầy đủ
├── 05_git_workflow/
│   ├── git_workflow.md                ← Quy trình Git & làm việc nhóm
│   └── coding_convention.md           ← Coding Convention
└── 06_sprints/
    ├── sprint_log.md                  ← Tổng hợp tiến độ Sprint
    ├── sprint_0.md ~ sprint_9.md      ← Chi tiết từng Sprint
```

---

## 🚀 Giới Thiệu Nhanh

| Hạng mục       | Công nghệ                                                      |
| -------------- | -------------------------------------------------------------- |
| Frontend       | React 19, TailwindCSS 3, Framer Motion, Chart.js, Recharts     |
| Backend        | Node.js, Express 5, MongoDB (Mongoose 9)                       |
| AI Engine      | Groq SDK (LLaMA), Google Generative AI (Gemini)                |
| Authentication | JWT (Access + Refresh Token), bcryptjs, OTP qua email          |
| File Upload    | Multer, pdf-parse, mammoth                                     |
| Code Editor    | Monaco Editor (@monaco-editor/react)                           |
| Admin          | Quản lý Users, Question Bank, Exam Sets, Sessions, Token Usage |

---

> Xem chi tiết từng phần theo các file tài liệu trong thư mục con tương ứng.
