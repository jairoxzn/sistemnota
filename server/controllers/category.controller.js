import { asyncHandler } from '../utils/asyncHandler.js';
import { categoryService } from '../services/category.service.js';

export const categoryController = {
  list: asyncHandler(async (_req, res) => {
    const categories = await categoryService.list();
    res.json({ success: true, categories });
  }),

  create: asyncHandler(async (req, res) => {
    const category = await categoryService.create(req.body.name);
    res.status(201).json({ success: true, category });
  }),

  update: asyncHandler(async (req, res) => {
    const category = await categoryService.update(req.params.id, req.body.name);
    res.json({ success: true, category });
  }),

  remove: asyncHandler(async (req, res) => {
    await categoryService.remove(req.params.id);
    res.json({ success: true });
  }),
};
