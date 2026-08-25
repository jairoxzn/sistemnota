import { prisma } from '../config/prisma.js';

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function daysAgo(n) {
  const d = startOfToday();
  d.setDate(d.getDate() - n);
  return d;
}
function startOfDay(value) {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfDay(value) {
  const d = new Date(value);
  d.setHours(23, 59, 59, 999);
  return d;
}
function weekBucket(d) {
  const onejan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - onejan) / 86400000 + onejan.getDay() + 1) / 7);
  return `${d.getFullYear()}-S${String(week).padStart(2, '0')}`;
}
function monthBucket(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function dayBucket(d) {
  return d.toISOString().slice(0, 10);
}

// Resuelve el rango de fechas y la granularidad de agrupación (bucket) a partir
// del período seleccionado. 'custom' usa un rango "desde–hasta" explícito y
// elige automáticamente día/semana/mes según cuántos días abarque el rango.
function resolveDateRange({ period, from, to }) {
  if (period === 'custom' && from && to) {
    const sinceDate = startOfDay(from);
    const untilDate = endOfDay(to);
    const days = Math.max(1, Math.round((untilDate - sinceDate) / 86400000));
    const bucket = days <= 31 ? dayBucket : days <= 180 ? weekBucket : monthBucket;
    return { sinceDate, untilDate, bucket };
  }
  if (period === 'month') {
    return { sinceDate: daysAgo(365), untilDate: null, bucket: monthBucket };
  }
  if (period === 'week') {
    return { sinceDate: daysAgo(84), untilDate: null, bucket: weekBucket }; // ~12 semanas
  }
  return { sinceDate: daysAgo(14), untilDate: null, bucket: dayBucket };
}

// Umbral de stock bajo configurable (viene de StoreSettings; por defecto 10)
async function getLowStockThreshold() {
  const settings = await prisma.storeSettings.findUnique({ where: { id: 'default' } });
  return settings?.lowStockThreshold ?? 10;
}

export const reportService = {
  // Métricas para el dashboard
  async summary() {
    const today = startOfToday();
    const monthStart = daysAgo(30);

    const threshold = await getLowStockThreshold();

    // Solo se consideran ventas ACTIVAS (las anuladas no cuentan en métricas)
    const [salesToday, salesMonth, totalProducts, totalCustomers, lowStock] = await Promise.all([
      prisma.sale.aggregate({
        where: { createdAt: { gte: today }, status: 'ACTIVE' },
        _sum: { total: true },
        _count: true,
      }),
      prisma.sale.aggregate({
        where: { createdAt: { gte: monthStart }, status: 'ACTIVE' },
        _sum: { total: true },
        _count: true,
      }),
      prisma.product.count({ where: { active: true } }),
      prisma.customer.count(),
      prisma.product.count({ where: { active: true, stock: { lte: threshold } } }),
    ]);

    return {
      today: { total: Number(salesToday._sum.total || 0), count: salesToday._count },
      month: { total: Number(salesMonth._sum.total || 0), count: salesMonth._count },
      totalProducts,
      totalCustomers,
      lowStockCount: lowStock,
    };
  },

  // Ventas agrupadas por período: 'day' (últimos 14 días), 'week' (~12 semanas),
  // 'month' (últimos 12 meses) o 'custom' (rango "desde–hasta" explícito).
  async salesByPeriod({ period = 'day', from, to } = {}) {
    const { sinceDate, untilDate, bucket } = resolveDateRange({ period, from, to });

    const sales = await prisma.sale.findMany({
      where: {
        createdAt: { gte: sinceDate, ...(untilDate ? { lte: untilDate } : {}) },
        status: 'ACTIVE',
      },
      select: { total: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const map = new Map();
    for (const s of sales) {
      const key = bucket(s.createdAt);
      const acc = map.get(key) || { period: key, total: 0, count: 0 };
      acc.total += Number(s.total);
      acc.count += 1;
      map.set(key, acc);
    }
    return [...map.values()].map((r) => ({ ...r, total: +r.total.toFixed(2) }));
  },

  // Desglose de ventas por método de pago (Efectivo, Transferencia, Tarjeta,
  // Yape, Plin, Otro) para el mismo rango de fechas del gráfico de ventas.
  async paymentMethodBreakdown({ period = 'day', from, to } = {}) {
    const { sinceDate, untilDate } = resolveDateRange({ period, from, to });

    const grouped = await prisma.sale.groupBy({
      by: ['paymentMethod'],
      where: {
        createdAt: { gte: sinceDate, ...(untilDate ? { lte: untilDate } : {}) },
        status: 'ACTIVE',
      },
      _sum: { total: true },
      _count: true,
    });

    const totalRevenue = grouped.reduce((a, g) => a + Number(g._sum.total || 0), 0);
    return grouped
      .map((g) => {
        const total = +Number(g._sum.total || 0).toFixed(2);
        return {
          method: g.paymentMethod,
          total,
          count: g._count,
          percent: totalRevenue > 0 ? +((total / totalRevenue) * 100).toFixed(1) : 0,
        };
      })
      .sort((a, b) => b.total - a.total);
  },

  // Productos más vendidos (por cantidad)
  async topProducts(limit = 10) {
    const grouped = await prisma.saleDetail.groupBy({
      by: ['productId', 'productName', 'productCode'],
      where: { sale: { status: 'ACTIVE' } }, // ignora ventas anuladas
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });
    return grouped.map((g) => ({
      productId: g.productId,
      name: g.productName,
      code: g.productCode,
      quantitySold: g._sum.quantity || 0,
      revenue: +Number(g._sum.subtotal || 0).toFixed(2),
    }));
  },

  // Stock actual de todos los productos activos
  async stock() {
    const products = await prisma.product.findMany({
      where: { active: true },
      select: { id: true, code: true, name: true, stock: true, price: true, category: { select: { name: true } } },
      orderBy: { stock: 'asc' },
    });
    return products.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      stock: p.stock,
      price: Number(p.price),
      category: p.category?.name || '—',
      value: +(p.stock * Number(p.price)).toFixed(2),
    }));
  },

  // Productos por reabastecer: stock por debajo o igual al umbral configurado
  async lowStock() {
    const threshold = await getLowStockThreshold();
    const products = await prisma.product.findMany({
      where: { active: true, stock: { lte: threshold } },
      select: {
        id: true,
        code: true,
        name: true,
        stock: true,
        category: { select: { name: true } },
      },
      orderBy: { stock: 'asc' },
    });
    return {
      threshold,
      items: products.map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        stock: p.stock,
        category: p.category?.name || '—',
        outOfStock: p.stock <= 0,
      })),
    };
  },
};
