import { z } from 'zod';

export const listUserSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Nombre muy corto').max(100),
    email: z.string().email('Correo inválido'),
    password: z.string().min(6, 'Mínimo 6 caracteres'),
    role: z.enum(['ADMIN', 'SELLER']).default('SELLER'),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    email: z.string().email('Correo inválido').optional(),
    role: z.enum(['ADMIN', 'SELLER']).optional(),
    active: z.boolean().optional(),
  }),
  params: z.object({ id: z.string().min(1) }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    password: z.string().min(6, 'Mínimo 6 caracteres'),
  }),
  params: z.object({ id: z.string().min(1) }),
});
