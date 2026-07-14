import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import {
  listUserSchema,
  createUserSchema,
  updateUserSchema,
  resetPasswordSchema,
} from '../validators/user.validator.js';

const router = Router();

// Toda la gestión de usuarios es exclusiva del administrador.
router.use(authenticate, authorize('ADMIN'));

router.get('/', validate(listUserSchema), userController.list);
router.post('/', validate(createUserSchema), userController.create);
router.put('/:id', validate(updateUserSchema), userController.update);
router.patch('/:id/password', validate(resetPasswordSchema), userController.resetPassword);

export default router;
