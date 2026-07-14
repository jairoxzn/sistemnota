// Middleware de autenticación: valida el JWT del header Authorization.
import { verifyToken } from '../utils/jwt.js';
import { ApiError } from '../utils/ApiError.js';

export function authenticate(req, _res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(ApiError.unauthorized('Token no proporcionado'));
  }

  try {
    const payload = verifyToken(token);
    // payload = { sub, name, email, role }
    req.user = { id: payload.sub, name: payload.name, email: payload.email, role: payload.role };
    next();
  } catch {
    next(ApiError.unauthorized('Token inválido o expirado'));
  }
}
