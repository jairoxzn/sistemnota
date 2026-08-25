import { asyncHandler } from '../utils/asyncHandler.js';
import { auditService } from '../services/audit.service.js';

export const auditController = {
  list: asyncHandler(async (req, res) => {
    const result = await auditService.list(req.validatedQuery);
    res.json({ success: true, ...result });
  }),
};
