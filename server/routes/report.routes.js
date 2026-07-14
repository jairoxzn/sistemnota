import { Router } from 'express';
import { reportController } from '../controllers/report.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/summary', reportController.summary);
router.get('/sales', reportController.salesByPeriod);
router.get('/top-products', reportController.topProducts);
router.get('/stock', reportController.stock);
router.get('/low-stock', reportController.lowStock);

export default router;
