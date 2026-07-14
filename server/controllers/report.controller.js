import { asyncHandler } from '../utils/asyncHandler.js';
import { reportService } from '../services/report.service.js';

export const reportController = {
  summary: asyncHandler(async (_req, res) => {
    const data = await reportService.summary();
    res.json({ success: true, summary: data });
  }),

  salesByPeriod: asyncHandler(async (req, res) => {
    const period = ['day', 'week', 'month'].includes(req.query.period) ? req.query.period : 'day';
    const data = await reportService.salesByPeriod(period);
    res.json({ success: true, period, data });
  }),

  topProducts: asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const data = await reportService.topProducts(limit);
    res.json({ success: true, data });
  }),

  stock: asyncHandler(async (_req, res) => {
    const data = await reportService.stock();
    res.json({ success: true, data });
  }),

  lowStock: asyncHandler(async (_req, res) => {
    const data = await reportService.lowStock();
    res.json({ success: true, ...data });
  }),
};
