import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/ws': {
        target: 'ws://127.0.0.1:3000/ws',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  }
})
