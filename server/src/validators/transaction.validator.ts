import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError.js';
import { PAYMENT_METHODS } from '../utils/constants.js';

export function validateCreateTransaction(req: Request, res: Response, next: NextFunction) {
  const { type, amount, categoryId, date, paymentMethod, description } = req.body;

  if (!type || (type !== 'income' && type !== 'expense')) {
    return next(new AppError('Please choose whether this transaction is an income or an expense.', 400));
  }

  const numericAmount = Number(amount);
  if (isNaN(numericAmount) || numericAmount <= 0 || !isFinite(numericAmount)) {
    return next(new AppError('Please enter a transaction amount greater than zero.', 400));
  }

  if (numericAmount > 100000000) {
    return next(new AppError('The transaction amount is too high. Please enter an amount up to 100,000,000.', 400));
  }

  if (!categoryId || typeof categoryId !== 'string' || !categoryId.trim()) {
    return next(new AppError('Please choose a category for this transaction.', 400));
  }

  if (date) {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return next(new AppError('Please enter a valid date for this transaction.', 400));
    }
  }

  if (paymentMethod && !PAYMENT_METHODS.includes(paymentMethod)) {
    return next(
      new AppError(
        'Please select a recognized payment method such as Cash, Card, UPI, or Bank Transfer.',
        400
      )
    );
  }

  if (description && typeof description === 'string' && description.length > 200) {
    return next(new AppError('Description is a bit too long. Please keep it within 200 characters.', 400));
  }

  next();
}

export function validateUpdateTransaction(req: Request, res: Response, next: NextFunction) {
  const { type, amount, categoryId, date, paymentMethod, description } = req.body;

  if (type !== undefined && type !== 'income' && type !== 'expense') {
    return next(new AppError('Please choose whether this transaction is an income or an expense.', 400));
  }

  if (amount !== undefined) {
    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0 || !isFinite(numericAmount)) {
      return next(new AppError('Please enter a transaction amount greater than zero.', 400));
    }
    if (numericAmount > 100000000) {
      return next(new AppError('The transaction amount is too high. Please enter an amount up to 100,000,000.', 400));
    }
  }

  if (categoryId !== undefined && (!categoryId || typeof categoryId !== 'string')) {
    return next(new AppError('Please choose a valid category for this transaction.', 400));
  }

  if (date !== undefined) {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return next(new AppError('Please enter a valid date for this transaction.', 400));
    }
  }

  if (paymentMethod !== undefined && !PAYMENT_METHODS.includes(paymentMethod)) {
    return next(new AppError('Please select a recognized payment method such as Cash, Card, UPI, or Bank Transfer.', 400));
  }

  if (description !== undefined && typeof description === 'string' && description.length > 200) {
    return next(new AppError('Description is a bit too long. Please keep it within 200 characters.', 400));
  }

  next();
}
