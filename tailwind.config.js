/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#0D7377',
        'primary-light': '#14A098',
        'primary-dark': '#0A5C5F',
        secondary: '#FF6B6B',
        'secondary-light': '#FF8E8E',
        accent: '#9B59B6',
        'accent-light': '#B07CC6',
        background: '#FAFBFC',
        'background-dark': '#1A1A2E',
        surface: '#FFFFFF',
        'surface-dark': '#16213E',
        text: '#1A1A2E',
        'text-secondary': '#5A5A7A',
        'text-dark': '#FAFBFC',
        'text-secondary-dark': '#A0A0B8',
        border: '#E5E7EB',
        'border-dark': '#2D2D44',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#3B82F6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
