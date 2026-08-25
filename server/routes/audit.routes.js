import { Router } from 'express';
import { auditController } from '../controllers/audit.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { listAuditSchema } from '../validators/audit.validator.js';

const router = Router();

router.use(authenticate);

// Solo administradores pueden ver el registro de auditoría.
router.get('/', authorize('ADMIN'), validate(listAuditSchema), auditController.list);

export default router;
