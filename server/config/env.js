// Carga y valida las variables de entorno una sola vez.
import 'dotenv/config';

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Falta la variable de entorno obligatoria: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  databaseUrl: required('DATABASE_URL'),
  jwt: {
    secret: required('JWT_SECRET', 'dev_secret_change_me'),
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },
  store: {
    name: process.env.STORE_NAME || 'Mi Tienda',
    ruc: process.env.STORE_RUC || '',
    address: process.env.STORE_ADDRESS || '',
    phone: process.env.STORE_PHONE || '',
    email: process.env.STORE_EMAIL || '',
    currency: process.env.CURRENCY || 'S/',
  },
  get isProd() {
    return this.nodeEnv === 'production';
  },
};
