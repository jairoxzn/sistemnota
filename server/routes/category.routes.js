import { Router } from 'express';
import { categoryController } from '../controllers/category.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { categorySchema, categoryUpdateSchema } from '../validators/category.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', categoryController.list);
router.post('/', authorize('ADMIN'), validate(categorySchema), categoryController.create);
router.put('/:id', authorize('ADMIN'), validate(categoryUpdateSchema), categoryController.update);
router.delete('/:id', authorize('ADMIN'), categoryController.remove);

export default router;
