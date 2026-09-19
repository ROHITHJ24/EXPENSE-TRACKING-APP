import { Router } from 'express';
import * as budgetController from '../controllers/budget.controller.js';
import { validateCreateBudget, validateUpdateBudget } from '../validators/budget.validator.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect);

router.get('/', budgetController.getBudgets);
router.post('/', validateCreateBudget, budgetController.createOrUpdateBudget);
router.delete('/:id', budgetController.deleteBudget);

export default router;
