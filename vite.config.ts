import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base '/' for Netlify; GitHub Pages workflow overrides with VITE_BASE_URL
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_URL || '/',
  server: {
    port: 5173,
    host: true,
  },
})
