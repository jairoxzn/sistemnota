import { asyncHandler } from '../utils/asyncHandler.js';
import { stockMovementService } from '../services/stockMovement.service.js';

export const stockMovementController = {
  list: asyncHandler(async (req, res) => {
    const result = await stockMovementService.list(req.validatedQuery);
    res.json({ success: true, ...result });
  }),

  create: asyncHandler(async (req, res) => {
    const movement = await stockMovementService.create(req.body, req.user.id);
    res.status(201).json({ success: true, movement });
  }),
};
