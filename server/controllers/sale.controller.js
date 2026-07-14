import { asyncHandler } from '../utils/asyncHandler.js';
import { saleService } from '../services/sale.service.js';
import { storeSettingsService } from '../services/storeSettings.service.js';

export const saleController = {
  create: asyncHandler(async (req, res) => {
    const sale = await saleService.create(req.body, req.user.id);
    const store = await storeSettingsService.get();
    res.status(201).json({ success: true, sale, store });
  }),

  list: asyncHandler(async (req, res) => {
    const result = await saleService.list(req.validatedQuery);
    res.json({ success: true, ...result });
  }),

  getById: asyncHandler(async (req, res) => {
    const sale = await saleService.getById(req.params.id);
    const store = await storeSettingsService.get();
    res.json({ success: true, sale, store });
  }),

  cancel: asyncHandler(async (req, res) => {
    const sale = await saleService.cancel(req.params.id, req.body.reason, req.user.id);
    res.json({ success: true, sale });
  }),
};
