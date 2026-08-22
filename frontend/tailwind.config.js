/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        secondary: '#4f46e5',
        danger: '#dc2626',
        success: '#16a34a',
        warning: '#f59e0b'
      }
    },
  },
  plugins: [],
}
