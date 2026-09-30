import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '~': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: process.env.VITE_API_PROXY_TARGET || process.env.API_PROXY_TARGET || 'http://localhost:8081', changeOrigin: false },
      '/swagger-ui': { target: process.env.VITE_API_PROXY_TARGET || process.env.API_PROXY_TARGET || 'http://localhost:8081', changeOrigin: false },
      '/ws': { target: process.env.VITE_API_PROXY_TARGET || process.env.API_PROXY_TARGET || 'http://localhost:8081', ws: true, changeOrigin: false }
    }
  },
  test: { include: ['src/**/*.test.ts'], environment: 'node' }
});
