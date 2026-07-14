import { Router } from 'express';
import { storeSettingsController } from '../controllers/storeSettings.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { updateStoreSettingsSchema } from '../validators/storeSettings.validator.js';

const router = Router();

router.use(authenticate);

// Cualquier usuario autenticado puede leer la configuración (se usa en la nota).
router.get('/', storeSettingsController.get);
// Solo el administrador puede modificarla.
router.put('/', authorize('ADMIN'), validate(updateStoreSettingsSchema), storeSettingsController.update);

export default router;
