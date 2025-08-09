/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Make sure Tailwind scans your React files
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5',   // Indigo 600-ish
        secondary: '#9333EA', // Purple 600-ish
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Optional: add a nice font
      },
    },
  },
  plugins: [],
};
