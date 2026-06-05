/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // vẫn dùng class 'dark' trên html
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Semantic tokens – lấy giá trị từ CSS variables
        bg: 'var(--bg-color)',
        text: 'var(--text-color)',
        card: 'var(--card-bg)',
        border: 'var(--border-color)',
        muted: 'var(--muted-text)',
        primary: 'var(--primary)',
        secondary: 'var(--secondary)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        error: 'var(--error)',
      },
      boxShadow: {
        soft: 'var(--shadow)',
      },
      transitionProperty: {
        colors: 'background-color, border-color, color, fill, stroke',
      },
      transitionDuration: {
        300: '300ms',
      },
    },
  },
  plugins: [],
};