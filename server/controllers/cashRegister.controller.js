import { asyncHandler } from '../utils/asyncHandler.js';
import { cashRegisterService } from '../services/cashRegister.service.js';

export const cashRegisterController = {
  current: asyncHandler(async (_req, res) => {
    const current = await cashRegisterService.getCurrent();
    res.json({ success: true, current });
  }),

  open: asyncHandler(async (req, res) => {
    const cash = await cashRegisterService.open(req.body, req.user.id);
    res.status(201).json({ success: true, cash });
  }),

  close: asyncHandler(async (req, res) => {
    const cash = await cashRegisterService.close(req.body, req.user.id);
    res.json({ success: true, cash });
  }),

  list: asyncHandler(async (req, res) => {
    const result = await cashRegisterService.list(req.validatedQuery);
    res.json({ success: true, ...result });
  }),

  getById: asyncHandler(async (req, res) => {
    const cash = await cashRegisterService.getById(req.params.id);
    res.json({ success: true, cash });
  }),
};
