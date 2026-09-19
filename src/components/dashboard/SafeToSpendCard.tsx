import { useState } from 'react';
import { SafeToSpendInfo, CommitmentItem } from '../../types/index.js';
import { formatCurrency } from '../../utils/formatters.js';
import { ShieldCheck, Calendar, AlertCircle, ChevronDown, ChevronUp, BellRing, Sparkles, PlusCircle } from 'lucide-react';

interface SafeToSpendCardProps {
  safeToSpend?: SafeToSpendInfo;
  upcomingCommitments?: CommitmentItem[];
  onOpenManageRecurring: () => void;
  onAddTransaction: (type: 'income' | 'expense') => void;
}

export function SafeToSpendCard({
  safeToSpend,
  upcomingCommitments = [],
  onOpenManageRecurring,
  onAddTransaction,
}: SafeToSpendCardProps) {
  const [isCommitmentsExpanded, setIsCommitmentsExpanded] = useState(false);

  if (!safeToSpend) return null;

  const {
    amount,
    daysRemaining,
    dailyGuideline,
    upcomingCommitments: totalCommitments,
    totalBudget,
    totalBudgetRemaining,
    hasSufficientData,
    notice,
    disclaimer,
  } = safeToSpend;

  // Case 1: Insufficient data (first-time or clean slate)
  if (!hasSufficientData) {
    return (
      <div
        id="safe-to-spend-empty-card"
        className="bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-white dark:from-neutral-900 dark:via-blue-950/20 dark:to-neutral-900 border border-blue-100 dark:border-neutral-800 rounded-2xl p-6 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Financial Insight
              </span>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white mt-0.5">
                Safe to Spend
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 max-w-xl">
                {notice || 'Add your income and upcoming recurring commitments to calculate your Safe-to-Spend amount.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => onAddTransaction('income')}
              className="px-3.5 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              Add Income
            </button>
            <button
              onClick={onOpenManageRecurring}
              className="px-3.5 py-2 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
            >
              Add Commitments
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Case 2: Negative or Zero Balance
  const isNegativeOrZero = amount <= 0;

  return (
    <div
      id="safe-to-spend-card"
      className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden transition-all"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Main Safe to Spend KPI */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold tracking-wider uppercase text-neutral-500 dark:text-neutral-400">
                Safe to Spend
              </span>
            </div>
          </div>

          <div className="flex items-baseline gap-3 flex-wrap">
            <span
              id="safe-to-spend-amount"
              className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
                isNegativeOrZero
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-neutral-900 dark:text-white'
              }`}
            >
              {formatCurrency(amount)}
            </span>
            <span className="text-xs sm:text-sm font-medium text-neutral-500 dark:text-neutral-400">
              for the next {daysRemaining} days of this month
            </span>
          </div>

          {notice && (
            <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5 pt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{notice}</span>
            </p>
          )}
        </div>

        {/* Breakdown Badges / Guidelines */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 lg:w-auto">
          {/* Daily Guideline */}
          <div className="bg-neutral-50 dark:bg-neutral-800/60 rounded-xl p-3 border border-neutral-100 dark:border-neutral-800">
            <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 block mb-0.5">
              Daily Guideline
            </span>
            <span className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
              {formatCurrency(dailyGuideline)}
              <span className="text-xs font-normal text-neutral-400">/day</span>
            </span>
          </div>

          {/* Upcoming Commitments */}
          <div className="bg-neutral-50 dark:bg-neutral-800/60 rounded-xl p-3 border border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                Upcoming Commitments
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                {formatCurrency(totalCommitments)}
              </span>
              {upcomingCommitments.length > 0 && (
                <button
                  onClick={() => setIsCommitmentsExpanded(!isCommitmentsExpanded)}
                  className="text-blue-600 dark:text-blue-400 hover:underline text-xs flex items-center gap-0.5 ml-1"
                  title="View commitments"
                >
                  {isCommitmentsExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Monthly Budget remaining (if set) or Manage Commitments action */}
          <div className="col-span-2 sm:col-span-1 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl p-3 border border-neutral-100 dark:border-neutral-800 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 block mb-0.5">
                {totalBudget > 0 ? 'Budget Remaining' : 'Recurring Bills'}
              </span>
              <span className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                {totalBudget > 0 ? formatCurrency(totalBudgetRemaining) : `${upcomingCommitments.length} Active`}
              </span>
            </div>
            <button
              onClick={onOpenManageRecurring}
              className="mt-1 text-left text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              + Manage Commitments
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Upcoming Commitments details */}
      {isCommitmentsExpanded && upcomingCommitments.length > 0 && (
        <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
              <BellRing className="w-3.5 h-3.5 text-blue-500" />
              Commitments due before end of month
            </span>
            <button
              onClick={onOpenManageRecurring}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Edit Recurring
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {upcomingCommitments.map((item) => (
              <div
                key={item._id}
                className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 text-xs"
              >
                <div className="truncate mr-2">
                  <span className="font-medium text-neutral-800 dark:text-neutral-200 block truncate">
                    {item.title}
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    Due on {new Date(item.dueDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <span className="font-semibold text-neutral-900 dark:text-white shrink-0">
                  {formatCurrency(item.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Non-advice disclaimer */}
      <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/70 flex items-center justify-between text-[11px] text-neutral-400 dark:text-neutral-500">
        <span>{disclaimer}</span>
        <button
          onClick={onOpenManageRecurring}
          className="text-blue-600 dark:text-blue-400 hover:underline hidden sm:inline"
        >
          Adjust recurring commitments
        </button>
      </div>
    </div>
  );
}
