/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        secondary: '#1e293b',
        light: '#f8fafc',
        dark: '#0f172a',
      },
    },
  },
  plugins: [],
}

