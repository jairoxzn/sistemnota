import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';

const userSelect = { select: { id: true, name: true } };

// Calcula el desglose de ventas ACTIVAS de una sesión de caja por método de pago.
async function computeBreakdown(cashRegisterId) {
  const grouped = await prisma.sale.groupBy({
    by: ['paymentMethod'],
    where: { cashRegisterId, status: 'ACTIVE' },
    _sum: { total: true },
    _count: true,
  });

  const byMethod = { CASH: 0, TRANSFER: 0, CARD: 0, OTHER: 0 };
  let salesCount = 0;
  let salesTotal = 0;
  for (const g of grouped) {
    const amount = Number(g._sum.total || 0);
    byMethod[g.paymentMethod] = amount;
    salesCount += g._count;
    salesTotal += amount;
  }
  return { byMethod, salesCount, salesTotal: +salesTotal.toFixed(2) };
}

export const cashRegisterService = {
  // Sesión de caja abierta actualmente (o null). Solo se permite una a la vez.
  async getCurrent() {
    const current = await prisma.cashRegister.findFirst({
      where: { status: 'OPEN' },
      include: { openedBy: userSelect },
      orderBy: { openedAt: 'desc' },
    });
    if (!current) return null;

    const breakdown = await computeBreakdown(current.id);
    const expected = +(Number(current.openingAmount) + breakdown.byMethod.CASH).toFixed(2);
    return { ...current, breakdown, expectedCash: expected };
  },

  // Abre una nueva caja (falla si ya hay una abierta).
  async open({ openingAmount, note }, userId) {
    const openOne = await prisma.cashRegister.findFirst({ where: { status: 'OPEN' } });
    if (openOne) throw ApiError.conflict('Ya hay una caja abierta. Ciérrala antes de abrir otra.');

    return prisma.cashRegister.create({
      data: {
        openingAmount,
        openingNote: note || null,
        openedById: userId,
      },
      include: { openedBy: userSelect },
    });
  },

  /**
   * Cierra la caja abierta: calcula el efectivo esperado (apertura + ventas en
   * efectivo) y lo compara con el monto contado para obtener la diferencia.
   */
  async close({ countedAmount, note }, userId) {
    const current = await prisma.cashRegister.findFirst({ where: { status: 'OPEN' } });
    if (!current) throw ApiError.badRequest('No hay ninguna caja abierta');

    const breakdown = await computeBreakdown(current.id);
    const expected = +(Number(current.openingAmount) + breakdown.byMethod.CASH).toFixed(2);
    const counted = +Number(countedAmount).toFixed(2);
    const difference = +(counted - expected).toFixed(2);

    return prisma.cashRegister.update({
      where: { id: current.id },
      data: {
        status: 'CLOSED',
        countedAmount: counted,
        expectedAmount: expected,
        difference,
        closingNote: note || null,
        closedById: userId,
        closedAt: new Date(),
      },
      include: { openedBy: userSelect, closedBy: userSelect },
    });
  },

  async list({ page, pageSize }) {
    const [items, total] = await Promise.all([
      prisma.cashRegister.findMany({
        include: { openedBy: userSelect, closedBy: userSelect },
        orderBy: { openedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.cashRegister.count(),
    ]);
    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  },

  async getById(id) {
    const cash = await prisma.cashRegister.findUnique({
      where: { id },
      include: { openedBy: userSelect, closedBy: userSelect },
    });
    if (!cash) throw ApiError.notFound('Sesión de caja no encontrada');
    const breakdown = await computeBreakdown(id);
    return { ...cash, breakdown };
  },

  // Devuelve el id de la caja abierta (para adjuntar ventas), o null.
  async currentOpenId() {
    const current = await prisma.cashRegister.findFirst({
      where: { status: 'OPEN' },
      select: { id: true },
    });
    return current?.id || null;
  },
};
