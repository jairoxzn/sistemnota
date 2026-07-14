// Lógica pura de cálculo de una venta. Separada del service para poder
// probarla sin base de datos (principio de responsabilidad única).
import { ApiError } from './ApiError.js';

/**
 * Construye los detalles y totales de una venta a partir de los productos
 * de la BD y las cantidades agrupadas. Valida stock disponible.
 *
 * @param {Array} products  productos de la BD ({id, name, code, price, stock})
 * @param {Map<string,number>} grouped  productId -> cantidad total
 * @param {number} discount  descuento solicitado
 * @returns {{ detailData: Array, subtotal: number, discount: number, total: number }}
 */
export function buildSaleTotals(products, grouped, discount = 0) {
  let subtotal = 0;
  const detailData = [];

  for (const product of products) {
    const qty = grouped.get(product.id);
    if (!qty || qty <= 0) {
      throw ApiError.badRequest(`Cantidad inválida para "${product.name}"`);
    }
    // Validación clave: nunca vender más de lo disponible (evita stock negativo)
    if (qty > product.stock) {
      throw ApiError.conflict(
        `Stock insuficiente para "${product.name}". Disponible: ${product.stock}, solicitado: ${qty}`
      );
    }

    const unitPrice = Number(product.price);
    const lineSubtotal = +(unitPrice * qty).toFixed(2);
    subtotal += lineSubtotal;

    detailData.push({
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      quantity: qty,
      unitPrice,
      subtotal: lineSubtotal,
    });
  }

  subtotal = +subtotal.toFixed(2);
  const safeDiscount = Math.min(Math.max(Number(discount) || 0, 0), subtotal);
  const total = +(subtotal - safeDiscount).toFixed(2);

  return { detailData, subtotal, discount: safeDiscount, total };
}
