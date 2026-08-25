import { z } from 'zod';

export const listAuditSchema = z.object({
  query: z.object({
    action: z
      .enum(['PRODUCT_PRICE_CHANGED', 'SALE_CANCELLED', 'STOCK_ADJUSTED', 'USER_ROLE_CHANGED', 'USER_STATUS_CHANGED'])
      .optional(),
    userId: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  }),
});
