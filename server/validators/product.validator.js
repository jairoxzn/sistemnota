import { z } from 'zod';

const productBody = z.object({
  code: z.string().min(1, 'El código es obligatorio').max(50),
  name: z.string().min(2, 'El nombre es obligatorio').max(150),
  description: z.string().max(500).optional().or(z.literal('')),
  price: z.coerce.number().nonnegative('El precio no puede ser negativo'),
  stock: z.coerce.number().int('Stock debe ser entero').min(0, 'El stock no puede ser negativo'),
  categoryId: z.string().optional().nullable().or(z.literal('')),
  image: z
    .string()
    .refine((v) => v === '' || v.startsWith('data:image/'), 'La imagen debe ser un archivo válido')
    .optional()
    .nullable(),
});

export const createProductSchema = z.object({ body: productBody });

export const updateProductSchema = z.object({
  body: productBody.partial(),
  params: z.object({ id: z.string().min(1) }),
});

export const listProductSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    categoryId: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  }),
});
