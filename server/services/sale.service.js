import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { buildSaleTotals } from '../utils/saleCalc.js';

const saleInclude = {
  customer: true,
  user: { select: { id: true, name: true, email: true } },
  cancelledBy: { select: { id: true, name: true } },
  details: true,
};

export const saleService = {
  /**
   * Crea una venta de forma atómica:
   *  1. Bloquea y valida stock de cada producto.
   *  2. Calcula subtotales, descuento y total en el servidor (no confía en el cliente).
   *  3. Crea la venta + detalles y descuenta stock.
   * Todo dentro de una transacción Prisma: si algo falla, se revierte por completo.
   */
  async create({ customerId, paymentMethod, discount, note, items }, userId) {
    // Agrupar cantidades por producto (evita líneas duplicadas del mismo item)
    const grouped = new Map();
    for (const it of items) {
      grouped.set(it.productId, (grouped.get(it.productId) || 0) + it.quantity);
    }
    const productIds = [...grouped.keys()];

    return prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({ where: { id: { in: productIds } } });

      if (products.length !== productIds.length) {
        throw ApiError.badRequest('Uno o más productos no existen');
      }

      // Cálculo puro (validación de stock, subtotales, descuento y total)
      const { detailData, subtotal, discount: safeDiscount, total } = buildSaleTotals(
        products,
        grouped,
        discount
      );

      // Si hay una caja abierta, la venta queda asociada a esa sesión (para el arqueo)
      const openCash = await tx.cashRegister.findFirst({
        where: { status: 'OPEN' },
        select: { id: true },
      });

      // Si la tienda exige caja abierta para vender, se bloquea la venta sin caja
      const settings = await tx.storeSettings.findUnique({ where: { id: 'default' } });
      if ((settings?.requireCashRegister ?? true) && !openCash) {
        throw ApiError.conflict('Debes abrir la caja antes de registrar una venta');
      }

      // Crear la venta con sus detalles (el correlativo `number` es autoincrement)
      const sale = await tx.sale.create({
        data: {
          customerId: customerId || null,
          userId,
          subtotal,
          discount: safeDiscount,
          total,
          paymentMethod,
          note: note || null,
          cashRegisterId: openCash?.id || null,
          details: { create: detailData },
        },
        include: saleInclude,
      });

      // Descontar stock y registrar el movimiento de inventario (SALE) por producto
      const stockById = new Map(products.map((p) => [p.id, p.stock]));
      for (const [productId, qty] of grouped) {
        const previousStock = stockById.get(productId);
        const newStock = previousStock - qty;
        await tx.product.update({ where: { id: productId }, data: { stock: newStock } });
        await tx.stockMovement.create({
          data: {
            type: 'SALE',
            quantity: -qty,
            previousStock,
            newStock,
            reason: `Venta ${sale.number}`,
            productId,
            userId,
            saleId: sale.id,
          },
        });
      }

      return sale;
    });
  },

  /**
   * Anula una venta y repone el stock de forma atómica:
   *  - Marca la venta como CANCELLED (con motivo y quién anuló).
   *  - Devuelve al inventario las cantidades vendidas.
   *  - Registra un movimiento SALE_CANCELLED por cada producto.
   * No permite anular una venta ya anulada.
   */
  async cancel(id, reason, userId) {
    return prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({ where: { id }, include: { details: true } });
      if (!sale) throw ApiError.notFound('Venta no encontrada');
      if (sale.status === 'CANCELLED') throw ApiError.conflict('La venta ya está anulada');

      // Reponer stock por cada línea (el producto pudo eliminarse: se ignora si no existe)
      for (const d of sale.details) {
        const product = await tx.product.findUnique({ where: { id: d.productId } });
        if (!product) continue;
        const previousStock = product.stock;
        const newStock = previousStock + d.quantity;
        await tx.product.update({ where: { id: d.productId }, data: { stock: newStock } });
        await tx.stockMovement.create({
          data: {
            type: 'SALE_CANCELLED',
            quantity: d.quantity,
            previousStock,
            newStock,
            reason: `Anulación venta ${sale.number}`,
            productId: d.productId,
            userId,
            saleId: sale.id,
          },
        });
      }

      return tx.sale.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelReason: reason || null,
          cancelledById: userId,
        },
        include: saleInclude,
      });
    });
  },

  async list({ from, to, page, pageSize }) {
    const where = {};
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [items, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: saleInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.sale.count({ where }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  },

  async getById(id) {
    const sale = await prisma.sale.findUnique({ where: { id }, include: saleInclude });
    if (!sale) throw ApiError.notFound('Venta no encontrada');
    return sale;
  },
};
