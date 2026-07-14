import { Router } from 'express';
import { productController } from '../controllers/product.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import {
  createProductSchema,
  updateProductSchema,
  listProductSchema,
} from '../validators/product.validator.js';

const router = Router();

router.use(authenticate); // todas las rutas requieren sesión

router.get('/', validate(listProductSchema), productController.list);
router.get('/:id', productController.getById);
router.post('/', authorize('ADMIN'), validate(createProductSchema), productController.create);
router.put('/:id', authorize('ADMIN'), validate(updateProductSchema), productController.update);
router.delete('/:id', authorize('ADMIN'), productController.remove);

export default router;
