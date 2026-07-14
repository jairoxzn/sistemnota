import { Router } from 'express';
import { saleController } from '../controllers/sale.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { createSaleSchema, listSaleSchema, cancelSaleSchema } from '../validators/sale.validator.js';

const router = Router();

router.use(authenticate); // ADMIN y SELLER pueden registrar ventas

router.get('/', validate(listSaleSchema), saleController.list);
router.get('/:id', saleController.getById);
router.post('/', validate(createSaleSchema), saleController.create);
// Anular una venta (repone stock): solo administrador.
router.post('/:id/cancel', authorize('ADMIN'), validate(cancelSaleSchema), saleController.cancel);

export default router;
