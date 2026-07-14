import { asyncHandler } from '../utils/asyncHandler.js';
import { productService } from '../services/product.service.js';

export const productController = {
  list: asyncHandler(async (req, res) => {
    const result = await productService.list(req.validatedQuery);
    res.json({ success: true, ...result });
  }),

  getById: asyncHandler(async (req, res) => {
    const product = await productService.getById(req.params.id);
    res.json({ success: true, product });
  }),

  create: asyncHandler(async (req, res) => {
    const product = await productService.create(req.body);
    res.status(201).json({ success: true, product });
  }),

  update: asyncHandler(async (req, res) => {
    const product = await productService.update(req.params.id, req.body);
    res.json({ success: true, product });
  }),

  remove: asyncHandler(async (req, res) => {
    const result = await productService.remove(req.params.id);
    res.json({ success: true, ...result });
  }),
};
