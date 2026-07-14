import { prisma } from '../config/prisma.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';
import { ApiError } from '../utils/ApiError.js';

function toPublicUser(user) {
  const { password, ...rest } = user;
  return rest;
}

export const authService = {
  async login(email, password) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.active) {
      throw ApiError.unauthorized('Credenciales incorrectas');
    }
    const ok = await comparePassword(password, user.password);
    if (!ok) throw ApiError.unauthorized('Credenciales incorrectas');

    const token = signToken({
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
    return { token, user: toPublicUser(user) };
  },

  async register({ name, email, password, role }) {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) throw ApiError.conflict('El correo ya está registrado');

    const user = await prisma.user.create({
      data: { name, email, password: await hashPassword(password), role },
    });
    return toPublicUser(user);
  },

  async me(userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound('Usuario no encontrado');
    return toPublicUser(user);
  },
};
