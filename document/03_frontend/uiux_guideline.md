# 🎨 UI/UX Style Guideline – AI InterView

> **Phiên bản:** 1.0  
> **Mục đích:** Thống nhất thiết kế giao diện cho toàn bộ team (Designer + Frontend Dev)  
> **CSS Framework:** TailwindCSS 3 với class-based dark mode

---

## 1. Màu Sắc (Color Palette)

### 1.1 Light Mode

| Token | Hex | TailwindCSS Class | Dùng cho |
|---|---|---|---|
| `light.bg` | `#f8fafc` | `bg-light-bg` | Nền trang chính |
| `light.card` | `#ffffff` | `bg-light-card` | Nền card, modal, panel |
| `light.border` | `#e2e8f0` | `border-light-border` | Viền card, divider |
| `light.text` | `#0f172a` | `text-light-text` | Văn bản chính |
| `light.textMuted` | `#475569` | `text-light-textMuted` | Văn bản phụ, placeholder |

### 1.2 Dark Mode

| Token | Hex | TailwindCSS Class | Dùng cho |
|---|---|---|---|
| `dark.bg` | `#0a0c10` | `dark:bg-dark-bg` | Nền trang chính (dark) |
| `dark.card` | `#111827` | `dark:bg-dark-card` | Nền card, modal, panel (dark) |
| `dark.border` | `#1f2937` | `dark:border-dark-border` | Viền card (dark) |
| `dark.text` | `#f1f5f9` | `dark:text-dark-text` | Văn bản chính (dark) |
| `dark.textMuted` | `#94a3b8` | `dark:text-dark-textMuted` | Văn bản phụ (dark) |

### 1.3 Màu Nhấn (Accent Colors – Tailwind defaults)

| Vai trò | Màu | Class |
|---|---|---|
| Primary / CTA | Xanh lam | `bg-blue-600` / `text-blue-600` |
| Success | Xanh lá | `bg-green-500` / `text-green-500` |
| Warning | Vàng cam | `bg-yellow-500` / `text-yellow-500` |
| Error / Danger | Đỏ | `bg-red-500` / `text-red-500` |
| Info | Xanh nhạt | `bg-sky-500` / `text-sky-500` |

### 1.4 Quy Tắc Sử Dụng Màu

```
✅ ĐÚNG:
  className="bg-light-card dark:bg-dark-card text-light-text dark:text-dark-text"

❌ SAI:
  className="bg-white text-black"   ← không responsive với dark mode
  style={{ backgroundColor: '#fff' }} ← không dùng inline style cho màu theme
```

---

## 2. Typography (Chữ)

### 2.1 Font Stack

Sử dụng **system font stack** mặc định của TailwindCSS (không import Google Fonts):
```css
font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
             "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

### 2.2 Thang Cỡ Chữ

| Level | Class | Dùng cho |
|---|---|---|
| Heading 1 | `text-3xl font-bold` hoặc `text-4xl font-bold` | Tiêu đề trang |
| Heading 2 | `text-2xl font-semibold` | Tiêu đề section |
| Heading 3 | `text-xl font-semibold` | Tiêu đề card, panel |
| Body | `text-base` (16px) | Văn bản thông thường |
| Small / Caption | `text-sm` (14px) | Ghi chú, label phụ |
| Tiny | `text-xs` (12px) | Badge, timestamp |

### 2.3 Font Weight

| Class | Dùng khi |
|---|---|
| `font-bold` (700) | Heading chính, số điểm nổi bật |
| `font-semibold` (600) | Heading phụ, nút CTA |
| `font-medium` (500) | Label, nav items |
| `font-normal` (400) | Body text |

---

## 3. Spacing & Layout

### 3.1 Padding / Margin

Tuân theo **bội số của 4px** (hệ thống Tailwind):

| Kích thước | Value | Dùng cho |
|---|---|---|
| `p-2` | 8px | Padding nhỏ (badge, icon button) |
| `p-4` | 16px | Padding card nhỏ |
| `p-6` | 24px | Padding card chuẩn |
| `p-8` | 32px | Padding section |
| `gap-4` | 16px | Khoảng cách giữa elements |
| `gap-6` | 24px | Khoảng cách giữa cards |

### 3.2 Border Radius

| Class | Value | Dùng cho |
|---|---|---|
| `rounded` | 4px | Input, tag nhỏ |
| `rounded-lg` | 8px | Card, button |
| `rounded-xl` | 12px | Modal, panel lớn |
| `rounded-full` | 9999px | Avatar, badge tròn |

### 3.3 Container & Grid

```jsx
// Layout chính
<div className="min-h-screen bg-light-bg dark:bg-dark-bg">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    {/* Content */}
  </div>
</div>

// Grid cards
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Cards */}
</div>
```

---

## 4. Component Patterns

### 4.1 Card

```jsx
<div className="
  bg-light-card dark:bg-dark-card
  border border-light-border dark:border-dark-border
  rounded-xl p-6
  shadow-sm
  transition-colors duration-300
