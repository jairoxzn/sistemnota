// Punto de entrada de la API para Vercel (Serverless Function).
// Vercel enruta TODAS las peticiones /api/* a esta función mediante la regla
// de "rewrites" en vercel.json. La función recibe la URL de la petición, que
// coincide con las rutas montadas en /api dentro de la app Express.
import { createApp } from '../server/app.js';

const app = createApp();

// Handler defensivo: asegura el prefijo /api aunque Vercel lo reescriba,
// para que las rutas de Express (montadas en /api) siempre coincidan.
export default function handler(req, res) {
  if (!req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  return app(req, res);
}
