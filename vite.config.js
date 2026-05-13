import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        // Remove the rewrite - don't add extra /v1
        // rewrite: (path) => path.replace(/^\/api/, '/api/v1'), // DELETE THIS LINE
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
          });
        }
      }
    }
  }
})