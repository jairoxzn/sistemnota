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

  // Ventas agrupadas por período: 'day' (últimos 14 días), 'week', 'month' (últimos 12 meses)
  async salesByPeriod(period = 'day') {
    let sinceDate;
    let bucket;
    if (period === 'month') {
      sinceDate = daysAgo(365);
      bucket = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    } else if (period === 'week') {
      sinceDate = daysAgo(84); // ~12 semanas
      bucket = (d) => {
        const onejan = new Date(d.getFullYear(), 0, 1);
        const week = Math.ceil(((d - onejan) / 86400000 + onejan.getDay() + 1) / 7);
        return `${d.getFullYear()}-S${String(week).padStart(2, '0')}`;
      };
    } else {
      sinceDate = daysAgo(14);
      bucket = (d) => d.toISOString().slice(0, 10);
    }

    const sales = await prisma.sale.findMany({
      where: { createdAt: { gte: sinceDate }, status: 'ACTIVE' },
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
