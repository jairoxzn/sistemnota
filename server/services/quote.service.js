import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { buildSaleTotals } from '../utils/saleCalc.js';

const quoteInclude = {
  customer: true,
  user: { select: { id: true, name: true, email: true } },
  details: true,
};

const saleInclude = {
  customer: true,
  user: { select: { id: true, name: true, email: true } },
  details: true,
};

export const quoteService = {
  /**
   * Crea una cotización. NO afecta el stock (es solo un presupuesto), pero
   * sí congela el precio unitario del producto al momento de cotizar.
   */
  async create({ customerId, discount, note, validUntil, items }, userId) {
    const grouped = new Map();
    for (const it of items) {
      grouped.set(it.productId, (grouped.get(it.productId) || 0) + it.quantity);
    }
    const productIds = [...grouped.keys()];
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
    if (products.length !== productIds.length) {
      throw ApiError.badRequest('Uno o más productos no existen');
    }

    // Reutiliza el cálculo puro pero sin validar stock (se ignora aquí).
    // Para no bloquear por stock, se pasa un stock "infinito" en el cálculo.
    const productsForCalc = products.map((p) => ({ ...p, stock: Number.MAX_SAFE_INTEGER }));
    const { detailData, subtotal, discount: safeDiscount, total } = buildSaleTotals(
      productsForCalc,
      grouped,
      discount
    );

    return prisma.quote.create({
      data: {
        customerId: customerId || null,
        userId,
        subtotal,
        discount: safeDiscount,
        total,
        note: note || null,
        validUntil: validUntil ? new Date(validUntil) : null,
        details: {
          create: detailData.map((d) => ({
            productId: d.productId,
            productName: d.productName,
            productCode: d.productCode,
            quantity: d.quantity,
            unitPrice: d.unitPrice,
            subtotal: d.subtotal,
          })),
        },
      },
      include: quoteInclude,
    });
  },

  async list({ status, page, pageSize }) {
    const where = status ? { status } : {};
    const [items, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        include: quoteInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.quote.count({ where }),
    ]);
    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  },

  async getById(id) {
    const quote = await prisma.quote.findUnique({ where: { id }, include: quoteInclude });
    if (!quote) throw ApiError.notFound('Cotización no encontrada');
    return quote;
  },

  async cancel(id) {
    const quote = await this.getById(id);
    if (quote.status === 'CONVERTED') throw ApiError.conflict('La cotización ya fue convertida en venta');
    return prisma.quote.update({ where: { id }, data: { status: 'CANCELLED' }, include: quoteInclude });
  },

  /**
   * Convierte una cotización en venta (transacción atómica):
   *  - Valida stock disponible AHORA (a diferencia de la cotización).
   *  - Respeta los precios congelados en la cotización.
   *  - Descuenta stock, registra movimientos SALE y marca la cotización CONVERTED.
   */
  async convert(id, { paymentMethod = 'CASH' }, userId) {
    return prisma.$transaction(async (tx) => {
      const quote = await tx.quote.findUnique({ where: { id }, include: { details: true } });
      if (!quote) throw ApiError.notFound('Cotización no encontrada');
      if (quote.status === 'CONVERTED') throw ApiError.conflict('La cotización ya fue convertida');
      if (quote.status === 'CANCELLED') throw ApiError.conflict('La cotización está anulada');

      const grouped = new Map();
      for (const d of quote.details) grouped.set(d.productId, d.quantity);
      const productIds = [...grouped.keys()];
      const products = await tx.product.findMany({ where: { id: { in: productIds } } });
      if (products.length !== productIds.length) {
        throw ApiError.badRequest('Uno o más productos de la cotización ya no existen');
      }

      // Usa el precio congelado de la cotización (no el actual del producto)
      const quotedPrice = new Map(quote.details.map((d) => [d.productId, Number(d.unitPrice)]));
      const productsForCalc = products.map((p) => ({ ...p, price: quotedPrice.get(p.id) ?? p.price }));
      const { detailData, subtotal, discount, total } = buildSaleTotals(
        productsForCalc,
        grouped,
        Number(quote.discount)
      );

      // Asociar a la caja abierta (si existe) para el arqueo
      const openCash = await tx.cashRegister.findFirst({
        where: { status: 'OPEN' },
        select: { id: true },
      });

      // Si la tienda exige caja abierta, no se puede convertir sin caja
      const settings = await tx.storeSettings.findUnique({ where: { id: 'default' } });
      if ((settings?.requireCashRegister ?? true) && !openCash) {
        throw ApiError.conflict('Debes abrir la caja antes de convertir la cotización en venta');
      }

      // Crear la venta
      const sale = await tx.sale.create({
        data: {
          customerId: quote.customerId,
          userId,
          subtotal,
          discount,
          total,
          paymentMethod,
          cashRegisterId: openCash?.id || null,
          note: `Generada desde cotización COT-${String(quote.number).padStart(6, '0')}`,
          details: { create: detailData },
        },
        include: saleInclude,
      });

      // Descontar stock + movimientos SALE
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
            reason: `Venta ${sale.number} (cotización ${quote.number})`,
            productId,
            userId,
            saleId: sale.id,
          },
        });
      }

      // Marcar la cotización como convertida
      await tx.quote.update({
        where: { id },
        data: { status: 'CONVERTED', convertedSaleId: sale.id, convertedAt: new Date() },
      });

      return sale;
    });
  },
};
