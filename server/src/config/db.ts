import mongoose from 'mongoose';
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '../utils/constants.js';

let isConnected = false;
let connectionMode: 'atlas' | 'memory' = 'memory';
let authIssueDetected: string | null = null;

export async function connectDB(): Promise<void> {
  let uri = process.env.MONGODB_URI;

  // Sanitize URI if accidental angle brackets were included around password e.g. :<password>@
  if (uri && uri.includes(':<') && uri.includes('>@')) {
    uri = uri.replace(/:<([^>]+)>@/, ':$1@');
  }

  if (uri && !uri.includes('<username>') && !uri.includes('MY_MONGODB_URI')) {
    try {
      console.log('[Database] Connecting to MongoDB Atlas cluster...');
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 6000,
        dbName: 'expense_tracker',
      });
      isConnected = true;
      connectionMode = 'atlas';
      authIssueDetected = null;
      console.log('[Database] Connected to MongoDB Atlas');

      // Seed default categories if needed
      await seedDefaultCategories();
      return;
    } catch (err) {
      const errorMsg = (err as Error)?.message || '';
      if (errorMsg.includes('bad auth') || errorMsg.includes('authentication failed')) {
        authIssueDetected = 'Atlas credentials rejected. Please verify database user & password in MongoDB Atlas Security > Database Access.';
        console.log('[Database] Atlas credentials rejected. Using resilient in-memory database store.');
      } else {
        authIssueDetected = errorMsg;
        console.log('[Database] Atlas connection not available. Using resilient in-memory database store.');
      }
    }
  } else {
    console.log('[Database] No custom MONGODB_URI found. Using resilient in-memory database store.');
  }

  isConnected = false;
  connectionMode = 'memory';
}

export function getDBStatus() {
  return {
    isConnected: isConnected || connectionMode === 'memory',
    mode: connectionMode,
    isAtlas: connectionMode === 'atlas',
    authIssue: authIssueDetected,
    mongooseReadyState: mongoose.connection.readyState,
  };
}

async function seedDefaultCategories() {
  try {
    const { Category } = await import('../models/Category.js');
    const existingCount = await Category.countDocuments({ isDefault: true });
    if (existingCount === 0) {
      const allDefaults = [
        ...DEFAULT_EXPENSE_CATEGORIES.map((c) => ({ ...c, isDefault: true })),
        ...DEFAULT_INCOME_CATEGORIES.map((c) => ({ ...c, isDefault: true })),
      ];
      await Category.insertMany(allDefaults);
      console.log('Seeded default categories in MongoDB Atlas');
    }
  } catch (err) {
    console.error('Error seeding default categories:', err);
  }
}
