import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

import { env } from './config/env.js';
import apiRoutes from './routes/index.js';
import { notFound, errorHandler } from './middleware/error.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  // Detrás de un proxy (Vercel, Render, etc.): necesario para detectar la IP
  // real (rate-limit) y para HTTPS. Sin esto, express-rate-limit puede fallar.
  app.set('trust proxy', 1);

  // Seguridad y utilidades
  app.use(helmet({ contentSecurityPolicy: false })); // CSP off para servir el SPA sin fricción
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json({ limit: '25mb' })); // amplio para imágenes de producto (base64)
  app.use(express.urlencoded({ extended: true }));
  if (!env.isProd) app.use(morgan('dev'));

  // Rate limit para toda la API (protege contra abuso / fuerza bruta)
  app.use(
    '/api',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 500,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, message: 'Demasiadas solicitudes, intenta más tarde' },
    })
  );

  // Rutas de la API
  app.use('/api', apiRoutes);

  // ─── Servir el frontend compilado (producción) ────────────────
  // En un solo proyecto, Express entrega el build de React (dist/) y hace
  // fallback a index.html para que funcione el enrutado del lado del cliente.
  const distDir = path.resolve(__dirname, '..', 'dist');
  if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  // 404 para rutas /api no encontradas + manejo central de errores
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
