import { Router } from 'express';
import * as transactionController from '../controllers/transaction.controller.js';
import {
  validateCreateTransaction,
  validateUpdateTransaction,
} from '../validators/transaction.validator.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect); // All transaction routes require authentication

router.get('/', transactionController.getTransactions);
router.post('/', validateCreateTransaction, transactionController.createTransaction);
router.get('/:id', transactionController.getTransactionById);
router.patch('/:id', validateUpdateTransaction, transactionController.updateTransaction);
router.delete('/:id', transactionController.deleteTransaction);

export default router;
