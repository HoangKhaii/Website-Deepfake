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
    host: true, // Cho phép truy cập từ máy khác trong mạng (vd: http://192.168.1.100:5173)
    // Ảnh images.openai.com thường không nhúng trực tiếp được → proxy qua cùng origin khi dev
    proxy: {
      '/openai-img-proxy': {
        target: 'https://images.openai.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/openai-img-proxy/, ''),
      },
    },
  },
  optimizeDeps: {
    include: ['face-api.js']
  }
})
