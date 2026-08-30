/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        chinese: {
          red: '#DC2626',       // Đỏ Chu Sa
          crimson: '#991B1B',   // Đỏ thẫm
          gold: '#D97706',      // Vàng Kim
          amber: '#F59E0B',
          jade: '#0D9488',      // Xanh Ngọc Bích
          emerald: '#10B981',
          ink: '#0F172A',       // Đen Mực Tàu
          paper: '#FDFBF7',     // Trắng Giấy Tuyên Chỉ
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        chinese: ['"Noto Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
        calligraphy: ['"Ma Shan Zheng"', '"Noto Serif SC"', 'serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'wave': 'wave 1.2s ease-in-out infinite',
      },
      keyframes: {
        wave: {
          '0%, 100%': { transform: 'scaleY(0.4)' },
          '50%': { transform: 'scaleY(1.0)' },
        }
      }
    },
  },
  plugins: [],
}
