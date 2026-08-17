/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // 启用手动切换黑暗模式
  theme: {
    extend: {
      // 可以在这里自定义你的“薄荷汽水”主题色
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9', // Sky blue
          600: '#0284c7',
        }
      }
    },
  },
  plugins: [],
}