import { z } from 'zod';

const customerBody = z.object({
  fullName: z.string().min(2, 'El nombre es obligatorio').max(150),
  documentId: z.string().min(4, 'Documento inválido').max(20),
  phone: z.string().max(20).optional().or(z.literal('')),
  email: z.string().email('Correo inválido').optional().or(z.literal('')),
  address: z.string().max(200).optional().or(z.literal('')),
});

export const createCustomerSchema = z.object({ body: customerBody });

export const updateCustomerSchema = z.object({
  body: customerBody.partial(),
  params: z.object({ id: z.string().min(1) }),
});

export const listCustomerSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  }),
});
