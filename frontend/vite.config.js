import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.config.js/
export default defineConfig({
  // 1. plugins와 server가 같은 레벨에 있도록 수정
  plugins: [react()],
  server: {
    // 2. /api로 시작하는 모든 요청을
    //    http://localhost:3000 (백엔드)로 보냅니다.
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})
