import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '../utils/constants.js';

export interface InMemoryUser {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InMemoryCategory {
  _id: string;
  userId?: string | null;
  name: string;
  type: 'income' | 'expense';
  isDefault: boolean;
  icon?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InMemoryTransaction {
  _id: string;
  userId: string;
  type: 'income' | 'expense';
  amount: number;
  categoryId: string;
  date: Date;
  paymentMethod: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InMemoryBudget {
  _id: string;
  userId: string;
  categoryId: string;
  amount: number;
  period: 'monthly';
  month: number;
  year: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InMemoryRecurringExpense {
  _id: string;
  userId: string;
  title: string;
  amount: number;
  categoryId: string;
  frequency: 'monthly' | 'weekly' | 'yearly';
  dueDay: number;
  startDate: Date;
  active: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InMemoryParticipant {
  _id: string;
  name: string;
  email?: string;
  linkedUserId?: string | null;
}

export interface InMemoryGroup {
  _id: string;
  name: string;
  description?: string;
  createdBy: string;
  participants: InMemoryParticipant[];
  createdAt: Date;
  updatedAt: Date;
}

export interface InMemoryExpenseSplit {
  participantId: string;
  shareAmount: number;
  rawValue?: number;
}

export interface InMemoryGroupExpense {
  _id: string;
  groupId: string;
  title: string;
  amount: number;
  date: Date;
  categoryId?: string | null;
  paidBy: string;
  splitMethod: 'equal' | 'custom' | 'percentage' | 'shares';
  splits: InMemoryExpenseSplit[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InMemorySettlement {
  _id: string;
  groupId: string;
  fromParticipantId: string;
  toParticipantId: string;
  amount: number;
  status: 'pending' | 'settled';
  notes?: string;
  settledAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Generate simple mock ObjectId strings
let idCounter = 1000;
export function generateId(): string {
  idCounter++;
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const counterHex = idCounter.toString(16).padStart(16, '0');
  return `${timestamp}${counterHex}`.slice(0, 24);
}

// Initialize in-memory collections
export const memoryStore = {
  users: [] as InMemoryUser[],
  categories: [] as InMemoryCategory[],
  transactions: [] as InMemoryTransaction[],
  budgets: [] as InMemoryBudget[],
  recurringExpenses: [] as InMemoryRecurringExpense[],
  groups: [] as InMemoryGroup[],
  groupExpenses: [] as InMemoryGroupExpense[],
  settlements: [] as InMemorySettlement[],
};

// Seed default categories in memory store
export function initMemoryStore() {
  if (memoryStore.categories.length === 0) {
    const defaultExpense = DEFAULT_EXPENSE_CATEGORIES.map((c) => ({
      _id: generateId(),
      userId: null,
      name: c.name,
      type: c.type as 'income' | 'expense',
      isDefault: true,
      icon: c.icon,
      color: c.color,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const defaultIncome = DEFAULT_INCOME_CATEGORIES.map((c) => ({
      _id: generateId(),
      userId: null,
      name: c.name,
      type: c.type as 'income' | 'expense',
      isDefault: true,
      icon: c.icon,
      color: c.color,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    memoryStore.categories = [...defaultExpense, ...defaultIncome];
  }
}

initMemoryStore();
