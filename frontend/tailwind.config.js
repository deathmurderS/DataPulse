/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sakura: {
          50:  '#fff5f7',
          100: '#ffe0e8',
          200: '#ffb8cb',
          300: '#ff8fab',
          400: '#ff6b8a',
          500: '#f04e71',
          600: '#d63a5c',
        },
        peach: {
          50:  '#fff8f3',
          100: '#fdebd8',
          200: '#fad3b0',
          300: '#f5b07a',
          400: '#ef8c47',
          500: '#e86e1f',
        },
        lavender: {
          100: '#ede9f7',
          200: '#d8cff0',
          300: '#b9a9e3',
          400: '#9a84d5',
          500: '#7c60c4',
        },
        cream: {
          50:  '#fffef9',
          100: '#fdf8ee',
          200: '#f9efd6',
          300: '#f2e0b8',
        },
        mist: {
          700: '#5a4f6a',
          800: '#3e3549',
          900: '#2a2133',
        },
      },
      fontFamily: {
        sans: ['"M PLUS Rounded 1c"', 'ui-rounded', 'system-ui', 'sans-serif'],
        display: ['"Quicksand"', 'ui-rounded', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'sakura': '0 4px 24px -4px rgba(240, 78, 113, 0.15)',
        'soft': '0 2px 16px -2px rgba(60, 40, 80, 0.10)',
        'card': '0 8px 32px -8px rgba(90, 60, 100, 0.13)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'float': 'float 4s ease-in-out infinite',
        'petal': 'petalFall 8s linear infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
        petalFall: {
          '0%': { transform: 'translateY(-20px) rotate(0deg)', opacity: '0.8' },
          '100%': { transform: 'translateY(100vh) rotate(360deg)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
