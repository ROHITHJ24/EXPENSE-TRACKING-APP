import { ArrowDownLeft, ArrowUpRight, AlertTriangle, AlertCircle } from 'lucide-react';

interface TypeBadgeProps {
  type: 'income' | 'expense';
  size?: 'sm' | 'md';
}

export function TypeBadge({ type, size = 'md' }: TypeBadgeProps) {
  const isIncome = type === 'income';

  if (isIncome) {
    return (
      <span
        className={`inline-flex items-center gap-1 font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60 ${
          size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
        }`}
      >
        <ArrowDownLeft className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
        <span>Income</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60 ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      }`}
    >
      <ArrowUpRight className="w-3 h-3 text-rose-600 dark:text-rose-400" />
      <span>Expense</span>
    </span>
  );
}

interface BudgetBadgeProps {
  percentage: number;
  isExceeded: boolean;
  isNearLimit: boolean;
}

export function BudgetStatusBadge({ isExceeded, isNearLimit, percentage }: BudgetBadgeProps) {
  if (isExceeded) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300">
        <AlertCircle className="w-3 h-3" />
        <span>Exceeded ({percentage}%)</span>
      </span>
    );
  }

  if (isNearLimit) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
        <AlertTriangle className="w-3 h-3" />
        <span>Near Limit ({percentage}%)</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
      <span>On Track ({percentage}%)</span>
    </span>
  );
}
