import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Category } from '../models/Category.js';
import { memoryStore, generateId } from './store.js';
import { getDBStatus } from '../config/db.js';
import { AppError } from '../utils/appError.js';
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '../utils/constants.js';

const JWT_SECRET = process.env.JWT_SECRET || 'expense-tracker-production-secret-key-32chars!';
const JWT_EXPIRES_IN = '7d';

export function generateToken(id: string): string {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export async function register(name: string, email: string, password: string) {
  const normalizedEmail = email.toLowerCase().trim();
  const dbStatus = getDBStatus();

  // Check if user already exists
  if (dbStatus.isAtlas) {
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new AppError('An account with this email address already exists. Please sign in or use another email.', 409);
    }
  } else {
    const existingUser = memoryStore.users.find((u) => u.email === normalizedEmail);
    if (existingUser) {
      throw new AppError('An account with this email address already exists. Please sign in or use another email.', 409);
    }
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  let user: any;

  if (dbStatus.isAtlas) {
    user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
    });
  } else {
    const now = new Date();
    user = {
      _id: generateId(),
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    };
    memoryStore.users.push(user);
  }

  const token = generateToken(user._id.toString());

  return {
    user: {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
    },
    token,
  };
}

export async function login(email: string, password: string) {
  const normalizedEmail = email.toLowerCase().trim();
  const dbStatus = getDBStatus();

  let user: any;

  if (dbStatus.isAtlas) {
    user = await User.findOne({ email: normalizedEmail });
  } else {
    user = memoryStore.users.find((u) => u.email === normalizedEmail);
  }

  if (!user) {
    throw new AppError('Incorrect email or password. Please verify your details and try again.', 401);
  }

  // Compare password hash
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new AppError('Incorrect email or password. Please verify your details and try again.', 401);
  }

  const token = generateToken(user._id.toString());

  return {
    user: {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
    },
    token,
  };
}

export async function getMe(userId: string) {
  const dbStatus = getDBStatus();

  if (dbStatus.isAtlas) {
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      throw new AppError('User not found.', 404);
    }
    return user;
  } else {
    const user = memoryStore.users.find((u) => u._id === userId);
    if (!user) {
      throw new AppError('User not found.', 404);
    }
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
