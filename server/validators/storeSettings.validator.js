import { z } from 'zod';

export const updateStoreSettingsSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'El nombre es obligatorio').max(150),
    ruc: z.string().max(30).optional().or(z.literal('')),
    address: z.string().max(200).optional().or(z.literal('')),
    phone: z.string().max(30).optional().or(z.literal('')),
    email: z.string().email('Correo inválido').optional().or(z.literal('')),
    currency: z.string().min(1).max(5).default('S/'),
    thankYouMessage: z.string().max(200).optional().or(z.literal('')),
    lowStockThreshold: z.coerce.number().int().min(0).max(100000).default(10),
    requireCashRegister: z
      .preprocess((v) => (typeof v === 'string' ? v === 'true' : v), z.boolean())
      .default(true),
    // Logo como data URL (base64) o cadena vacía para quitarlo
    logo: z
      .string()
      .refine((v) => v === '' || v.startsWith('data:image/'), 'El logo debe ser una imagen')
      .optional()
      .nullable(),
  }),
});
