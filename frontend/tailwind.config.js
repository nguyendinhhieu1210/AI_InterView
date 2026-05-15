/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Tông màu sáng (off-white, xám nhẹ)
        light: {
          bg: '#f8fafc',
          card: '#ffffff',
          border: '#e2e8f0',
          text: '#0f172a',
          textMuted: '#475569',
        },
        // Tông màu tối (xám đen, không phải đen tuyệt đối)
        dark: {
          bg: '#0a0c10',
          card: '#111827',
          border: '#1f2937',
          text: '#f1f5f9',
          textMuted: '#94a3b8',
        }
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