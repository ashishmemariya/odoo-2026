import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://127.0.0.1:5000/api',
        changeOrigin: true,
      },
      '/products': {
        target: 'http://127.0.0.1:5000/api',
        changeOrigin: true,
      },
      '/categories': {
        target: 'http://127.0.0.1:5000/api',
        changeOrigin: true,
      },
      '/warehouses': {
        target: 'http://127.0.0.1:5000/api',
        changeOrigin: true,
      },
      '/locations': {
        target: 'http://127.0.0.1:5000/api',
        changeOrigin: true,
      },
      '/receipts': {
        target: 'http://127.0.0.1:5000/api',
        changeOrigin: true,
      },
      '/deliveries': {
        target: 'http://127.0.0.1:5000/api',
        changeOrigin: true,
      },
      '/transfers': {
        target: 'http://127.0.0.1:5000/api',
        changeOrigin: true,
      },
      '/adjustments': {
        target: 'http://127.0.0.1:5000/api',
        changeOrigin: true,
      },
      '/history': {
        target: 'http://127.0.0.1:5000/api',
        changeOrigin: true,
      },
      '/ledger': {
        target: 'http://127.0.0.1:5000/api',
        changeOrigin: true,
      },
      '/dashboard': {
        target: 'http://127.0.0.1:5000/api',
        changeOrigin: true,
      },
    },
  },
});
