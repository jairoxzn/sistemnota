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
    // El chunk de PDF (jsPDF + html2canvas) es grande pero se carga bajo demanda
    // (import dinámico al imprimir/descargar), por eso ampliamos el umbral del aviso.
    chunkSizeWarningLimit: 800,
    // Divide las librerías pesadas en chunks separados: cargan bajo demanda,
    // se cachean por separado y evitan un único bundle enorme.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          // Ecosistema de generación de PDF (jsPDF + sus dependencias pesadas)
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
          if (id.includes('recharts') || id.includes('/d3-') || id.includes('victory'))
            return 'charts';
          if (id.includes('qrcode')) return 'qr';
          if (id.includes('lucide-react')) return 'icons';
          if (id.includes('react-router') || id.includes('react-dom') || id.includes('/react/'))
            return 'react-vendor';
          return 'vendor';
        },
      },
    },
  },
});
