import { z } from 'zod';

export const createSaleSchema = z.object({
  body: z.object({
    customerId: z.string().optional().nullable().or(z.literal('')),
    paymentMethod: z.enum(['CASH', 'TRANSFER', 'CARD', 'OTHER']).default('CASH'),
    discount: z.coerce.number().min(0, 'El descuento no puede ser negativo').default(0),
    note: z.string().max(300).optional().or(z.literal('')),
    items: z
      .array(
        z.object({
          productId: z.string().min(1, 'Producto requerido'),
          quantity: z.coerce.number().int().positive('La cantidad debe ser mayor a 0'),
        })
      )
      .min(1, 'La venta debe tener al menos un producto'),
  }),
});

export const cancelSaleSchema = z.object({
  body: z.object({
    reason: z.string().min(3, 'Indica el motivo de la anulación').max(200),
  }),
  params: z.object({ id: z.string().min(1) }),
});

export const listSaleSchema = z.object({
  query: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  }),
});
