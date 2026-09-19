import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/appError.js';
import { User } from '../models/User.js';
import { memoryStore } from '../services/store.js';
import { getDBStatus } from '../config/db.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
    name: string;
    email: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'expense-tracker-production-secret-key-32chars!';

export async function protect(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    let token: string | undefined;

    // 1. Check HTTP-only cookie first
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // 2. Or Authorization header (Bearer token)
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in. Please log in to access this resource.', 401));
    }

    // 3. Verify JWT
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        return next(new AppError('Your session has expired. Please log in again.', 401));
      }
      return next(new AppError('Invalid authentication token. Please log in again.', 401));
    }

    if (!decoded || !decoded.id) {
      return next(new AppError('Invalid token payload.', 401));
    }

    // 4. Verify user exists in database
    const dbStatus = getDBStatus();
    let currentUser: any = null;

    if (dbStatus.isAtlas) {
      currentUser = await User.findById(decoded.id).select('-passwordHash');
    } else {
      currentUser = memoryStore.users.find((u) => u._id === decoded.id);
    }

    if (!currentUser) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    // 5. Grant access
    req.user = {
      _id: currentUser._id.toString(),
      name: currentUser.name,
      email: currentUser.email,
    };

    next();
  } catch (err) {
    next(err);
  }
}
