import { asyncHandler } from '../utils/asyncHandler.js';
import { customerService } from '../services/customer.service.js';

export const customerController = {
  list: asyncHandler(async (req, res) => {
    const result = await customerService.list(req.validatedQuery);
    res.json({ success: true, ...result });
  }),

  getById: asyncHandler(async (req, res) => {
    const customer = await customerService.getById(req.params.id);
    res.json({ success: true, customer });
  }),

  create: asyncHandler(async (req, res) => {
    const customer = await customerService.create(req.body);
    res.status(201).json({ success: true, customer });
  }),

  update: asyncHandler(async (req, res) => {
    const customer = await customerService.update(req.params.id, req.body);
    res.json({ success: true, customer });
  }),

  remove: asyncHandler(async (req, res) => {
    await customerService.remove(req.params.id);
    res.json({ success: true });
  }),
};
