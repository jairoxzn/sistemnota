import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';

// Tipos que puede registrar el usuario manualmente y el signo que aplican al stock.
// ENTRY (+), ADJUSTMENT (+/-, según signo enviado), LOSS (-).
const MANUAL_TYPES = ['ENTRY', 'ADJUSTMENT', 'LOSS'];

const movementInclude = {
  product: { select: { id: true, code: true, name: true } },
  user: { select: { id: true, name: true } },
};

export const stockMovementService = {
  /**
   * Registra un movimiento manual de inventario y actualiza el stock del
   * producto de forma atómica (transacción). Impide dejar el stock negativo.
   *
   * @param {{ productId, type, quantity, reason }} input
   *  - ENTRY: quantity positiva (ingresa mercancía)
   *  - LOSS: quantity positiva (se descuenta como merma)
   *  - ADJUSTMENT: quantity con signo (+ suma, - resta)
   */
  async create({ productId, type, quantity, reason }, userId) {
    if (!MANUAL_TYPES.includes(type)) {
      throw ApiError.badRequest('Tipo de movimiento no permitido');
    }

    // Convertir la cantidad ingresada al delta real sobre el stock
    let delta;
    if (type === 'ENTRY') delta = Math.abs(quantity);
    else if (type === 'LOSS') delta = -Math.abs(quantity);
    else delta = quantity; // ADJUSTMENT: respeta el signo

    if (delta === 0) throw ApiError.badRequest('La cantidad no puede ser 0');

    return prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) throw ApiError.notFound('Producto no encontrado');

      const previousStock = product.stock;
      const newStock = previousStock + delta;
      if (newStock < 0) {
        throw ApiError.conflict(
          `El movimiento dejaría el stock en negativo (actual: ${previousStock}, delta: ${delta})`
        );
      }

      await tx.product.update({ where: { id: productId }, data: { stock: newStock } });

      return tx.stockMovement.create({
        data: {
          type,
          quantity: delta,
          previousStock,
          newStock,
          reason: reason || null,
          productId,
          userId,
        },
        include: movementInclude,
      });
    });
  },

  async list({ productId, type, page, pageSize }) {
    const where = {
      ...(productId ? { productId } : {}),
      ...(type ? { type } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        include: movementInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.stockMovement.count({ where }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  },
};
