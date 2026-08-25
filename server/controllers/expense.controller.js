import { asyncHandler } from '../utils/asyncHandler.js';
import { expenseService } from '../services/expense.service.js';

export const expenseController = {
  list: asyncHandler(async (req, res) => {
    const result = await expenseService.list(req.validatedQuery);
    res.json({ success: true, ...result });
  }),

  getById: asyncHandler(async (req, res) => {
    const expense = await expenseService.getById(req.params.id);
    res.json({ success: true, expense });
  }),

  create: asyncHandler(async (req, res) => {
    const expense = await expenseService.create(req.body, req.user.id);
    res.status(201).json({ success: true, expense });
  }),

  update: asyncHandler(async (req, res) => {
    const expense = await expenseService.update(req.params.id, req.body);
    res.json({ success: true, expense });
  }),

  remove: asyncHandler(async (req, res) => {
    await expenseService.remove(req.params.id);
    res.json({ success: true });
  }),
};
