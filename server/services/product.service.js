import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';

// Normaliza campos opcionales vacíos a null/undefined
function cleanData(data) {
  const out = { ...data };
  if (out.categoryId === '' || out.categoryId === null) out.categoryId = null;
  if (out.description === '') out.description = null;
  if (out.image === '') out.image = null; // cadena vacía => quitar imagen
  return out;
}

export const productService = {
  async list({ search, categoryId, page, pageSize }) {
    const where = {
      active: true,
      ...(categoryId ? { categoryId } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { code: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    // La imagen (base64) NO se incluye aquí para que la lista sea liviana.
    // El frontend carga cada imagen bajo demanda vía /public/product-image/:id.
    const [rawItems, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
          price: true,
          stock: true,
          active: true,
          createdAt: true,
          updatedAt: true,
          categoryId: true,
          category: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.product.count({ where }),
    ]);

    // Marca qué productos tienen imagen SIN transferir el blob (filtro en la BD)
    const withImage = rawItems.length
      ? await prisma.product.findMany({
          where: { id: { in: rawItems.map((p) => p.id) }, image: { not: null } },
          select: { id: true },
        })
      : [];
    const imgSet = new Set(withImage.map((p) => p.id));
    const items = rawItems.map((p) => ({ ...p, hasImage: imgSet.has(p.id) }));

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  },

  async getById(id) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!product) throw ApiError.notFound('Producto no encontrado');
    return product;
  },

  async create(data) {
    return prisma.product.create({ data: cleanData(data), include: { category: true } });
  },

  async update(id, data) {
    await this.getById(id);
    return prisma.product.update({
      where: { id },
      data: cleanData(data),
      include: { category: true },
    });
  },

  // Borrado lógico si el producto ya tiene ventas; físico si no.
  async remove(id) {
    await this.getById(id);
    const salesCount = await prisma.saleDetail.count({ where: { productId: id } });
    if (salesCount > 0) {
      await prisma.product.update({ where: { id }, data: { active: false } });
      return { softDeleted: true };
    }
    await prisma.product.delete({ where: { id } });
    return { softDeleted: false };
  },
};
