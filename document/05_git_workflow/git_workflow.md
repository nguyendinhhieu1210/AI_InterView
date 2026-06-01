# 🔀 Git & Quy Trình Làm Việc – AI InterView

## 1. Cấu Trúc Repository

```
AI_InterView (repository GitHub)
├── frontend/     ← React frontend
├── backend/      ← Node.js backend
├── document/     ← Tài liệu dự án
└── README.md     ← Giới thiệu tổng quan
```

---

## 2. Phân Quyền Thành Viên

| Role | Quyền |
|---|---|
| **Owner / Admin** | Merge vào `main`, approve PR, manage settings |
| **Developer** | Push lên branch riêng, tạo PR vào `develop` |
| **Reviewer** | Review code, comment PR |

**Nhánh được bảo vệ (Protected Branches):**
- `main` – Chỉ admin merge, luôn là code ổn định
- `develop` – Nhánh tích hợp, merge từ feature branches

---

## 3. Mô Hình Branch (Git Flow)

```
main
  │
  └── develop
         │
         ├── feature/auth-register
         ├── feature/interview-page
         ├── feature/cv-upload
         ├── fix/otp-validation-bug
         └── hotfix/jwt-expiry-fix
```

### Quy Tắc Đặt Tên Branch

| Loại | Prefix | Ví dụ |
|---|---|---|
| Tính năng mới | `feature/` | `feature/adaptive-interview` |
| Sửa bug | `fix/` | `fix/cv-parsing-error` |
| Sửa khẩn cấp trên prod | `hotfix/` | `hotfix/login-crash` |
| Cải tiến hiệu suất | `perf/` | `perf/interview-api-cache` |
| Cập nhật tài liệu | `docs/` | `docs/api-reference-update` |
| Refactor code | `refactor/` | `refactor/auth-controller` |

### Tạo Branch Mới
```bash
# Luôn tạo branch từ develop (không phải main)
git checkout develop
git pull origin develop
git checkout -b feature/ten-tinh-nang
```

---

## 4. Quy Tắc Commit (Conventional Commits)

### Format
```
<type>(<scope>): <mô tả ngắn gọn bằng tiếng Anh hoặc Việt>

[body - tùy chọn, giải thích chi tiết]

[footer - tùy chọn, đóng issue]
```

### Các Type Hợp Lệ

| Type | Ý Nghĩa | Ví Dụ |
|---|---|---|
| `feat` | Tính năng mới | `feat(auth): add OTP email verification` |
| `fix` | Sửa lỗi | `fix(cv): correct name extraction from PDF` |
| `docs` | Cập nhật tài liệu | `docs: add API reference for /api/cv` |
| `style` | Format code (không đổi logic) | `style: format authController with prettier` |
| `refactor` | Tái cấu trúc code | `refactor(interview): split service into modules` |
| `perf` | Cải thiện hiệu suất | `perf(db): add index to interviewresults.userId` |
| `test` | Thêm/sửa tests | `test(auth): add unit test for JWT middleware` |
| `chore` | Công việc bảo trì | `chore: update dependencies` |
| `revert` | Revert commit | `revert: feat(auth): add OTP email verification` |

### Ví Dụ Commit Tốt
```bash
git commit -m "feat(interview): add adaptive difficulty adjustment

- AI now evaluates each answer and adjusts next question difficulty
- Added AdaptiveSession model to store session history
- Updated /api/adaptive/answer endpoint response format

Closes #42"
```

### Commit Xấu (Tránh)
```bash
# ❌ Quá chung chung
git commit -m "fix bug"
git commit -m "update"
git commit -m "done"

# ❌ Commit quá nhiều thứ cùng lúc
git commit -m "fix bug, add feature, update style, ..."
```

### Quy Tắc Vàng
- ✅ Mỗi commit chỉ làm **một việc**
- ✅ Commit thường xuyên (sau mỗi task nhỏ)
- ✅ Dòng đầu tối đa **72 ký tự**
- ✅ Dùng động từ thì hiện tại: "add", "fix", "update" (không phải "added")

---

## 5. Quy Trình Làm Việc (Workflow)

### Bước 1: Bắt đầu task mới
```bash
# 1. Cập nhật develop
git checkout develop
git pull origin develop

# 2. Tạo branch mới
git checkout -b feature/ten-task
```

### Bước 2: Làm việc & commit
```bash
# 3. Code...

# 4. Stage thay đổi
git add .                      # Hoặc cụ thể: git add src/components/X.jsx

# 5. Commit
git commit -m "feat(scope): mô tả"

# 6. Lặp lại bước 3-5 cho đến khi xong task
```

### Bước 3: Push & tạo Pull Request
```bash
# 7. Push branch lên remote
git push origin feature/ten-task

# 8. Vào GitHub → tạo Pull Request từ feature/... vào develop
```

### Bước 4: Code Review
- Assign ít nhất **1 người review**
- Reviewer comment, yêu cầu thay đổi nếu cần
- Author sửa và push lại (commit thêm vào branch)
- Reviewer approve

### Bước 5: Merge
```bash
# Dùng "Squash and Merge" hoặc "Merge Commit" (thống nhất trong team)
# Sau khi merge → xóa branch feature
```

### Bước 6: Đồng bộ
```bash
git checkout develop
git pull origin develop
git branch -d feature/ten-task   # Xóa branch local
```

---

## 6. Quy Trình Merge vào Main (Release)

```bash
# Khi develop ổn định, sẵn sàng release:
git checkout main
git pull origin main
git merge develop
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin main --tags
```

---

## 7. Xử Lý Conflict

```bash
# Khi có conflict sau khi merge/rebase
git status               # Xem file conflict
# → Sửa file conflict (xóa markers <<<, ===, >>>)
git add .
git commit -m "fix: resolve merge conflict in X"
```

---

## 8. .gitignore Quan Trọng

```gitignore
# Dependencies
node_modules/

# Environment
.env
.env.local
.env.production

# Uploads (CV files)
backend/uploads/*
!backend/uploads/.gitkeep

# Build
frontend/build/

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
```

---

## 9. Checklist Trước Khi Tạo PR

- [ ] Code chạy được, không lỗi console
- [ ] Đã test tính năng trên local
- [ ] Không commit file `.env`
- [ ] Không commit `node_modules`
- [ ] Tên branch và commit message đúng quy ước
- [ ] PR description mô tả rõ thay đổi gì
- [ ] Assign reviewer

---

## 10. Quick Reference Commands

```bash
# Xem trạng thái
git status
git log --oneline -10

# Stash (lưu tạm thay đổi)
git stash
git stash pop

# Undo commit cuối (giữ thay đổi)
git reset --soft HEAD~1

# Xem diff
git diff
git diff --staged

# Xem branches
git branch -a
```
