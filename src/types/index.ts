export interface User {
  _id: string;
  name: string;
  email: string;
  createdAt?: string;
}

export interface Category {
  _id: string;
  userId?: string | null;
  name: string;
  type: 'income' | 'expense';
  isDefault: boolean;
  icon?: string;
  color?: string;
}

export type PaymentMethod =
  | 'Cash'
  | 'UPI'
  | 'Debit Card'
  | 'Credit Card'
  | 'Bank Transfer'
  | 'Other';

export interface Transaction {
  _id: string;
  userId: string;
  type: 'income' | 'expense';
  amount: number;
  categoryId: string;
  category?: Category | null;
  date: string;
  paymentMethod: PaymentMethod;
  description?: string;
  createdAt?: string;
}

export interface Budget {
  _id: string;
  categoryId: string;
  category?: Category | null;
  amount: number;
  spent: number;
  remaining: number;
  percentage: number;
  isNearLimit: boolean;
  isExceeded: boolean;
  month: number;
  year: number;
  period: 'monthly';
}

export interface SafeToSpendInfo {
  amount: number;
  daysRemaining: number;
  dailyGuideline: number;
  upcomingCommitments: number;
  totalBudget: number;
  totalBudgetRemaining: number;
  hasSufficientData: boolean;
  notice?: string | null;
  disclaimer: string;
}

export interface MonthComparisonCategory {
  name: string;
  current: number;
  previous: number;
  diff: number;
  absDiff: number;
  percentChange: number;
  direction: 'up' | 'down' | 'same';
}

export interface MonthComparison {
  categories: MonthComparisonCategory[];
  summary: string;
}

export interface RecurringExpense {
  _id: string;
  title: string;
  amount: number;
  categoryId: Category | string;
  frequency: 'monthly' | 'weekly' | 'yearly';
  dueDay: number;
  active: boolean;
  notes?: string;
  startDate?: string;
}

export interface CommitmentItem {
  _id: string;
  title: string;
  amount: number;
  dueDay: number;
  dueDate: string;
  category?: Category | null;
}

export interface DashboardSummary {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyBalance: number;
  categoryBreakdown: {
    categoryId: string;
    name: string;
    icon: string;
    color: string;
    amount: number;
    percentage: number;
  }[];
  recentTransactions: Transaction[];
}

export interface DashboardAnalytics extends DashboardSummary {
  safeToSpend?: SafeToSpendInfo;
  monthlyTrend: {
    label: string;
    year: number;
    month: number;
    income: number;
    expense: number;
  }[];
  highestExpense: {
    amount: number;
    description: string;
    date: string;
    categoryName: string;
  } | null;
  averageExpense: number;
  totalTransactionsCount: number;
  monthComparison?: MonthComparison;
  spendingInsights?: string[];
  upcomingCommitmentsList?: CommitmentItem[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Split / Group Expenses Types
export interface GroupParticipant {
  _id: string;
  name: string;
  email?: string;
  linkedUserId?: string | null;
}

export interface ExpenseSplit {
  participantId: string;
  participantName?: string;
  shareAmount: number;
  rawValue?: number;
}

export interface GroupExpense {
  _id: string;
  groupId: string;
  title: string;
  amount: number;
  date: string;
  categoryId?: string | Category | null;
  paidBy: string;
  payerName?: string;
  splitMethod: 'equal' | 'custom' | 'percentage' | 'shares';
  splits: ExpenseSplit[];
  createdAt: string;
}

export interface Settlement {
  _id: string;
  groupId: string;
  fromParticipantId: string;
  fromName?: string;
  toParticipantId: string;
  toName?: string;
  amount: number;
  status: 'pending' | 'settled';
  notes?: string;
  settledAt?: string;
  createdAt: string;
}

export interface SuggestedSettlement {
  fromParticipantId: string;
  fromName: string;
  toParticipantId: string;
  toName: string;
  amount: number;
}

export interface ParticipantBalance {
  participantId: string;
  name: string;
  paidAmount: number;
  owedAmount: number;
  settlementsPaid: number;
  settlementsReceived: number;
  netBalance: number; // positive = should receive, negative = owes
}

export interface GroupListItem {
  _id: string;
  name: string;
  description?: string;
  participantsCount: number;
  totalSpent: number;
  expensesCount: number;
  userNetBalance: number;
  userPaid: number;
  userOwed: number;
  pendingSettlementsCount: number;
  createdAt: string;
}

export interface GroupDetails {
  group: {
    _id: string;
    name: string;
    description?: string;
    createdBy: string;
    participants: GroupParticipant[];
    createdAt: string;
  };
  balances: ParticipantBalance[];
  suggestedSettlements: SuggestedSettlement[];
  expenses: GroupExpense[];
  settlements: Settlement[];
  summary: {
    totalSpent: number;
    expensesCount: number;
    pendingSettlementsCount: number;
  };
}
