/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f3f0ff',
          100: '#e9e5ff',
          200: '#d4ccff',
          300: '#b8a6ff',
          400: '#9775ff',
          500: '#7c3aff',  // Lavender primary
          600: '#6d28d9',
          700: '#5b21b6',
          800: '#4c1d95',
          900: '#3c1a78',
        },
        accent: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',  // Mint accent
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        neutral: {
          50: '#fefefe',
          100: '#fdfdfd',
          200: '#f9f9f9',  // Cream
          300: '#f5f5f5',
          400: '#e5e5e5',
          500: '#a3a3a3',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        wellness: {
          calm: '#e6e6fa',     // Lavender
          growth: '#98fb98',    // Pale green  
          trust: '#f5f5dc',    // Beige/Cream
          peace: '#b19cd9',    // Light purple
          hope: '#90ee90',     // Light green
        }
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'display': ['Poppins', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
        'float-slow': 'float-slow 8s ease-in-out infinite',
        'float-medium': 'float-medium 6s ease-in-out infinite',
        'float-fast': 'float-fast 4s ease-in-out infinite',
        'wave-slow': 'wave-slow 20s linear infinite',
        'wave-medium': 'wave-medium 15s linear infinite',
        'particle-slow': 'particle-slow 8s ease-in-out infinite',
        'particle-medium': 'particle-medium 6s ease-in-out infinite',
        'particle-fast': 'particle-fast 4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(180deg)' },
        },
        'float-medium': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-15px) rotate(270deg)' },
        },
        'float-fast': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-10px) rotate(360deg)' },
        },
        'wave-slow': {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        'wave-medium': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0%)' },
        },
        'particle-slow': {
          '0%': { opacity: '0', transform: 'translateY(0px)' },
          '50%': { opacity: '1' },
          '100%': { opacity: '0', transform: 'translateY(-100px)' },
        },
        'particle-medium': {
          '0%': { opacity: '0', transform: 'translateY(0px)' },
          '50%': { opacity: '0.8' },
          '100%': { opacity: '0', transform: 'translateY(-80px)' },
        },
        'particle-fast': {
          '0%': { opacity: '0', transform: 'translateY(0px)' },
          '50%': { opacity: '0.6' },
          '100%': { opacity: '0', transform: 'translateY(-60px)' },
        },
      },
    },
  },
  plugins: [],
}