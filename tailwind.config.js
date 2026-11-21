/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EAF4EF',
          100: '#D5E8DF',
          200: '#ACCFBF',
          300: '#75AE94',
          400: '#3D8C6F',
          500: '#176B52', // Primary deep forest green
          600: '#12543F', // Dark green
          700: '#0E4030',
          800: '#0A2E23',
          900: '#061D16',
        },
        forest: {
          primary: '#176B52',
          dark: '#12543F',
          soft: '#EAF4EF',
        },
        neutral: {
          bg: '#F6F7F5',
          card: '#FFFFFF',
          text: '#202B26',
          secondary: '#68746D',
          border: '#E5EAE6',
        },
        status: {
          success: '#21865B',
          warning: '#D99328',
          danger: '#D84C4C',
          info: '#4386BD',
        },
        factory: {
          50: '#F6F7F5',
          100: '#EDF1EE',
          200: '#E5EAE6',
          700: '#414D46',
          800: '#2A342F',
          900: '#1B2420',
          950: '#111714',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        card: '0 1px 3px 0 rgba(23, 107, 82, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out forwards',
      },
    },
  },
  plugins: [],
};
