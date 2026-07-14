import { z } from 'zod';

export const categorySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'El nombre es obligatorio').max(80),
  }),
});

export const categoryUpdateSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'El nombre es obligatorio').max(80),
  }),
  params: z.object({ id: z.string().min(1) }),
});
