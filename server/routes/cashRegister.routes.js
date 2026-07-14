import { Router } from 'express';
import { cashRegisterController } from '../controllers/cashRegister.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { openCashSchema, closeCashSchema, listCashSchema } from '../validators/cashRegister.validator.js';

const router = Router();

// El cajero (SELLER) y el ADMIN pueden manejar la caja.
router.use(authenticate);

router.get('/current', cashRegisterController.current);
router.get('/', validate(listCashSchema), cashRegisterController.list);
router.get('/:id', cashRegisterController.getById);
router.post('/open', validate(openCashSchema), cashRegisterController.open);
router.post('/close', validate(closeCashSchema), cashRegisterController.close);

export default router;
