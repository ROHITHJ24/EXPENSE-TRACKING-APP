import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import * as groupController from '../controllers/group.controller.js';
import {
  validateCreateGroup,
  validateAddExpense,
  validateSettlement,
} from '../validators/group.validator.js';

const router = Router();

router.use(protect);

// Group management
router.get('/', groupController.getUserGroups);
router.post('/', validateCreateGroup, groupController.createGroup);
router.get('/:groupId', groupController.getGroupDetails);

// Participants
router.post('/:groupId/participants', groupController.addParticipant);
router.delete('/:groupId/participants/:participantId', groupController.removeParticipant);

// Group Expenses
router.post('/:groupId/expenses', validateAddExpense, groupController.addGroupExpense);
router.delete('/:groupId/expenses/:expenseId', groupController.deleteGroupExpense);

// Group Balances & Settlement Engine
router.get('/:groupId/balances', groupController.getGroupBalances);
router.post('/:groupId/settlements', validateSettlement, groupController.recordSettlement);
router.patch(
  '/:groupId/settlements/:settlementId/status',
  groupController.updateSettlementStatus
);

export default router;
