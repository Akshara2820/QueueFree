/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Modern color palette
        primary: {
          50: '#f0f0ff',
          100: '#e6e6fa',
          200: '#d1d1f0',
          300: '#a8a8e0',
          400: '#7a7ac8',
          500: '#483D8B',       // Main indigo
          600: '#3d3274',
          700: '#32285d',
          800: '#272046',
          900: '#1c1a2f',
        },
        background: {
          DEFAULT: '#fafafa',
          secondary: '#f5f5f5',
          accent: '#ffffff',
        },
        text: {
          DEFAULT: '#1a1a1a',
          secondary: '#666666',
          muted: '#999999',
        },
        // Status colors with modern shades
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        border: {
          DEFAULT: '#e5e7eb',
          light: '#f3f4f6',
          dark: '#d1d5db',
        },
        // Glass morphism effects
        glass: {
          50: 'rgba(255, 255, 255, 0.1)',
          100: 'rgba(255, 255, 255, 0.2)',
          200: 'rgba(255, 255, 255, 0.3)',
        },
      },
    },
  },
  plugins: [],
}

