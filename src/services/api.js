// Cliente HTTP central (axios) con inyección de token y manejo de errores.
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Interceptor de request: adjunta el JWT guardado
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor de response: normaliza errores y cierra sesión en 401
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message || error.message || 'Error de conexión con el servidor';
    const details = error.response?.data?.details;

    // Diagnóstico en desarrollo: muestra en consola el motivo exacto del error
    if (import.meta.env.DEV) {
      console.error(
        `[API ${status}] ${error.config?.method?.toUpperCase()} ${error.config?.url} → ${message}`,
        details || ''
      );
    }

    if (status === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('token');
      if (!location.pathname.includes('/login')) {
        location.href = '/login';
      }
    }
    return Promise.reject({ status, message, details });
  }
);

export default api;
