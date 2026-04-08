/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'brand-blue': '#1E459F',
        'brand-red': '#CF2A2A',
        'brand-yellow': '#FABD32',
        'brand-beige': '#E1DCCA',
        'brand-dark': '#0F172A',
      },
      fontFamily: {
        tech: ['Orbitron', 'sans-serif'],
        ui: ['Be Vietnam Pro', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
