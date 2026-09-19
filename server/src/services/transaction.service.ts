import { Transaction } from '../models/Transaction.js';
import { Category } from '../models/Category.js';
import { memoryStore, generateId } from './store.js';
import { getDBStatus } from '../config/db.js';
import { AppError } from '../utils/appError.js';
import { PaymentMethod } from '../utils/constants.js';

export interface GetTransactionsQuery {
  page?: number;
  limit?: number;
  search?: string;
  type?: 'all' | 'income' | 'expense';
  categoryId?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'date' | 'amount';
  sortOrder?: 'asc' | 'desc';
}

export async function getTransactions(userId: string, query: GetTransactionsQuery) {
  const dbStatus = getDBStatus();

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 15));
  const skip = (page - 1) * limit;

  const sortBy = query.sortBy === 'amount' ? 'amount' : 'date';
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

  if (dbStatus.isAtlas) {
    const filter: any = { userId };

    if (query.type && query.type !== 'all') {
      filter.type = query.type;
    }

    if (query.categoryId) {
      filter.categoryId = query.categoryId;
    }

    if (query.paymentMethod) {
      filter.paymentMethod = query.paymentMethod;
    }

    if (query.startDate || query.endDate) {
      filter.date = {};
      if (query.startDate) {
        filter.date.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    if (query.search && query.search.trim()) {
      filter.description = { $regex: query.search.trim(), $options: 'i' };
    }

    const total = await Transaction.countDocuments(filter);
    const transactions = await Transaction.find(filter)
      .sort({ [sortBy]: sortOrder, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('categoryId', 'name type icon color')
      .lean();

    return {
      transactions: transactions.map((t: any) => ({
        ...t,
        category: t.categoryId,
        categoryId: t.categoryId?._id || t.categoryId,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  } else {
    // Memory store
    let filtered = memoryStore.transactions.filter((t) => t.userId === userId);

    if (query.type && query.type !== 'all') {
      filtered = filtered.filter((t) => t.type === query.type);
    }

    if (query.categoryId) {
      filtered = filtered.filter((t) => t.categoryId === query.categoryId);
    }

    if (query.paymentMethod) {
      filtered = filtered.filter((t) => t.paymentMethod === query.paymentMethod);
    }

    if (query.startDate) {
      const start = new Date(query.startDate).getTime();
      filtered = filtered.filter((t) => new Date(t.date).getTime() >= start);
    }

    if (query.endDate) {
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter((t) => new Date(t.date).getTime() <= end.getTime());
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim().toLowerCase();
      filtered = filtered.filter(
        (t) =>
          (t.description && t.description.toLowerCase().includes(term)) ||
          memoryStore.categories
            .find((c) => c._id === t.categoryId)
            ?.name.toLowerCase()
            .includes(term)
      );
    }

    filtered.sort((a, b) => {
      if (sortBy === 'amount') {
        return sortOrder === 1 ? a.amount - b.amount : b.amount - a.amount;
      }
      return sortOrder === 1
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    const total = filtered.length;
    const paginated = filtered.slice(skip, skip + limit);

    const transactions = paginated.map((t) => {
      const cat = memoryStore.categories.find((c) => c._id === t.categoryId);
      return {
        ...t,
        category: cat
          ? { _id: cat._id, name: cat.name, type: cat.type, icon: cat.icon, color: cat.color }
          : null,
      };
    });

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }
}

export async function createTransaction(
  userId: string,
  data: {
    type: 'income' | 'expense';
    amount: number;
    categoryId: string;
    date?: string | Date;
    paymentMethod?: PaymentMethod;
    description?: string;
  }
) {
  const dbStatus = getDBStatus();

  // Validate category existence
  let categoryExists = false;
  if (dbStatus.isAtlas) {
    const cat = await Category.findOne({
      _id: data.categoryId,
      $or: [{ userId }, { isDefault: true }, { userId: null }],
    });
    categoryExists = !!cat;
  } else {
    const cat = memoryStore.categories.find(
      (c) =>
        c._id === data.categoryId &&
        (c.isDefault || c.userId === userId || !c.userId)
    );
    categoryExists = !!cat;
  }

  if (!categoryExists) {
    throw new AppError('The specified category does not exist or is not accessible.', 400);
  }

  const dateObj = data.date ? new Date(data.date) : new Date();

  if (dbStatus.isAtlas) {
    const transaction = await Transaction.create({
      userId,
      type: data.type,
      amount: Number(data.amount),
      categoryId: data.categoryId,
      date: dateObj,
      paymentMethod: data.paymentMethod || 'UPI',
      description: data.description?.trim() || '',
    });
    return await Transaction.findById(transaction._id).populate('categoryId', 'name type icon color');
  } else {
    const newTx = {
      _id: generateId(),
      userId,
      type: data.type,
      amount: Number(data.amount),
      categoryId: data.categoryId,
      date: dateObj,
      paymentMethod: data.paymentMethod || 'UPI',
      description: data.description?.trim() || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.transactions.push(newTx);
    const cat = memoryStore.categories.find((c) => c._id === data.categoryId);
    return {
      ...newTx,
      category: cat
        ? { _id: cat._id, name: cat.name, type: cat.type, icon: cat.icon, color: cat.color }
        : null,
    };
  }
}

export async function getTransactionById(userId: string, transactionId: string) {
  const dbStatus = getDBStatus();

  if (dbStatus.isAtlas) {
    const tx = await Transaction.findOne({ _id: transactionId, userId }).populate(
      'categoryId',
      'name type icon color'
    );
    if (!tx) {
      throw new AppError('Transaction not found or unauthorized.', 404);
    }
    return tx;
  } else {
    const tx = memoryStore.transactions.find((t) => t._id === transactionId && t.userId === userId);
    if (!tx) {
      throw new AppError('Transaction not found or unauthorized.', 404);
    }
    const cat = memoryStore.categories.find((c) => c._id === tx.categoryId);
    return {
      ...tx,
      category: cat
        ? { _id: cat._id, name: cat.name, type: cat.type, icon: cat.icon, color: cat.color }
        : null,
    };
  }
}

export async function updateTransaction(
  userId: string,
  transactionId: string,
  data: {
    type?: 'income' | 'expense';
    amount?: number;
    categoryId?: string;
    date?: string | Date;
    paymentMethod?: PaymentMethod;
    description?: string;
  }
) {
  const dbStatus = getDBStatus();

  if (dbStatus.isAtlas) {
    const tx = await Transaction.findOne({ _id: transactionId, userId });
    if (!tx) {
      throw new AppError('Transaction not found or unauthorized.', 404);
    }

    if (data.type) tx.type = data.type;
    if (data.amount !== undefined) tx.amount = Number(data.amount);
    if (data.categoryId) tx.categoryId = data.categoryId as any;
    if (data.date) tx.date = new Date(data.date);
    if (data.paymentMethod) tx.paymentMethod = data.paymentMethod;
    if (data.description !== undefined) tx.description = data.description.trim();

    await tx.save();
    return await Transaction.findById(tx._id).populate('categoryId', 'name type icon color');
  } else {
    const index = memoryStore.transactions.findIndex(
      (t) => t._id === transactionId && t.userId === userId
    );
    if (index === -1) {
      throw new AppError('Transaction not found or unauthorized.', 404);
    }

    const tx = memoryStore.transactions[index];
    if (data.type) tx.type = data.type;
    if (data.amount !== undefined) tx.amount = Number(data.amount);
    if (data.categoryId) tx.categoryId = data.categoryId;
    if (data.date) tx.date = new Date(data.date);
    if (data.paymentMethod) tx.paymentMethod = data.paymentMethod;
    if (data.description !== undefined) tx.description = data.description.trim();
    tx.updatedAt = new Date();

    const cat = memoryStore.categories.find((c) => c._id === tx.categoryId);
    return {
      ...tx,
      category: cat
        ? { _id: cat._id, name: cat.name, type: cat.type, icon: cat.icon, color: cat.color }
        : null,
    };
  }
}

export async function deleteTransaction(userId: string, transactionId: string) {
  const dbStatus = getDBStatus();

  if (dbStatus.isAtlas) {
    const result = await Transaction.findOneAndDelete({ _id: transactionId, userId });
    if (!result) {
      throw new AppError('Transaction not found or unauthorized.', 404);
    }
    return true;
  } else {
    const index = memoryStore.transactions.findIndex(
      (t) => t._id === transactionId && t.userId === userId
    );
    if (index === -1) {
      throw new AppError('Transaction not found or unauthorized.', 404);
    }
    memoryStore.transactions.splice(index, 1);
    return true;
  }
}
