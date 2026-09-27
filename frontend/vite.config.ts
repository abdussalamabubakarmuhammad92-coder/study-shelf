import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev: Vite serves the frontend on :5173 and proxies /api, /admin, /media
// to Django on :8000. Prod: `npm run build:unified` copies the build into
// backend/static so Django serves everything on one origin.
export default defineConfig({
  plugins: [react()],
  // Django serves static files under /static/, so the build must reference
  // its assets there (avoids the SPA catch-all swallowing /assets/*).
  base: '/static/',
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000',
      '/media': 'http://localhost:8000',
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
