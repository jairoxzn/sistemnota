import { asyncHandler } from '../utils/asyncHandler.js';
import { quoteService } from '../services/quote.service.js';
import { storeSettingsService } from '../services/storeSettings.service.js';

export const quoteController = {
  create: asyncHandler(async (req, res) => {
    const quote = await quoteService.create(req.body, req.user.id);
    const store = await storeSettingsService.get();
    res.status(201).json({ success: true, quote, store });
  }),

  list: asyncHandler(async (req, res) => {
    const result = await quoteService.list(req.validatedQuery);
    res.json({ success: true, ...result });
  }),

  getById: asyncHandler(async (req, res) => {
    const quote = await quoteService.getById(req.params.id);
    const store = await storeSettingsService.get();
    res.json({ success: true, quote, store });
  }),

  cancel: asyncHandler(async (req, res) => {
    const quote = await quoteService.cancel(req.params.id);
    res.json({ success: true, quote });
  }),

  // Convierte la cotización en venta y devuelve la venta + datos de tienda (para la nota)
  convert: asyncHandler(async (req, res) => {
    const sale = await quoteService.convert(req.params.id, req.body, req.user.id);
    const store = await storeSettingsService.get();
    res.status(201).json({ success: true, sale, store });
  }),
};
