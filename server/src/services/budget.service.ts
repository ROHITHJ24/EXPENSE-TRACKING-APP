import { Budget } from '../models/Budget.js';
import { Transaction } from '../models/Transaction.js';
import { Category } from '../models/Category.js';
import { memoryStore, generateId } from './store.js';
import { getDBStatus } from '../config/db.js';
import { AppError } from '../utils/appError.js';

export async function getBudgets(userId: string, month?: number, year?: number) {
  const current = new Date();
  const targetMonth = month || current.getMonth() + 1;
  const targetYear = year || current.getFullYear();

  const dbStatus = getDBStatus();

  // Date range for the target month
  const startDate = new Date(targetYear, targetMonth - 1, 1);
  const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

  if (dbStatus.isAtlas) {
    const budgets = await Budget.find({
      userId,
      month: targetMonth,
      year: targetYear,
    })
      .populate('categoryId', 'name type icon color')
      .lean();

    // Fetch actual category spendings using MongoDB aggregation
    const spendings = await Transaction.aggregate([
      {
        $match: {
          userId: (budgets[0] as any)?.userId || (await import('mongoose')).default.Types.ObjectId.createFromHexString(userId),
          type: 'expense',
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$categoryId',
          totalSpent: { $sum: '$amount' },
        },
      },
    ]);

    const spendingMap = new Map<string, number>();
    spendings.forEach((s: any) => {
      spendingMap.set(s._id.toString(), s.totalSpent);
    });

    return budgets.map((b: any) => {
      const categoryIdStr = b.categoryId?._id?.toString() || b.categoryId?.toString();
      const spent = spendingMap.get(categoryIdStr) || 0;
      const percentage = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
      return {
        _id: b._id.toString(),
        categoryId: categoryIdStr,
        category: b.categoryId,
        amount: b.amount,
        spent,
        remaining: Math.max(0, b.amount - spent),
        percentage,
        isNearLimit: percentage >= 80 && percentage <= 100,
        isExceeded: percentage > 100,
        month: b.month,
        year: b.year,
        period: b.period,
      };
    });
  } else {
    // Memory store
    const userBudgets = memoryStore.budgets.filter(
      (b) => b.userId === userId && b.month === targetMonth && b.year === targetYear
    );

    // Calculate actual spending in that month for expenses
    const startMs = startDate.getTime();
    const endMs = endDate.getTime();
    const monthExpenses = memoryStore.transactions.filter((t) => {
      const txTime = new Date(t.date).getTime();
      return t.userId === userId && t.type === 'expense' && txTime >= startMs && txTime <= endMs;
    });

    return userBudgets.map((b) => {
      const spent = monthExpenses
        .filter((t) => t.categoryId === b.categoryId)
        .reduce((sum, t) => sum + t.amount, 0);

      const percentage = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
      const cat = memoryStore.categories.find((c) => c._id === b.categoryId);

      return {
        _id: b._id,
        categoryId: b.categoryId,
        category: cat
          ? { _id: cat._id, name: cat.name, type: cat.type, icon: cat.icon, color: cat.color }
          : null,
        amount: b.amount,
        spent,
        remaining: Math.max(0, b.amount - spent),
        percentage,
        isNearLimit: percentage >= 80 && percentage <= 100,
        isExceeded: percentage > 100,
        month: b.month,
        year: b.year,
        period: b.period,
      };
    });
  }
}

export async function createOrUpdateBudget(
  userId: string,
  data: {
    categoryId: string;
    amount: number;
    month: number;
    year: number;
    period?: 'monthly';
  }
) {
  const dbStatus = getDBStatus();

  // Validate category
  if (dbStatus.isAtlas) {
    const cat = await Category.findOne({
      _id: data.categoryId,
      type: 'expense',
      $or: [{ userId }, { isDefault: true }, { userId: null }],
    });
    if (!cat) {
      throw new AppError('Budget can only be created for an active expense category.', 400);
    }

    const budget = await Budget.findOneAndUpdate(
      {
        userId,
        categoryId: data.categoryId,
        month: data.month,
        year: data.year,
      },
      {
        amount: Number(data.amount),
        period: data.period || 'monthly',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate('categoryId', 'name type icon color');

    return budget;
  } else {
    const cat = memoryStore.categories.find(
      (c) =>
        c._id === data.categoryId &&
        c.type === 'expense' &&
        (c.isDefault || c.userId === userId || !c.userId)
    );
    if (!cat) {
      throw new AppError('Budget can only be created for an active expense category.', 400);
    }

    const existingIndex = memoryStore.budgets.findIndex(
      (b) =>
        b.userId === userId &&
        b.categoryId === data.categoryId &&
        b.month === data.month &&
        b.year === data.year
    );

    if (existingIndex >= 0) {
      memoryStore.budgets[existingIndex].amount = Number(data.amount);
      memoryStore.budgets[existingIndex].updatedAt = new Date();
      return memoryStore.budgets[existingIndex];
    } else {
      const newBudget = {
        _id: generateId(),
        userId,
        categoryId: data.categoryId,
        amount: Number(data.amount),
        period: (data.period || 'monthly') as 'monthly',
        month: data.month,
        year: data.year,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryStore.budgets.push(newBudget);
      return newBudget;
    }
  }
}

export async function deleteBudget(userId: string, budgetId: string) {
  const dbStatus = getDBStatus();

  if (dbStatus.isAtlas) {
    const result = await Budget.findOneAndDelete({ _id: budgetId, userId });
    if (!result) {
      throw new AppError('Budget not found or unauthorized.', 404);
    }
    return true;
  } else {
    const index = memoryStore.budgets.findIndex((b) => b._id === budgetId && b.userId === userId);
    if (index === -1) {
      throw new AppError('Budget not found or unauthorized.', 404);
    }
    memoryStore.budgets.splice(index, 1);
    return true;
  }
}
