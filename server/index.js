// Punto de entrada del servidor.
import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';

const app = createApp();

const server = app.listen(env.port, () => {
  console.log(`\n🚀 API lista en http://localhost:${env.port}/api`);
  console.log(`   Entorno: ${env.nodeEnv}`);
  if (env.isProd) console.log(`   Sirviendo frontend compilado desde /dist`);
  else console.log(`   Frontend (Vite) en http://localhost:5173\n`);
});

// Mensaje claro cuando el puerto ya está ocupado (evita el stack trace crudo)
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `\n⛔ El puerto ${env.port} ya está en uso. Otro proceso (posiblemente una ` +
        `instancia previa del servidor) lo tiene ocupado.\n` +
        `   Solución rápida en Windows (PowerShell):\n` +
        `     Get-NetTCPConnection -LocalPort ${env.port} -State Listen | Select OwningProcess\n` +
        `     Stop-Process -Id <PID> -Force\n` +
        `   O cambia PORT en el archivo .env.\n`
    );
    process.exit(1);
  }
  throw err;
});

// Apagado limpio: cierra conexiones de Prisma y el servidor HTTP
async function shutdown(signal) {
  console.log(`\n${signal} recibido, cerrando...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
