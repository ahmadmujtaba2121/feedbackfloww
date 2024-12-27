/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#080C14',
        primary: '#E5E9F0',
        secondary: '#4C566A',
        accent: '#88C0D0',
        success: '#A3BE8C',
        error: '#BF616A',
        warning: '#EBCB8B',
        info: '#81A1C1',
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
