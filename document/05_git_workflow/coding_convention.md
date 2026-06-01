# 📐 Coding Convention – AI InterView

> **Phiên bản:** 1.0 | **Ngày:** 2026-05-29  
> **Áp dụng cho:** Frontend (React) + Backend (Node.js/Express)  
> **Mục đích:** Thống nhất code style trong toàn team để dễ đọc, review, và bảo trì

---

## 1. Quy Tắc Đặt Tên (Naming Convention)

### 1.1 File & Thư Mục

| Loại File | Quy Tắc | Ví Dụ |
|---|---|---|
| React Component | **PascalCase** | `InterviewPage.jsx`, `CVInfoModal.jsx` |
| React Custom Hook | camelCase, prefix `use` | `useAuth.js`, `useInterview.js` |
| Utility / Helper | camelCase | `textUtils.js`, `skillUtils.js` |
| Backend Service | camelCase, suffix `Service` | `groqService.js`, `weaknessService.js` |
| Backend Controller | camelCase, suffix `Controller` | `authController.js`, `cvController.js` |
| Backend Route | camelCase, suffix `Routes` | `authRoutes.js`, `userRoutes.js` |
| Mongoose Model | **PascalCase** | `User.js`, `InterviewResult.js` |
| Thư mục | **camelCase** | `components/`, `services/`, `liveCoding/` |
| Constant file | UPPER_SNAKE_CASE | `TOPICS.js`, `ERROR_CODES.js` |

### 1.2 Biến & Hàm

| Loại | Quy Tắc | Ví Dụ |
|---|---|---|
| Biến thường | camelCase | `userName`, `totalScore`, `isLoading` |
| Hàm | camelCase, bắt đầu bằng động từ | `handleSubmit()`, `fetchHistory()` |
| Boolean | prefix `is` / `has` / `can` | `isVerified`, `hasError`, `canSubmit` |
| Hằng số | UPPER_SNAKE_CASE | `MAX_FILE_SIZE`, `API_BASE_URL` |
| React State setter | prefix `set` + tên state | `setIsOpen`, `setUserData` |
| Event handler | prefix `handle` | `handleLogin`, `handleFileUpload` |

### 1.3 Mongoose Schema Field

```js
// ✅ ĐÚNG – camelCase
const userSchema = new Schema({
  userName:    { type: String, required: true },
  fullName:    { type: String, required: true },
  isVerified:  { type: Boolean, default: false },
  createdAt:   { type: Date, default: Date.now },
});

// ❌ SAI
{ user_name: String }  // snake_case
{ FullName: String }   // PascalCase
```

---

## 2. Frontend (React) Convention

### 2.1 Cấu Trúc Component Chuẩn

```jsx
// 1. Imports (thứ tự bắt buộc)
import React, { useState, useEffect, useContext } from 'react';  // React core
import { motion } from 'framer-motion';                           // Libraries
import { Play } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthContext } from '../contexts/AuthContext';            // Internal
import api from '../services/api';

const MyComponent = ({ prop1, prop2, onComplete }) => {
  // 2. State
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // 3. Context
  const { user } = useContext(AuthContext);

  // 4. Effects
  useEffect(() => {
    fetchData();
  }, []);

  // 5. Handlers
  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      const res = await api.post('/endpoint', { data });
      toast.success('Thành công!');
      onComplete?.(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  // 6. Render
  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="bg-light-card dark:bg-dark-card rounded-xl p-6">
      {/* JSX */}
    </div>
  );
};

export default MyComponent;
```

### 2.2 Gọi API

```jsx
// ✅ Luôn dùng try/catch/finally
const fetchData = async () => {
  setIsLoading(true);
  try {
    const { data } = await api.get('/api/interview/history');
    setHistory(data.results);
  } catch (error) {
    toast.error(error.response?.data?.message || 'Lỗi kết nối server');
  } finally {
    setIsLoading(false);
  }
};

// ❌ SAI – không xử lý lỗi
const fetchData = async () => {
  const { data } = await api.get('/endpoint');
  setData(data);
};
```

### 2.3 TailwindCSS

