import { z } from 'zod';

export const createMovementSchema = z.object({
  body: z.object({
    productId: z.string().min(1, 'Producto requerido'),
    type: z.enum(['ENTRY', 'ADJUSTMENT', 'LOSS'], {
      errorMap: () => ({ message: 'Tipo inválido (ENTRY, ADJUSTMENT o LOSS)' }),
    }),
    quantity: z.coerce.number().int('Debe ser entero').refine((v) => v !== 0, 'La cantidad no puede ser 0'),
    reason: z.string().max(200).optional().or(z.literal('')),
  }),
});

export const listMovementSchema = z.object({
  query: z.object({
    productId: z.string().optional(),
    type: z.enum(['ENTRY', 'ADJUSTMENT', 'LOSS', 'SALE', 'SALE_CANCELLED']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  }),
});
