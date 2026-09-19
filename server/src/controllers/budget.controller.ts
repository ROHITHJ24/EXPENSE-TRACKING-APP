import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import * as budgetService from '../services/budget.service.js';

export async function getBudgets(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const month = req.query.month ? Number(req.query.month) : undefined;
    const year = req.query.year ? Number(req.query.year) : undefined;

    const budgets = await budgetService.getBudgets(req.user!._id, month, year);
    res.status(200).json({
      success: true,
      data: budgets,
    });
  } catch (err) {
    next(err);
  }
}

export async function createOrUpdateBudget(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const budget = await budgetService.createOrUpdateBudget(req.user!._id, req.body);
    res.status(201).json({
      success: true,
      data: budget,
      message: 'Budget saved successfully.',
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteBudget(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await budgetService.deleteBudget(req.user!._id, id);
    res.status(200).json({
      success: true,
      message: 'Budget removed successfully.',
    });
  } catch (err) {
    next(err);
  }
}
