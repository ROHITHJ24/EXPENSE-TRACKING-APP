import { RecurringExpense } from '../models/RecurringExpense.js';
import { memoryStore, generateId, InMemoryRecurringExpense } from './store.js';
import { getDBStatus } from '../config/db.js';
import { AppError } from '../utils/appError.js';

export async function getRecurringExpenses(userId: string) {
  const dbStatus = getDBStatus();
  if (dbStatus.isAtlas) {
    return RecurringExpense.find({ userId })
      .populate('categoryId', 'name icon color type')
      .sort({ dueDay: 1 })
      .lean();
  } else {
    const list = memoryStore.recurringExpenses.filter((r) => r.userId === userId);
    return list
      .map((r) => {
        const cat = memoryStore.categories.find((c) => c._id === r.categoryId);
        return {
          ...r,
          categoryId: cat
            ? { _id: cat._id, name: cat.name, icon: cat.icon, color: cat.color, type: cat.type }
            : r.categoryId,
        };
      })
      .sort((a, b) => a.dueDay - b.dueDay);
  }
}

export async function getUpcomingCommitments(userId: string, referenceDate = new Date()) {
  const recurring = await getRecurringExpenses(userId);
  const activeItems = (recurring as any[]).filter((r) => r.active !== false);

  const currentDay = referenceDate.getDate();
  const currentMonth = referenceDate.getMonth();
  const currentYear = referenceDate.getFullYear();
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Find commitments due between current day and end of month
  const upcomingItems = activeItems.filter((item) => {
    // If dueDay is between today and end of month
    return item.dueDay >= currentDay && item.dueDay <= lastDayOfMonth;
  });

  const totalUpcoming = upcomingItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  return {
    totalUpcoming,
    commitments: upcomingItems.map((item) => ({
      _id: item._id,
      title: item.title,
      amount: item.amount,
      dueDay: item.dueDay,
      dueDate: new Date(currentYear, currentMonth, item.dueDay),
      category: item.categoryId?.name ? item.categoryId : null,
    })),
  };
}

export async function createRecurringExpense(
  userId: string,
  data: {
    title: string;
    amount: number;
    categoryId: string;
    frequency?: 'monthly' | 'weekly' | 'yearly';
    dueDay: number;
    notes?: string;
  }
) {
  const dbStatus = getDBStatus();
  const frequency = data.frequency || 'monthly';

  if (dbStatus.isAtlas) {
    const mongoose = (await import('mongoose')).default;
    const doc = await RecurringExpense.create({
      userId: mongoose.Types.ObjectId.createFromHexString(userId),
      title: data.title,
      amount: data.amount,
      categoryId: mongoose.Types.ObjectId.createFromHexString(data.categoryId),
      frequency,
      dueDay: data.dueDay,
      notes: data.notes || '',
      active: true,
      startDate: new Date(),
    });
    return doc.populate('categoryId', 'name icon color type');
  } else {
    const newId = generateId();
    const item: InMemoryRecurringExpense = {
      _id: newId,
      userId,
      title: data.title,
      amount: data.amount,
      categoryId: data.categoryId,
      frequency,
      dueDay: data.dueDay,
      notes: data.notes || '',
      active: true,
      startDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.recurringExpenses.push(item);
    const cat = memoryStore.categories.find((c) => c._id === data.categoryId);
    return {
      ...item,
      categoryId: cat
        ? { _id: cat._id, name: cat.name, icon: cat.icon, color: cat.color, type: cat.type }
        : data.categoryId,
    };
  }
}

export async function updateRecurringExpense(userId: string, id: string, data: any) {
  const dbStatus = getDBStatus();
  if (dbStatus.isAtlas) {
    const doc = await RecurringExpense.findOneAndUpdate(
      { _id: id, userId },
      { $set: data },
      { new: true, runValidators: true }
    ).populate('categoryId', 'name icon color type');
    if (!doc) throw new AppError('Recurring expense not found', 404);
    return doc;
  } else {
    const idx = memoryStore.recurringExpenses.findIndex((r) => r._id === id && r.userId === userId);
    if (idx === -1) throw new AppError('Recurring expense not found', 404);
    memoryStore.recurringExpenses[idx] = {
      ...memoryStore.recurringExpenses[idx],
      ...data,
      updatedAt: new Date(),
    };
    const updated = memoryStore.recurringExpenses[idx];
    const cat = memoryStore.categories.find((c) => c._id === updated.categoryId);
    return {
      ...updated,
      categoryId: cat
        ? { _id: cat._id, name: cat.name, icon: cat.icon, color: cat.color, type: cat.type }
        : updated.categoryId,
    };
  }
}

export async function deleteRecurringExpense(userId: string, id: string) {
  const dbStatus = getDBStatus();
  if (dbStatus.isAtlas) {
    const res = await RecurringExpense.findOneAndDelete({ _id: id, userId });
    if (!res) throw new AppError('Recurring expense not found', 404);
    return { message: 'Recurring expense removed' };
  } else {
    const idx = memoryStore.recurringExpenses.findIndex((r) => r._id === id && r.userId === userId);
    if (idx === -1) throw new AppError('Recurring expense not found', 404);
    memoryStore.recurringExpenses.splice(idx, 1);
    return { message: 'Recurring expense removed' };
  }
}
