// Punto de entrada de la API para Vercel (Serverless Function).
// Este archivo captura TODAS las rutas /api/* y las delega a la app Express.
// Vercel invoca la función con la URL original (p.ej. /api/auth/login),
// que coincide con las rutas montadas en /api dentro de la app.
import { createApp } from '../server/app.js';

const app = createApp();

export default app;
