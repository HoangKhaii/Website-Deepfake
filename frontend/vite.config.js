import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Cho phép truy cập từ máy khác trong mạng (vd: http://192.168.1.100:5173)
  },
  optimizeDeps: {
    include: ['face-api.js']
  }
})
