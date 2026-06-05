/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Màu nền sáng / tối dùng chung
        bgLight: '#f8fafc',
        bgDark: '#0a0c10',
        cardLight: '#ffffff',
        cardDark: '#111827',
        borderLight: '#e2e8f0',
        borderDark: '#1f2937',
        textLight: '#0f172a',
        textDark: '#f1f5f9',
        textMutedLight: '#475569',
        textMutedDark: '#94a3b8',
      },
      transitionProperty: {
        'colors': 'background-color, border-color, color, fill, stroke',
      },
      transitionDuration: {
        '300': '300ms',
      }
    },
  },
  plugins: [],
}