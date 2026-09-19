import { Budget } from '../../types/index.js';
import { formatCurrency, formatPercent } from '../../utils/formatters.js';
import { BudgetStatusBadge } from '../common/Badge.js';
import { Trash2 } from 'lucide-react';

interface BudgetCardProps {
  budget: Budget;
  onDelete: (id: string) => void;
}

export function BudgetCard({ budget, onDelete }: BudgetCardProps) {
  // Determine progress bar fill and status styling
  let progressColor = 'bg-blue-600 dark:bg-blue-500';
  if (budget.isExceeded) {
    progressColor = 'bg-rose-500';
  } else if (budget.isNearLimit) {
    progressColor = 'bg-amber-500';
  }

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs space-y-3.5 transition-all hover:border-neutral-300 dark:hover:border-neutral-700">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-bold text-base text-neutral-900 dark:text-white">
            {budget.category?.name || 'Category'}
          </h4>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            Monthly Budget
          </span>
        </div>
        <div className="flex items-center gap-2">
          <BudgetStatusBadge
            percentage={budget.percentage}
            isExceeded={budget.isExceeded}
            isNearLimit={budget.isNearLimit}
          />
          <button
            onClick={() => {
              if (window.confirm(`Remove budget for ${budget.category?.name || 'this category'}?`)) {
                onDelete(budget._id);
              }
            }}
            title="Delete budget"
            className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Spending vs Limit numbers */}
      <div className="flex items-baseline justify-between">
        <div>
          <span className="text-xl font-bold text-neutral-900 dark:text-white">
            {formatCurrency(budget.spent)}
          </span>
          <span className="text-sm font-medium text-neutral-400 dark:text-neutral-500 ml-1.5">
            / {formatCurrency(budget.amount)}
          </span>
        </div>
        <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
          {formatPercent(budget.percentage)}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
          style={{ width: `${Math.min(100, Math.max(3, budget.percentage))}%` }}
        ></div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 pt-1">
        <span>
          {budget.isExceeded ? (
            <span className="text-rose-600 dark:text-rose-400 font-semibold">
              Exceeded by {formatCurrency(budget.spent - budget.amount)}
            </span>
          ) : (
            <span>
              {formatCurrency(budget.remaining)} remaining
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
