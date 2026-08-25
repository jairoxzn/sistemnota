import { prisma } from '../config/prisma.js';

export const auditService = {
  /**
   * Registra una entrada de auditoría. Nunca debe romper la operación que la
   * origina: si falla el registro, solo se deja constancia en el log del server.
   */
  async log({ action, entity, entityId, summary, userId }) {
    try {
      await prisma.auditLog.create({
        data: { action, entity, entityId: entityId || null, summary, userId: userId || null },
      });
    } catch (err) {
      console.error('No se pudo registrar auditoría:', err);
    }
  },

  async list({ action, userId, from, to, page, pageSize }) {
    const where = {
      ...(action ? { action } : {}),
      ...(userId ? { userId } : {}),
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to
                ? {
                    lte: (() => {
                      const end = new Date(to);
                      end.setHours(23, 59, 59, 999);
                      return end;
                    })(),
                  }
                : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  },
};
