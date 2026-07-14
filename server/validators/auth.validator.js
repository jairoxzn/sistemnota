import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Correo inválido'),
    password: z.string().min(1, 'La contraseña es obligatoria'),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Nombre muy corto'),
    email: z.string().email('Correo inválido'),
    password: z.string().min(6, 'Mínimo 6 caracteres'),
    role: z.enum(['ADMIN', 'SELLER']).default('SELLER'),
  }),
});
