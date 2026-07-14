import { Router } from 'express';
import { stockMovementController } from '../controllers/stockMovement.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { createMovementSchema, listMovementSchema } from '../validators/stockMovement.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', validate(listMovementSchema), stockMovementController.list);
// Registrar entradas/ajustes/mermas: solo administrador.
router.post('/', authorize('ADMIN'), validate(createMovementSchema), stockMovementController.create);

export default router;
