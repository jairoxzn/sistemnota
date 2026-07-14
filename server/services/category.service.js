import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';

export const categoryService = {
  async list() {
    return prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
  },

  async create(name) {
    return prisma.category.create({ data: { name } });
  },

  async update(id, name) {
    const exists = await prisma.category.findUnique({ where: { id } });
    if (!exists) throw ApiError.notFound('Categoría no encontrada');
    return prisma.category.update({ where: { id }, data: { name } });
  },

  async remove(id) {
    const exists = await prisma.category.findUnique({ where: { id } });
    if (!exists) throw ApiError.notFound('Categoría no encontrada');
    // Los productos quedan con categoryId = null (onDelete: SetNull)
    return prisma.category.delete({ where: { id } });
  },
};
