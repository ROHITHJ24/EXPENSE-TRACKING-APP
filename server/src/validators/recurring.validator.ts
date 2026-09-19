import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError.js';

export function validateCreateRecurring(req: Request, res: Response, next: NextFunction) {
  const { title, amount, categoryId, dueDay } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return next(new AppError('Please provide a title for this recurring commitment (e.g. Rent, Internet, Netflix).', 400));
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return next(new AppError('Please enter a recurring expense amount greater than zero.', 400));
  }

  if (!categoryId || typeof categoryId !== 'string') {
    return next(new AppError('Please select a category for this recurring expense.', 400));
  }

  const numDueDay = Number(dueDay);
  if (isNaN(numDueDay) || numDueDay < 1 || numDueDay > 31) {
    return next(new AppError('Please pick a day of the month between 1 and 31 for when this bill is due.', 400));
  }

  next();
}
