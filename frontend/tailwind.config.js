/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          // Per-customer palette: CSS variables are generated from customers/<slug>/config.json by scripts/apply-customer.mjs
          blue: 'rgb(var(--brand-blue) / <alpha-value>)',
          'blue-dark': 'rgb(var(--brand-blue-dark) / <alpha-value>)',
          'blue-light': 'rgb(var(--brand-blue-light) / <alpha-value>)',
          'blue-pale': 'rgb(var(--brand-blue-pale) / <alpha-value>)',
          'light-blue': 'rgb(var(--brand-light-blue) / <alpha-value>)',
          sidebar: 'rgb(var(--brand-sidebar) / <alpha-value>)',
          dark: '#1a1a1a',
          gray: '#4a4a4a',
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
