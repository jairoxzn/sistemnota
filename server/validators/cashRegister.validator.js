import { z } from 'zod';

export const openCashSchema = z.object({
  body: z.object({
    openingAmount: z.coerce.number().min(0, 'El monto inicial no puede ser negativo'),
    note: z.string().max(200).optional().or(z.literal('')),
  }),
});

export const closeCashSchema = z.object({
  body: z.object({
    countedAmount: z.coerce.number().min(0, 'El monto contado no puede ser negativo'),
    note: z.string().max(200).optional().or(z.literal('')),
  }),
});

export const listCashSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  }),
});
