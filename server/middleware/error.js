// Manejo centralizado de errores + handler 404.
import { Prisma } from '@prisma/client';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

export function notFound(req, _res, next) {
  next(ApiError.notFound(`Ruta no encontrada: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Error interno del servidor';
  let details = err.details;

  // Errores conocidos de Prisma → mensajes claros
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Log del código real para diagnóstico (siempre, aunque el status sea 400)
    console.error(`❌ Prisma ${err.code}:`, err.meta || err.message);
    if (err.code === 'P2002') {
      statusCode = 409;
      const field = err.meta?.target?.[0] || 'campo';
      message = `Ya existe un registro con ese ${field}`;
    } else if (err.code === 'P2025') {
      statusCode = 404;
      message = 'Registro no encontrado';
    } else if (err.code === 'P2003') {
      statusCode = 400;
      message = 'Referencia inválida (clave foránea). Revisa cliente/usuario/producto.';
    } else {
      statusCode = 400;
      message = 'Error de base de datos';
    }
    // En desarrollo, expone el código y metadatos para diagnóstico
    if (!env.isProd) details = { prismaCode: err.code, meta: err.meta };
  }

  if (statusCode >= 500) {
    console.error('❌', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
    ...(env.isProd ? {} : { stack: err.stack }),
  });
}
