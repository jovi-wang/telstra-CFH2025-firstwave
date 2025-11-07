import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'map-vendor': ['leaflet', 'react-leaflet', 'leaflet.heat'],
          'chart-vendor': ['recharts'],
          'markdown-vendor': ['react-markdown'],
          'zustand-vendor': ['zustand'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false, // Disable sourcemaps in production for smaller bundle
  },
  optimizeDeps: {
    include: ['leaflet', 'react-leaflet', 'leaflet.heat'],
  },
})
