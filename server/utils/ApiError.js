// Error de aplicación con código HTTP. Permite lanzar errores controlados
// desde services/controllers y capturarlos en el middleware central de errores.
export class ApiError extends Error {
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace?.(this, this.constructor);
  }

  static badRequest(msg = 'Solicitud inválida', details) {
    return new ApiError(400, msg, details);
  }
  static unauthorized(msg = 'No autenticado') {
    return new ApiError(401, msg);
  }
  static forbidden(msg = 'No autorizado') {
    return new ApiError(403, msg);
  }
  static notFound(msg = 'Recurso no encontrado') {
    return new ApiError(404, msg);
  }
  static conflict(msg = 'Conflicto con el estado actual') {
    return new ApiError(409, msg);
  }
}
