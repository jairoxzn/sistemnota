// Middleware de validación con Zod. Valida body, query y params según el
// esquema recibido y reemplaza req.<part> con los datos ya parseados/tipados.
import { ApiError } from '../utils/ApiError.js';

export function validate(schema) {
  return (req, _res, next) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      if (parsed.body) req.body = parsed.body;
      if (parsed.query) req.validatedQuery = parsed.query;
      if (parsed.params) req.params = parsed.params;
      next();
    } catch (err) {
      const details = err.errors?.map((e) => ({
        field: e.path.join('.').replace(/^(body|query|params)\./, ''),
        message: e.message,
      }));
      next(ApiError.badRequest('Datos inválidos', details));
    }
  };
}
