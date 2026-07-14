import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// El frontend (React) vive en /src y el backend (Express) en /server.
// En desarrollo Vite corre en :5173 y hace proxy de /api hacia Express (:4000),
// por eso la app usa siempre rutas relativas "/api/..." sin importar el entorno.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
});
