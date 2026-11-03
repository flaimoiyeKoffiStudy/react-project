import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Le proxy évite les problèmes CORS en développement : /api → backend Express
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:4000' } },
});
