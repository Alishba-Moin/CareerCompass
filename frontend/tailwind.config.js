/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FAF6EF',
        sand: '#F2EADB',
        parchment: '#FFFFFF',
        line: '#E7DCC6',
        mocha: '#7A6A58',
        // Explicit alias used across components (same value as brown.dark)
        brownDark: '#3F2E1E',
        gold: { light: '#EAD9A0', DEFAULT: '#C9A227', dark: '#96761C' },
        brown: { light: '#8B6F47', DEFAULT: '#6F4E2E', dark: '#3F2E1E' },
        success: '#3E6B3E',
        clay: '#B3402A',
      },
      fontFamily: {
        display: ['Fraunces', 'Noto Nastaliq Urdu', 'serif'],
        body: ['Manrope', 'Noto Nastaliq Urdu', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(63,46,30,0.05), 0 8px 24px -12px rgba(63,46,30,0.12)',
        'card-hover': '0 2px 4px rgba(63,46,30,0.06), 0 16px 40px -16px rgba(63,46,30,0.18)',
      },
    },
  },
  plugins: [],
};
