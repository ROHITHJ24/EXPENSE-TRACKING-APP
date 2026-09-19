import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import * as dashboardService from '../services/dashboard.service.js';

export async function getSummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const summary = await dashboardService.getDashboardSummary(req.user!._id);
    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (err) {
    next(err);
  }
}

export async function getAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const analytics = await dashboardService.getDashboardAnalytics(req.user!._id);
    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (err) {
    next(err);
  }
}
