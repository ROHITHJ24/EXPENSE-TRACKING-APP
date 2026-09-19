import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import * as recurringController from '../controllers/recurring.controller.js';
import { validateCreateRecurring } from '../validators/recurring.validator.js';

const router = Router();

router.use(protect);

router.get('/', recurringController.getRecurringExpenses);
router.get('/commitments', recurringController.getUpcomingCommitments);
router.post('/', validateCreateRecurring, recurringController.createRecurringExpense);
router.patch('/:id', recurringController.updateRecurringExpense);
router.delete('/:id', recurringController.deleteRecurringExpense);

export default router;