```jsx
// ✅ Luôn dùng token dark mode
<div className="bg-light-card dark:bg-dark-card text-light-text dark:text-dark-text border border-light-border dark:border-dark-border rounded-xl p-6 transition-colors duration-300">

// ❌ SAI – không có dark mode
<div className="bg-white text-gray-900">

// ✅ Conditional class
<div className={`rounded-lg px-4 py-2 ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
```

---

## 3. Backend (Node.js) Convention

### 3.1 Cấu Trúc Controller

```js
// ✅ Controller: mỏng, chỉ parse req/res và gọi service
const register = async (req, res) => {
  try {
    const { userName, fullName, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
    }

    const result = await authService.register({ userName, fullName, email, password });

    return res.status(201).json({ success: true, data: result, message: 'Đăng ký thành công' });
  } catch (error) {
    console.error('[authController.register]', error.message);
    return res.status(500).json({ success: false, message: error.message || 'Lỗi server' });
  }
};
```

### 3.2 Chuẩn Response

```js
// ✅ Success
res.status(200).json({ success: true, data: { ... }, message: 'Mô tả' });

// ✅ Error
res.status(400).json({ success: false, message: 'Mô tả lỗi rõ ràng' });

// ❌ SAI
res.json({ result: data });   // không có success flag
res.send('OK');               // không phải JSON
```

### 3.3 Cấu Trúc Service

```js
// Service: chứa toàn bộ business logic, KHÔNG đụng req/res
const register = async ({ userName, fullName, email, password }) => {
  const existing = await User.findOne({ email });
  if (existing) throw new Error('Email đã được sử dụng');

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ userName, fullName, email, password: hashed });
  return user;
};
```

### 3.4 Error Logging

```js
// ✅ Prefix rõ ràng – [fileName.functionName]
console.error('[groqService.generateQuestions]', error.message);
console.error('[authController.login]', error.message);

// ❌ SAI
console.log(error);
console.log('error happened');
```

---

## 4. ESLint Configuration

### 4.1 Frontend – `frontend/.eslintrc.js`

```js
module.exports = {
  env: { browser: true, es2021: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: { ecmaFeatures: { jsx: true }, ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['react', 'react-hooks'],
  rules: {
    'no-unused-vars': 'warn',
    'no-console': ['warn', { allow: ['error', 'warn'] }],
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
  },
};
```

### 4.2 Backend – `backend/.eslintrc.js`

```js
module.exports = {
  env: { node: true, es2021: true },
  extends: ['eslint:recommended'],
  parserOptions: { ecmaVersion: 'latest' },
  rules: {
    'no-unused-vars': 'warn',
    'no-console': ['warn', { allow: ['error', 'warn', 'log'] }],
    'prefer-const': 'error',
    'no-var': 'error',
  },
};
```

---

## 5. Quy Tắc Comment

```js
// ✅ Giải thích "TẠI SAO", không phải "CÁI GÌ"
// Debounce 300ms để tránh spam API khi user gõ nhanh
const debouncedSearch = useMemo(() => debounce(handleSearch, 300), []);

// ✅ TODO có tên người
// TODO(HieuND – 2026-06-01): Thêm retry khi Groq API timeout

// ❌ SAI – comment thừa
// Tăng count lên 1
setCount(count + 1);
```

---

## 6. Những Điều KHÔNG Được Làm ❌

```
1. KHÔNG commit file .env lên Git
2. KHÔNG dùng var (chỉ dùng const / let)
3. KHÔNG console.log trong production code (dùng console.error / console.warn)
4. KHÔNG viết business logic trong Controller
5. KHÔNG hardcode URL, API key, config trong code
6. KHÔNG commit node_modules/
7. KHÔNG để catch block rỗng (phải xử lý lỗi hoặc ít nhất log)
8. KHÔNG dùng inline style để định nghĩa màu theme
```

## 7. Nên Làm ✅

```
1. Validate input ở cả frontend VÀ backend
2. Hiển thị loading state khi gọi API
3. Mỗi function chỉ làm một việc (Single Responsibility)
4. Đặt tên biến/hàm tự mô tả (self-documenting code)
5. Review code của mình trước khi tạo PR
6. Test tính năng trên local trước khi push
```
