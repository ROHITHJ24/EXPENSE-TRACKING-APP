import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError.js';

export function validateCreateGroup(req: Request, res: Response, next: NextFunction) {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return next(new AppError('Please provide a name for your split group (e.g. Vacation, Roommates, Office Lunch).', 400));
  }
  if (name.trim().length > 100) {
    return next(new AppError('Group name is too long. Please keep it within 100 characters.', 400));
  }
  next();
}

export function validateAddExpense(req: Request, res: Response, next: NextFunction) {
  const { title, amount, paidBy, splitMethod, splits } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return next(new AppError('Please enter a description for this shared group expense.', 400));
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return next(new AppError('Please enter an expense amount greater than zero.', 400));
  }

  if (!paidBy || typeof paidBy !== 'string') {
    return next(new AppError('Please select which group member paid for this expense.', 400));
  }

  if (!['equal', 'custom', 'percentage', 'shares'].includes(splitMethod)) {
    return next(new AppError('Please choose how to split this expense: equally, custom amounts, percentages, or shares.', 400));
  }

  if (!Array.isArray(splits) || splits.length === 0) {
    return next(new AppError('Please select at least one member to share this expense with.', 400));
  }

  next();
}

export function validateSettlement(req: Request, res: Response, next: NextFunction) {
  const { fromParticipantId, toParticipantId, amount } = req.body;

  if (!fromParticipantId || !toParticipantId) {
    return next(new AppError('Please select both the person paying and the person receiving the settlement.', 400));
  }

  if (fromParticipantId === toParticipantId) {
    return next(new AppError('A member cannot record a settlement payment to themselves. Please select another member.', 400));
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return next(new AppError('Please enter a settlement amount greater than zero.', 400));
  }

  next();
}
