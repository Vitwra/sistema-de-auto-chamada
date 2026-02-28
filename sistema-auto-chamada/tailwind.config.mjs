/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f2f4f5',
          100: '#e4e8ea',
          200: '#c9d1d5',
          300: '#90A4AE',
          400: '#6d8692',
          500: '#51666C',
          600: '#51666C',
          700: '#3d4f54',
          800: '#2f3d42',
          900: '#212c30',
        },
      },
      boxShadow: {
        card: '0 10px 35px rgba(81, 102, 108, 0.12)',
      },
    },
  },
  plugins: [],
}

