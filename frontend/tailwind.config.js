/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#007aff',
          hover: '#0056b3',
          dark: '#0056b3',
        },
        danger: {
          DEFAULT: '#ff3b30',
          hover: '#c70000',
        },
        warning: '#ffcc00',
        background: {
          main: '#121212',
          surface: '#1e1e1e',
          'surface-hover': '#2a2a2a',
        },
        text: {
          primary: '#e0e0e0',
          secondary: '#a0a0a0',
        },
        border: '#333333',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
      },
      boxShadow: {
        sm: '0 2px 4px rgba(0,0,0,0.2)',
        md: '0 4px 12px rgba(0,0,0,0.25)',
      },
    },
  },
  plugins: [],
};
