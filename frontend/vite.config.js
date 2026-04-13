import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  root: __dirname,
  envDir: __dirname,
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // Cho phép truy cập từ máy khác trong mạng (vd: http://192.168.1.100:5173)
    // Ảnh images.openai.com thường không nhúng trực tiếp được → proxy qua cùng origin khi dev
    proxy: {
      '/openai-img-proxy': {
        target: 'https://images.openai.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/openai-img-proxy/, ''),
      },
      // Backend thấy IP thật của trình duyệt (email cảnh báo đăng nhập), không còn 127.0.0.1 khi dev qua Vite
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        configure(proxy) {
          proxy.on('proxyReq', (proxyReq, req) => {
            const raw = req.socket?.remoteAddress
            if (!raw) return
            const ip = raw.startsWith('::ffff:') ? raw.slice(7) : raw
            proxyReq.setHeader('X-Forwarded-For', ip)
          })
        },
      },
    },
  },
  preview: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        configure(proxy) {
          proxy.on('proxyReq', (proxyReq, req) => {
            const raw = req.socket?.remoteAddress
            if (!raw) return
            const ip = raw.startsWith('::ffff:') ? raw.slice(7) : raw
            proxyReq.setHeader('X-Forwarded-For', ip)
          })
        },
      },
    },
  },
  optimizeDeps: {
    include: ['face-api.js']
  }
})
