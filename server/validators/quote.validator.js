import { z } from 'zod';

export const createQuoteSchema = z.object({
  body: z.object({
    customerId: z.string().optional().nullable().or(z.literal('')),
    discount: z.coerce.number().min(0, 'El descuento no puede ser negativo').default(0),
    note: z.string().max(300).optional().nullable().or(z.literal('')),
    validUntil: z.string().optional().nullable().or(z.literal('')),
    items: z
      .array(
        z.object({
          productId: z.string().min(1, 'Producto requerido'),
          quantity: z.coerce.number().int().positive('La cantidad debe ser mayor a 0'),
        })
      )
      .min(1, 'La cotización debe tener al menos un producto'),
  }),
});

export const convertQuoteSchema = z.object({
  body: z.object({
    paymentMethod: z.enum(['CASH', 'TRANSFER', 'CARD', 'OTHER']).default('CASH'),
  }),
  params: z.object({ id: z.string().min(1) }),
});

export const listQuoteSchema = z.object({
  query: z.object({
    status: z.enum(['PENDING', 'CONVERTED', 'CANCELLED']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  }),
});
