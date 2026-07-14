// Capa de servicios: agrupa las llamadas a la API por dominio.
import api from './api.js';

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }).then((r) => r.data),
  register: (payload) => api.post('/auth/register', payload).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
};

export const productApi = {
  list: (params) => api.get('/products', { params }).then((r) => r.data),
  get: (id) => api.get(`/products/${id}`).then((r) => r.data),
  create: (payload) => api.post('/products', payload).then((r) => r.data),
  update: (id, payload) => api.put(`/products/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/products/${id}`).then((r) => r.data),
};

export const customerApi = {
  list: (params) => api.get('/customers', { params }).then((r) => r.data),
  get: (id) => api.get(`/customers/${id}`).then((r) => r.data),
  create: (payload) => api.post('/customers', payload).then((r) => r.data),
  update: (id, payload) => api.put(`/customers/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/customers/${id}`).then((r) => r.data),
};

export const categoryApi = {
  list: () => api.get('/categories').then((r) => r.data),
  create: (name) => api.post('/categories', { name }).then((r) => r.data),
  update: (id, name) => api.put(`/categories/${id}`, { name }).then((r) => r.data),
  remove: (id) => api.delete(`/categories/${id}`).then((r) => r.data),
};

export const saleApi = {
  list: (params) => api.get('/sales', { params }).then((r) => r.data),
  get: (id) => api.get(`/sales/${id}`).then((r) => r.data),
  create: (payload) => api.post('/sales', payload).then((r) => r.data),
  cancel: (id, reason) => api.post(`/sales/${id}/cancel`, { reason }).then((r) => r.data),
};

export const reportApi = {
  summary: () => api.get('/reports/summary').then((r) => r.data),
  salesByPeriod: (period) => api.get('/reports/sales', { params: { period } }).then((r) => r.data),
  topProducts: (limit = 10) => api.get('/reports/top-products', { params: { limit } }).then((r) => r.data),
  stock: () => api.get('/reports/stock').then((r) => r.data),
  lowStock: () => api.get('/reports/low-stock').then((r) => r.data),
};

export const settingsApi = {
  get: () => api.get('/settings').then((r) => r.data),
  update: (payload) => api.put('/settings', payload).then((r) => r.data),
};

export const stockMovementApi = {
  list: (params) => api.get('/stock-movements', { params }).then((r) => r.data),
  create: (payload) => api.post('/stock-movements', payload).then((r) => r.data),
};

export const quoteApi = {
  list: (params) => api.get('/quotes', { params }).then((r) => r.data),
  get: (id) => api.get(`/quotes/${id}`).then((r) => r.data),
  create: (payload) => api.post('/quotes', payload).then((r) => r.data),
  convert: (id, paymentMethod = 'CASH') =>
    api.post(`/quotes/${id}/convert`, { paymentMethod }).then((r) => r.data),
  cancel: (id) => api.post(`/quotes/${id}/cancel`).then((r) => r.data),
};

// Catálogo público (sin token). Se consulta directamente sin auth.
export const publicApi = {
  catalog: (params) => api.get('/public/catalog', { params }).then((r) => r.data),
  branding: () => api.get('/public/branding').then((r) => r.data),
};

export const userApi = {
  list: (params) => api.get('/users', { params }).then((r) => r.data),
  create: (payload) => api.post('/users', payload).then((r) => r.data),
  update: (id, payload) => api.put(`/users/${id}`, payload).then((r) => r.data),
  resetPassword: (id, password) => api.patch(`/users/${id}/password`, { password }).then((r) => r.data),
};

export const cashApi = {
  current: () => api.get('/cash/current').then((r) => r.data),
  open: (payload) => api.post('/cash/open', payload).then((r) => r.data),
  close: (payload) => api.post('/cash/close', payload).then((r) => r.data),
  list: (params) => api.get('/cash', { params }).then((r) => r.data),
  get: (id) => api.get(`/cash/${id}`).then((r) => r.data),
};
