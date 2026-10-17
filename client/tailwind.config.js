/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        campus: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        chai: {
          50: '#fdfaf6',
          100: '#f8f2e9',
          200: '#eddcc8',
          300: '#e0c29f',
          400: '#d0a170',
          500: '#b97a3c',
          600: '#9f6029',
          700: '#7d4821',
          800: '#62371d',
          900: '#462615',
          950: '#261309',
        },
        slate: {
          850: '#151e2e',
          950: '#0b111a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
