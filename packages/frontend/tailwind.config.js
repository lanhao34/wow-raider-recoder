/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        guild: {
          bg: '#0f0f1a',
          card: '#1a1a2e',
          border: '#2a2a4a',
          accent: '#7c3aed',
          gold: '#f59e0b',
          text: '#e2e8f0',
          muted: '#94a3b8',
        }
      }
    },
  },
  plugins: [],
}
