/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      boxShadow: {
        'glow-blue': '0 0 14px rgba(56, 189, 248, 0.55)',
        'glow-amber': '0 0 14px rgba(245, 158, 11, 0.65)',
        'glow-red': '0 0 18px rgba(239, 68, 68, 0.85)',
      },
      keyframes: {
        cellPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
      },
      animation: {
        cellPulse: 'cellPulse 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
