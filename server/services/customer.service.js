import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';

function cleanData(data) {
  const out = { ...data };
  for (const k of ['phone', 'email', 'address']) {
    if (out[k] === '') out[k] = null;
  }
  return out;
}

export const customerService = {
  async list({ search, page, pageSize }) {
    const where = search
      ? {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' } },
            { documentId: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.customer.count({ where }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  },

  async getById(id) {
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) throw ApiError.notFound('Cliente no encontrado');
    return customer;
  },

  async create(data) {
    return prisma.customer.create({ data: cleanData(data) });
  },

  async update(id, data) {
    await this.getById(id);
    return prisma.customer.update({ where: { id }, data: cleanData(data) });
  },

  async remove(id) {
    await this.getById(id);
    return prisma.customer.delete({ where: { id } });
  },
};
