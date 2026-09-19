export const PAYMENT_METHODS = [
  'Cash',
  'UPI',
  'Debit Card',
  'Credit Card',
  'Bank Transfer',
  'Other',
] as const;

export type PaymentMethod = typeof PAYMENT_METHODS[number];

export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Food', type: 'expense', icon: 'Utensils', color: 'orange' },
  { name: 'Transport', type: 'expense', icon: 'Car', color: 'blue' },
  { name: 'Shopping', type: 'expense', icon: 'ShoppingBag', color: 'purple' },
  { name: 'Bills', type: 'expense', icon: 'Receipt', color: 'red' },
  { name: 'Entertainment', type: 'expense', icon: 'Film', color: 'pink' },
  { name: 'Health', type: 'expense', icon: 'HeartPulse', color: 'emerald' },
  { name: 'Education', type: 'expense', icon: 'GraduationCap', color: 'indigo' },
  { name: 'Other', type: 'expense', icon: 'HelpCircle', color: 'slate' },
];

export const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salary', type: 'income', icon: 'Briefcase', color: 'emerald' },
  { name: 'Freelance', type: 'income', icon: 'Laptop', color: 'cyan' },
  { name: 'Business', type: 'income', icon: 'TrendingUp', color: 'blue' },
  { name: 'Investment', type: 'income', icon: 'PiggyBank', color: 'violet' },
  { name: 'Gift', type: 'income', icon: 'Gift', color: 'rose' },
  { name: 'Other', type: 'income', icon: 'MoreHorizontal', color: 'slate' },
];
