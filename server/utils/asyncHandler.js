// Envuelve controladores async para propagar errores al middleware central
// sin necesidad de try/catch en cada handler.
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
