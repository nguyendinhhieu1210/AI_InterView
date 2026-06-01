# ⚛️ Tài Liệu Frontend – Khởi Tạo & Cấu Trúc

## 1. Khởi Tạo Project

### Yêu Cầu Hệ Thống
- Node.js >= 18.x
- npm >= 9.x

### Lệnh Khởi Tạo
```bash
# Trong thư mục gốc dự án
npx create-react-app frontend
cd frontend

# Cài thêm thư viện
npm install react-router-dom axios framer-motion
npm install chart.js react-chartjs-2 recharts
npm install i18next react-i18next i18next-browser-languagedetector i18next-http-backend
npm install react-hot-toast lucide-react react-icons
npm install @monaco-editor/react react-pdf
npm install @headlessui/react canvas-confetti

# Dev dependencies
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Chạy Development Server
```bash
cd frontend
npm start
# → http://localhost:3000
```

---

## 2. Cấu Trúc Thư Mục Frontend

```
frontend/
├── public/
│   ├── index.html          ← HTML template chính
│   └── locales/            ← File dịch i18n (vi.json, en.json)
├── src/
│   ├── App.js              ← Root: Providers + React Router
│   ├── index.js            ← ReactDOM.render entry point
│   ├── index.css           ← Global styles
│   ├── App.css             ← App-level styles
│   ├── i18n.js             ← Cấu hình i18next
│   │
│   ├── Pages/              ← Route-level components (trang)
│   ├── components/         ← Reusable UI components
│   ├── contexts/           ← React Context providers
│   ├── services/           ← API call helpers
│   ├── store/              ← Global state (hiện chưa dùng)
│   └── assets/             ← Ảnh, icon tĩnh
│
├── tailwind.config.js      ← Cấu hình TailwindCSS
├── postcss.config.js       ← PostCSS config
└── package.json
```

---

## 3. Cấu Hình TailwindCSS

**File:** `frontend/tailwind.config.js`

```js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'class', // Toggle dark mode bằng class
  theme: {
    extend: { /* custom tokens */ }
  },
  plugins: []
}
```

**Dark mode:** Được kiểm soát bởi `ThemeContext.jsx` – thêm/xóa class `dark` vào `<html>`.

---

## 4. Context Providers (Thứ Tự Wrap)

```jsx
// App.js
<ThemeProvider>         // Dark/Light mode
  <LanguageProvider>   // VI/EN language (i18next)
    <AuthProvider>     // User auth state (JWT token, user info)
      <InterviewProvider>  // Interview state
        <Routes>...</Routes>
      </InterviewProvider>
    </AuthProvider>
  </LanguageProvider>
</ThemeProvider>
```

### AuthContext – Dữ liệu quan trọng
```js
{
  user: { _id, userName, fullName, email, avatar, role },
  token: "eyJhbGci...",
  isAuthenticated: true/false,
  login(token, user) {},
  logout() {},
  updateUser(newData) {}
}
```

---

## 5. Routing & Protected Routes

```jsx
// ProtectedRoute.jsx
// Nếu chưa đăng nhập → redirect về /login
<ProtectedRoute>
  <WelcomePage />
</ProtectedRoute>
```

Route structure:
```
Public:  /, /login, /forgot-password, /verify-otp, /reset-password
Private: /welcome, /interview, /cvinterview, /adaptive-interview,
         /live-coding, /history/*, /cv-history/*, /adaptive-history/*,
         /profile, /settings, /help
```

---

## 6. Gọi API (Services)

**File:** `frontend/src/services/api.js`
```js
// Base axios instance với base URL và JWT header tự động
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',  // proxy → http://localhost:5000
});

// Interceptor tự thêm Authorization header
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

---

## 7. Đa Ngôn Ngữ (i18n)

**File:** `frontend/src/i18n.js`

- Sử dụng **i18next** + **react-i18next**
- Ngôn ngữ: Tiếng Việt (mặc định) và Tiếng Anh
- File dịch: `public/locales/vi/translation.json` và `en/translation.json`
- Toggle trong `/settings` qua `LanguageContext`

---

## 8. UI/UX Guidelines Đã Áp Dụng

| Hạng Mục | Quy Ước |
|---|---|
| **CSS Framework** | TailwindCSS 3 (utility-first) |
| **Animations** | Framer Motion cho page transitions & micro-animations |
| **Dark Mode** | Class-based, persistent qua localStorage |
| **Màu sắc** | Palette custom trong tailwind.config |
| **Icons** | lucide-react + react-icons |
| **Notifications** | react-hot-toast (top-right, 4s) |
| **Charts** | Chart.js/Recharts cho biểu đồ analytics |
| **Code Editor** | Monaco Editor cho Live Coding |
| **Font** | System font stack (TailwindCSS default) |

---

## 9. Thư Viện Quan Trọng

| Package | Version | Vai Trò |
|---|---|---|
| react | ^19.2.5 | UI Framework |
| react-router-dom | ^7.14.2 | Routing |
| axios | ^1.16.1 | HTTP Client |
| tailwindcss | ^3.4.19 | CSS Framework |
| framer-motion | ^12.40.0 | Animations |
| chart.js + react-chartjs-2 | ^4.5.1 / ^5.3.1 | Charts |
| recharts | ^3.8.1 | Charts (alternative) |
| i18next | ^22.5.1 | i18n |
| @monaco-editor/react | ^4.7.0 | Code Editor |
| react-hot-toast | ^2.6.0 | Toast Notifications |
| lucide-react | ^1.11.0 | Icons |
