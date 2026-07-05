/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: {
          950: '#0C0E10',
          900: '#14171A',
          850: '#191D20',
          800: '#1D2124',
          700: '#2A2F33',
        },
        paper: {
          DEFAULT: '#EDEAE2',
          dim: '#9BA0A6',
          faint: '#5C6167',
        },
        pulse: {
          DEFAULT: '#FFB020',
          dim: '#7A5200',
          soft: 'rgba(255,176,32,0.12)',
        },
        signal: {
          teal: '#4FBDAE',
          rose: '#E1637A',
          slate: '#7C93B8',
          olive: '#A9A15C',
          plum: '#B084C4',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'trace': 'trace 3.2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        trace: {
          '0%': { strokeDashoffset: '240' },
          '100%': { strokeDashoffset: '0' },
        },
      },
    },
  },
  plugins: [],
}
