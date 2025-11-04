/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f1419',
        surface: '#1a1f2e',
        primary: '#3b82f6',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        geofence: '#8b5cf6',
      },
    },
  },
  plugins: [],
}
