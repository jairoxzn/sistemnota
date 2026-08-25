import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';

const expenseInclude = { user: { select: { id: true, name: true } } };

function cleanData(data) {
  const out = { ...data };
  if (out.date === '' || out.date === undefined) delete out.date;
  else out.date = new Date(out.date);
  if (out.note === '') out.note = null;
  return out;
}

function dateRangeWhere(from, to) {
  if (!from && !to) return {};
  const range = {};
  if (from) range.gte = new Date(from);
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    range.lte = end;
  }
  return { date: range };
}

export const expenseService = {
  async list({ category, from, to, page, pageSize }) {
    const where = {
      ...(category ? { category } : {}),
      ...dateRangeWhere(from, to),
    };

    const [items, total, totalAmount] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: expenseInclude,
        orderBy: { date: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.expense.count({ where }),
      prisma.expense.aggregate({ where, _sum: { amount: true } }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      totalAmount: +Number(totalAmount._sum.amount || 0).toFixed(2),
    };
  },

  async getById(id) {
    const expense = await prisma.expense.findUnique({ where: { id }, include: expenseInclude });
    if (!expense) throw ApiError.notFound('Gasto no encontrado');
    return expense;
  },

  async create(data, userId) {
    return prisma.expense.create({ data: { ...cleanData(data), userId }, include: expenseInclude });
  },

  async update(id, data) {
    await this.getById(id);
    return prisma.expense.update({ where: { id }, data: cleanData(data), include: expenseInclude });
  },

  async remove(id) {
    await this.getById(id);
    await prisma.expense.delete({ where: { id } });
  },
};
