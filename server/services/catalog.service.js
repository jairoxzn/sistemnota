import { prisma } from '../config/prisma.js';
import { storeSettingsService } from './storeSettings.service.js';

// Catálogo público: datos que se muestran a los clientes sin necesidad de login.
export const catalogService = {
  async get({ search, categoryId }) {
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

    const [products, categories, settings] = await Promise.all([
      prisma.product.findMany({
        where,
        // Sin el blob de imagen: se carga bajo demanda vía /public/product-image/:id
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
          price: true,
          stock: true,
          updatedAt: true,
          category: { select: { id: true, name: true } },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.category.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
      storeSettingsService.get(),
    ]);

    // Marca qué productos tienen imagen sin transferir el base64
    const withImage = products.length
      ? await prisma.product.findMany({
          where: { id: { in: products.map((p) => p.id) }, image: { not: null } },
          select: { id: true },
        })
      : [];
    const imgSet = new Set(withImage.map((p) => p.id));

    return {
      store: {
        name: settings.name,
        logo: settings.logo,
        phone: settings.phone,
        email: settings.email,
        address: settings.address,
        currency: settings.currency,
        whatsapp: settings.whatsapp,
        hours: settings.hours,
        mapsUrl: settings.mapsUrl,
        facebook: settings.facebook,
        instagram: settings.instagram,
        tiktok: settings.tiktok,
      },
      categories,
      products: products.map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        description: p.description,
        price: Number(p.price),
        hasImage: imgSet.has(p.id),
        updatedAt: p.updatedAt,
        category: p.category?.name || null,
        available: p.stock > 0, // no se expone el stock exacto al público
      })),
    };
  },
};
