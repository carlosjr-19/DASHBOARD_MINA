/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Comfortaa', 'cursive', 'sans-serif'],
        mono: ['Comfortaa', 'cursive', 'sans-serif'],
      },
      colors: {
        mina: {
          dark: '#1e2022',
          card: '#292b2d',
          accent: '#e65c00'
        }
      }
    },
  },
  plugins: [],
}
