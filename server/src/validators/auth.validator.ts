import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError.js';

export function validateRegister(req: Request, res: Response, next: NextFunction) {
  const { name, email, password } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return next(new AppError('Please enter your full name (at least 2 characters).', 400));
  }

  if (name.trim().length > 100) {
    return next(new AppError('Name is too long. Please keep it under 100 characters.', 400));
  }

  if (!email || typeof email !== 'string') {
    return next(new AppError('Please enter your email address.', 400));
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return next(new AppError('Please enter a valid email address (e.g. name@example.com).', 400));
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return next(new AppError('Password must be at least 6 characters long for your account security.', 400));
  }

  if (password.length > 128) {
    return next(new AppError('Password is too long. Please choose a password up to 128 characters.', 400));
  }

  next();
}

export function validateLogin(req: Request, res: Response, next: NextFunction) {
  const { email, password } = req.body;

  if (!email || typeof email !== 'string' || !email.trim()) {
    return next(new AppError('Please enter your email address to sign in.', 400));
  }

  if (!password || typeof password !== 'string') {
    return next(new AppError('Please enter your account password.', 400));
  }

  next();
}
