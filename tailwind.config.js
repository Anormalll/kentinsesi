/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // <--- BU SATIR OLMAZSA KARANLIK MOD ÇALIŞMAZ!
  theme: {
    extend: {},
  },
  plugins: [],
}