// Middleware de autorización por rol. Uso: authorize('ADMIN')
import { ApiError } from '../utils/ApiError.js';

export function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('No tienes permisos para esta acción'));
    }
    next();
  };
}
