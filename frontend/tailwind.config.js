/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef4ff',
          100: '#dbe6fe',
          200: '#bfd3fe',
          300: '#93b4fd',
          400: '#6090fa',
          500: '#3b6cf6',
          600: '#254deb',
          700: '#1d3ad8',
          800: '#1e31af',
          900: '#1e2f8a',
          950: '#171f54',
        },
        accent: {
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.35s ease-out both',
        'slide-up': 'slideUp 0.35s ease-out both',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
