/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#1a4f8a',
          'blue-dark': '#153e6e',
          'blue-light': '#2563b0',
          'blue-pale': '#e8f0f9',
          dark: '#1a1a1a',
          gray: '#4a4a4a',
          'light-blue': '#dbeafe',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"EB Garamond"', 'serif'],
      },
    },
  },
  plugins: [],
}
