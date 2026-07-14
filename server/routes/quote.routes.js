import { Router } from 'express';
import { quoteController } from '../controllers/quote.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createQuoteSchema, listQuoteSchema, convertQuoteSchema } from '../validators/quote.validator.js';

const router = Router();

router.use(authenticate); // ADMIN y SELLER pueden cotizar

router.get('/', validate(listQuoteSchema), quoteController.list);
router.get('/:id', quoteController.getById);
router.post('/', validate(createQuoteSchema), quoteController.create);
router.post('/:id/convert', validate(convertQuoteSchema), quoteController.convert);
router.post('/:id/cancel', quoteController.cancel);

export default router;
