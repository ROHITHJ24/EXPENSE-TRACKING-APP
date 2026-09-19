import dotenv from 'dotenv';
dotenv.config({ override: true });
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { apiLimiter } from './middleware/rateLimit.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import { getDBStatus } from './config/db.js';

import authRoutes from './routes/auth.routes.js';
import transactionRoutes from './routes/transaction.routes.js';
import categoryRoutes from './routes/category.routes.js';
import budgetRoutes from './routes/budget.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import recurringRoutes from './routes/recurring.routes.js';
import groupRoutes from './routes/group.routes.js';

const app = express();

// Trust reverse proxy (nginx / Cloud Run ingress) for accurate IP resolution
app.set('trust proxy', 1);

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Request body parsing with size limits
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Cookie parsing for HTTP-only JWT
app.use(cookieParser());

// General API rate limiter
app.use('/api', apiLimiter);

// System Status Endpoint
app.get('/api/system/status', (req, res) => {
  const status = getDBStatus();
  res.json({
    success: true,
    data: {
      status: 'operational',
      database: status.isAtlas ? 'MongoDB Atlas (Connected)' : 'Preview Mode (In-Memory Database Active)',
      isAtlas: status.isAtlas,
      mode: status.mode,
      authIssue: status.authIssue,
      timestamp: new Date().toISOString(),
    },
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/recurring', recurringRoutes);
app.use('/api/groups', groupRoutes);

// 404 for unhandled API endpoints
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API route ${req.originalUrl} not found`,
  });
});

// Centralized error handler
app.use(errorHandler);

export default app;
