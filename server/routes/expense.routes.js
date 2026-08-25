import { Router } from 'express';
import { expenseController } from '../controllers/expense.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { createExpenseSchema, updateExpenseSchema, listExpenseSchema } from '../validators/expense.validator.js';

const router = Router();

router.use(authenticate);
// Los gastos son información financiera sensible: solo administradores.
router.use(authorize('ADMIN'));

router.get('/', validate(listExpenseSchema), expenseController.list);
router.get('/:id', expenseController.getById);
router.post('/', validate(createExpenseSchema), expenseController.create);
router.put('/:id', validate(updateExpenseSchema), expenseController.update);
router.delete('/:id', expenseController.remove);

export default router;
