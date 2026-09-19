import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import * as recurringService from '../services/recurring.service.js';

export async function getRecurringExpenses(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const list = await recurringService.getRecurringExpenses(req.user!._id);
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
}

export async function getUpcomingCommitments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await recurringService.getUpcomingCommitments(req.user!._id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function createRecurringExpense(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const created = await recurringService.createRecurringExpense(req.user!._id, {
      title: req.body.title.trim(),
      amount: Number(req.body.amount),
      categoryId: req.body.categoryId,
      frequency: req.body.frequency,
      dueDay: Number(req.body.dueDay),
      notes: req.body.notes,
    });
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
}

export async function updateRecurringExpense(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const updated = await recurringService.updateRecurringExpense(
      req.user!._id,
      req.params.id,
      req.body
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

export async function deleteRecurringExpense(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = await recurringService.deleteRecurringExpense(req.user!._id, req.params.id);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}
