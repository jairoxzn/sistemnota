import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { hashPassword } from '../utils/password.js';

const publicSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  active: true,
  createdAt: true,
};

export const userService = {
  async list({ search, page, pageSize }) {
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: publicSelect,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);
    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  },

  async create({ name, email, password, role }) {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) throw ApiError.conflict('El correo ya está registrado');
    return prisma.user.create({
      data: { name, email, password: await hashPassword(password), role },
      select: publicSelect,
    });
  },

  async update(id, data, currentUserId) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw ApiError.notFound('Usuario no encontrado');

    // Evita que un admin se quite a sí mismo el rol o se desactive (se bloquearía)
    if (id === currentUserId) {
      if (data.role && data.role !== user.role) {
        throw ApiError.badRequest('No puedes cambiar tu propio rol');
      }
      if (data.active === false) {
        throw ApiError.badRequest('No puedes desactivar tu propia cuenta');
      }
    }

    // Si se cambia el email, verificar que no esté en uso por otro usuario
    if (data.email && data.email !== user.email) {
      const other = await prisma.user.findUnique({ where: { email: data.email } });
      if (other) throw ApiError.conflict('El correo ya está registrado');
    }

    return prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.role !== undefined ? { role: data.role } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
      },
      select: publicSelect,
    });
  },

  async resetPassword(id, newPassword) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw ApiError.notFound('Usuario no encontrado');
    await prisma.user.update({
      where: { id },
      data: { password: await hashPassword(newPassword) },
    });
    return { success: true };
  },
};