">
  {/* Card content */}
</div>
```

### 4.2 Primary Button (CTA)

```jsx
<button className="
  bg-blue-600 hover:bg-blue-700
  text-white font-semibold
  px-6 py-3 rounded-lg
  transition-colors duration-200
  disabled:opacity-50 disabled:cursor-not-allowed
">
  Bắt đầu phỏng vấn
</button>
```

### 4.3 Secondary Button (Ghost)

```jsx
<button className="
  border border-light-border dark:border-dark-border
  text-light-text dark:text-dark-text
  hover:bg-light-bg dark:hover:bg-dark-bg
  px-6 py-3 rounded-lg
  transition-colors duration-200
">
  Hủy
</button>
```

### 4.4 Input Field

```jsx
<input className="
  w-full
  bg-light-card dark:bg-dark-card
  border border-light-border dark:border-dark-border
  text-light-text dark:text-dark-text
  placeholder-light-textMuted dark:placeholder-dark-textMuted
  rounded-lg px-4 py-3
  focus:outline-none focus:ring-2 focus:ring-blue-500
  transition-colors duration-300
" />
```

### 4.5 Badge / Tag

```jsx
// Thành công
<span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full">
  Dễ
</span>

// Nguy hiểm
<span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-1 rounded-full">
  Khó
</span>
```

---

## 5. Animations & Transitions

### 5.1 Framer Motion – Page Transitions

Dùng `framer-motion` cho page transitions và micro-animations:

```jsx
import { motion, AnimatePresence } from 'framer-motion';

// Fade + slide up (chuẩn cho pages)
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -20 },
};

<motion.div
  variants={pageVariants}
  initial="initial"
  animate="animate"
  exit="exit"
  transition={{ duration: 0.3 }}
>
  {/* Page content */}
</motion.div>
```

### 5.2 Framer Motion – Card / Item Animations

```jsx
// Stagger children (list items xuất hiện lần lượt)
const containerVariants = {
  animate: { transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};
```

### 5.3 CSS Transitions

Sử dụng Tailwind transition utilities:
```
transition-colors duration-300   ← cho dark/light mode switch
transition-all duration-200       ← cho hover effects
```

---

## 6. Dark Mode

### 6.1 Cơ Chế

- **Class-based:** Toggle class `dark` trên `<html>` element
- **Persistent:** Lưu preference vào `localStorage`
- **Context:** Quản lý bởi `ThemeContext.jsx`

### 6.2 Pattern Bắt Buộc

Mọi component PHẢI có cả light và dark variant:

```jsx
// ✅ ĐÚNG
className="bg-light-card dark:bg-dark-card text-light-text dark:text-dark-text"

// ❌ SAI – chỉ có light
className="bg-white text-gray-900"
```

### 6.3 ThemeContext

```jsx
const { isDark, toggleTheme } = useTheme();

// Toggle
<button onClick={toggleTheme}>
  {isDark ? <SunIcon /> : <MoonIcon />}
</button>
```

---

## 7. Responsive Design

### 7.1 Breakpoints (Tailwind defaults)

| Prefix | Min Width | Thiết Bị |
|---|---|---|
| (none) | 0px | Mobile |
| `sm:` | 640px | Mobile lớn |
| `md:` | 768px | Tablet |
| `lg:` | 1024px | Desktop |
| `xl:` | 1280px | Desktop lớn |

### 7.2 Mobile-First

Luôn viết class cho mobile trước, rồi override cho desktop:

```jsx
// ✅ Mobile-first
className="text-sm md:text-base lg:text-lg"
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
className="px-4 md:px-6 lg:px-8"
```

---

## 8. Icons

Sử dụng **lucide-react** làm thư viện icon chính:

```jsx
import { Play, History, Upload, Settings } from 'lucide-react';

// Kích thước chuẩn
<Play size={20} className="text-blue-600" />
<History size={24} />
```

**react-icons** dùng bổ sung khi lucide-react không có icon cần thiết.

---

## 9. Toast Notifications

Sử dụng **react-hot-toast**:

```jsx
import toast from 'react-hot-toast';

toast.success('Đăng nhập thành công!');
toast.error('Email hoặc mật khẩu không đúng');
toast.loading('Đang xử lý...');

// Cấu hình mặc định
<Toaster position="top-right" toastOptions={{ duration: 4000 }} />
```

---

## 10. Checklist UI Review

Trước khi PR, kiểm tra:

- [ ] Component có đầy đủ dark mode classes chưa?
- [ ] Responsive trên mobile (< 768px) ổn không?
- [ ] Có transition khi hover/focus chưa?
- [ ] Màu sắc dùng đúng token trong tailwind.config chưa?
- [ ] Spacing tuân thủ bội số 4px chưa?
- [ ] Icon dùng lucide-react (size nhất quán)?
- [ ] Toast message rõ ràng, ngắn gọn?
