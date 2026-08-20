import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// base '/' for Netlify; GitHub Pages workflow overrides with VITE_BASE_URL
export default defineConfig(({ mode }) => {
  // Load .env files (including ANTHROPIC_API_KEY for dev proxy)
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    base: process.env.VITE_BASE_URL || '/',
    server: {
      port: 5173,
      host: true,
      proxy: {
        // Proxy /api/chat to Anthropic API for local development
        // In production, this is handled by the Netlify Function (netlify/functions/chat.mts)
        '/api/chat': {
          target: 'https://api.anthropic.com',
          changeOrigin: true,
          rewrite: () => '/v1/messages',
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              const apiKey = env.ANTHROPIC_API_KEY || ''
              if (apiKey) {
                proxyReq.setHeader('x-api-key', apiKey)
                proxyReq.setHeader('anthropic-version', '2023-06-01')
              }
            })
          },
        },
      },
    },
  }
})
