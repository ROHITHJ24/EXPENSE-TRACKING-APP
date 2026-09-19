import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError.js';

export function validateCreateBudget(req: Request, res: Response, next: NextFunction) {
  const { categoryId, amount, month, year, period } = req.body;

  if (!categoryId || typeof categoryId !== 'string') {
    return next(new AppError('Please select a category to set this monthly budget.', 400));
  }

  const numericAmount = Number(amount);
  if (isNaN(numericAmount) || numericAmount < 1) {
    return next(new AppError('Please enter a budget target of at least 1.', 400));
  }

  const numericMonth = Number(month);
  if (isNaN(numericMonth) || numericMonth < 1 || numericMonth > 12) {
    return next(new AppError('Please select a valid month (January through December).', 400));
  }

  const numericYear = Number(year);
  if (isNaN(numericYear) || numericYear < 2000 || numericYear > 2100) {
    return next(new AppError('Please enter a valid 4-digit calendar year.', 400));
  }

  if (period && period !== 'monthly') {
    return next(new AppError('Budgets are currently tracked on a monthly basis.', 400));
  }

  next();
}

export function validateUpdateBudget(req: Request, res: Response, next: NextFunction) {
  const { amount } = req.body;

  if (amount !== undefined) {
    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount < 1) {
      return next(new AppError('Please enter a budget target of at least 1.', 400));
    }
  }

  next();
}
