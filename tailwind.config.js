/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
     colors: {
  primary: '#161a1f',
  secondary: '#0d0f12',
  accent: '#c8a96e',
},
    },
  },
  plugins: [],
}
