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

    // Lecturas FUERA de la transacción (menos consultas dentro = menos latencia en Neon).
    // Se hacen en paralelo para acelerar aún más.
    const [openCash, settings] = await Promise.all([
      prisma.cashRegister.findFirst({ where: { status: 'OPEN' }, select: { id: true } }),
      prisma.storeSettings.findUnique({
        where: { id: 'default' },
        select: { requireCashRegister: true },
      }),
    ]);

    // Si la tienda exige caja abierta para vender, se bloquea la venta sin caja
    if ((settings?.requireCashRegister ?? true) && !openCash) {
      throw ApiError.conflict('Debes abrir la caja antes de registrar una venta');
    }

    return prisma.$transaction(
      async (tx) => {
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

        // Descontar stock (una actualización por producto) y registrar los
        // movimientos de inventario en UN solo insert (createMany) para minimizar
        // las idas y vueltas a la base de datos dentro de la transacción.
        const stockById = new Map(products.map((p) => [p.id, p.stock]));
        const movements = [];
        for (const [productId, qty] of grouped) {
          const previousStock = stockById.get(productId);
          const newStock = previousStock - qty;
          await tx.product.update({ where: { id: productId }, data: { stock: newStock } });
          movements.push({
            type: 'SALE',
            quantity: -qty,
            previousStock,
            newStock,
            reason: `Venta ${sale.number}`,
            productId,
            userId,
            saleId: sale.id,
          });
        }
        await tx.stockMovement.createMany({ data: movements });

        return sale;
      },
      // Márgenes amplios para tolerar la latencia de una BD remota (Neon)
      { timeout: 20000, maxWait: 10000 }
    );
  },

  /**
   * Anula una venta y repone el stock de forma atómica:
   *  - Marca la venta como CANCELLED (con motivo y quién anuló).
   *  - Devuelve al inventario las cantidades vendidas.
   *  - Registra un movimiento SALE_CANCELLED por cada producto.
   * No permite anular una venta ya anulada.
   */
  async cancel(id, reason, userId) {
    return prisma.$transaction(
      async (tx) => {
        const sale = await tx.sale.findUnique({ where: { id }, include: { details: true } });
        if (!sale) throw ApiError.notFound('Venta no encontrada');
        if (sale.status === 'CANCELLED') throw ApiError.conflict('La venta ya está anulada');

        // Productos existentes (una sola consulta) para reponer stock
        const productIds = sale.details.map((d) => d.productId);
        const products = await tx.product.findMany({ where: { id: { in: productIds } } });
        const stockById = new Map(products.map((p) => [p.id, p.stock]));

        const movements = [];
        for (const d of sale.details) {
          if (!stockById.has(d.productId)) continue; // producto eliminado: se ignora
          const previousStock = stockById.get(d.productId);
          const newStock = previousStock + d.quantity;
          stockById.set(d.productId, newStock);
          await tx.product.update({ where: { id: d.productId }, data: { stock: newStock } });
          movements.push({
            type: 'SALE_CANCELLED',
            quantity: d.quantity,
            previousStock,
            newStock,
            reason: `Anulación venta ${sale.number}`,
            productId: d.productId,
            userId,
            saleId: sale.id,
          });
        }
        if (movements.length) await tx.stockMovement.createMany({ data: movements });

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
      },
      { timeout: 20000, maxWait: 10000 }
    );
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
