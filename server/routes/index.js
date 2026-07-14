import { Router } from 'express';
import authRoutes from './auth.routes.js';
import productRoutes from './product.routes.js';
import customerRoutes from './customer.routes.js';
import categoryRoutes from './category.routes.js';
import saleRoutes from './sale.routes.js';
import reportRoutes from './report.routes.js';
import storeSettingsRoutes from './storeSettings.routes.js';
import stockMovementRoutes from './stockMovement.routes.js';
import quoteRoutes from './quote.routes.js';
import publicRoutes from './public.routes.js';
import userRoutes from './user.routes.js';
import cashRegisterRoutes from './cashRegister.routes.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ success: true, status: 'ok' }));

// Público (sin auth) — catálogo para clientes
router.use('/public', publicRoutes);

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/customers', customerRoutes);
router.use('/categories', categoryRoutes);
router.use('/sales', saleRoutes);
router.use('/quotes', quoteRoutes);
router.use('/reports', reportRoutes);
router.use('/settings', storeSettingsRoutes);
router.use('/stock-movements', stockMovementRoutes);
router.use('/users', userRoutes);
router.use('/cash', cashRegisterRoutes);

export default router;
