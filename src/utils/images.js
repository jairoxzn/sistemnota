// URL de la imagen de un producto (servida y cacheada por el navegador).
// Devuelve null si el producto no tiene imagen.
const API_BASE = import.meta.env.VITE_API_URL || '/api';

export function productImageUrl(product) {
  if (!product?.hasImage) return null;
  // ?v=<updatedAt> invalida la caché del navegador cuando cambia la imagen
  const v = product.updatedAt ? new Date(product.updatedAt).getTime() : '';
  return `${API_BASE}/public/product-image/${product.id}?v=${v}`;
}
