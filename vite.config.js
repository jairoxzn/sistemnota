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
    chunkSizeWarningLimit: 1500,
    // IMPORTANTE: solo se separan librerías que NO dependen de React (jsPDF,
    // xlsx, qrcode). Separar React o librerías que lo usan (recharts,
    // react-hot-toast) provoca errores de orden de carga (React.memo undefined).
    // Estas tres además se cargan bajo demanda (import dinámico), así que no
    // pesan en la carga inicial.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (
            id.includes('jspdf') ||
            id.includes('html2canvas') ||
            id.includes('canvg') ||
            id.includes('dompurify') ||
            id.includes('rgbcolor') ||
            id.includes('stackblur') ||
            id.includes('raf')
          )
            return 'pdf';
          if (id.includes('xlsx')) return 'xlsx';
          if (id.includes('qrcode')) return 'qr';
          return undefined; // el resto (React, recharts, etc.) queda junto
        },
      },
    },
  },
});
