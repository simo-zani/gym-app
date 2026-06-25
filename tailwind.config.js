/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: { 0: '#060b1a', 1: '#0a1228', 2: '#121d3d', 3: '#1a2a52' },
        blueGlow: '#3b82f6',
        blueSoft: '#60a5fa',
        successGreen: '#10b981',
        dangerRed: '#ef4444',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
