import { asyncHandler } from '../utils/asyncHandler.js';
import { storeSettingsService } from '../services/storeSettings.service.js';

export const storeSettingsController = {
  get: asyncHandler(async (_req, res) => {
    const settings = await storeSettingsService.get();
    res.json({ success: true, settings });
  }),

  update: asyncHandler(async (req, res) => {
    const data = { ...req.body };
    if (data.logo === '') data.logo = null; // cadena vacía => quitar logo
    const settings = await storeSettingsService.update(data);
    res.json({ success: true, settings });
  }),
};
