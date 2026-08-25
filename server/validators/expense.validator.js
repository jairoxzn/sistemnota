import { z } from 'zod';

const CATEGORIES = ['RENT', 'UTILITIES', 'PAYROLL', 'SUPPLIES', 'MAINTENANCE', 'TAXES', 'OTHER'];

const expenseBody = z.object({
  category: z.enum(CATEGORIES, { errorMap: () => ({ message: 'Categoría inválida' }) }),
  description: z.string().min(2, 'La descripción es obligatoria').max(200),
  amount: z.coerce.number().positive('El monto debe ser mayor a 0'),
  date: z.string().optional().or(z.literal('')),
  note: z.string().max(300).optional().or(z.literal('')),
});

export const createExpenseSchema = z.object({ body: expenseBody });

export const updateExpenseSchema = z.object({
  body: expenseBody.partial(),
  params: z.object({ id: z.string().min(1) }),
});

export const listExpenseSchema = z.object({
  query: z.object({
    category: z.enum(CATEGORIES).optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  }),
});
