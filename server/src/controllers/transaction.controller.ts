import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import * as transactionService from '../services/transaction.service.js';

export async function getTransactions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = await transactionService.getTransactions(req.user!._id, req.query as any);
    res.status(200).json({
      success: true,
      data: result.transactions,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
}

export async function createTransaction(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const transaction = await transactionService.createTransaction(req.user!._id, req.body);
    res.status(201).json({
      success: true,
      data: transaction,
      message: 'Transaction recorded successfully.',
    });
  } catch (err) {
    next(err);
  }
}

export async function getTransactionById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const transaction = await transactionService.getTransactionById(req.user!._id, req.params.id);
    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateTransaction(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const transaction = await transactionService.updateTransaction(
      req.user!._id,
      req.params.id,
      req.body
    );
    res.status(200).json({
      success: true,
      data: transaction,
      message: 'Transaction updated successfully.',
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteTransaction(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await transactionService.deleteTransaction(req.user!._id, req.params.id);
    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
}
