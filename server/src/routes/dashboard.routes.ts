import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect);

router.get('/summary', dashboardController.getSummary);
router.get('/analytics', dashboardController.getAnalytics);

export default router;
