import { useState, useEffect } from 'react';
import { Budget, Category } from '../../types/index.js';
import { BudgetCard } from './BudgetCard.js';
import { BudgetModal } from './BudgetModal.js';
import { EmptyState } from '../common/EmptyState.js';
import { formatCurrency, formatMonthYear, formatPercent } from '../../utils/formatters.js';
import { api } from '../../services/api.js';
import { PieChart, Plus, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';

interface BudgetsViewProps {
  categories: Category[];
}

export function BudgetsView({ categories }: BudgetsViewProps) {
  const currentDate = new Date();
  const [month, setMonth] = useState<number>(currentDate.getMonth() + 1);
  const [year, setYear] = useState<number>(currentDate.getFullYear());
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const data = await api.getBudgets(month, year);
      setBudgets(data || []);
    } catch {
      setBudgets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [month, year]);

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const handleCreateBudget = async (data: {
    categoryId: string;
    amount: number;
    month: number;
    year: number;
  }) => {
    await api.createOrUpdateBudget(data);
    await fetchBudgets();
  };

  const handleDeleteBudget = async (id: string) => {
    await api.deleteBudget(id);
    await fetchBudgets();
  };

  // Overall totals across all budgets for the selected month
  const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const overallPercentage = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;
  const isOverallExceeded = totalSpent > totalBudgeted;
  const isOverallNearLimit = overallPercentage >= 80 && !isOverallExceeded;

  return (
    <div className="space-y-6">
      {/* Top Header & Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Monthly Budgets
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Monitor and control category spending limits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Month Navigator */}
          <div className="flex items-center gap-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-2 py-1 shadow-xs">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs sm:text-sm font-semibold text-neutral-800 dark:text-neutral-200 min-w-[120px] text-center">
              {formatMonthYear(month, year)}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Add Budget Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Set Budget</span>
          </button>
        </div>
      </div>

      {/* Overall Month Summary Card */}
      {budgets.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Total Budget Utilization
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
                  {formatCurrency(totalSpent)}
                </span>
                <span className="text-sm font-medium text-neutral-400">
                  / {formatCurrency(totalBudgeted)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-neutral-700 dark:text-neutral-200">
                {formatPercent(overallPercentage)}
              </span>
              {isOverallExceeded ? (
                <span className="text-xs px-2.5 py-1 font-semibold rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                  Exceeded
                </span>
              ) : isOverallNearLimit ? (
                <span className="text-xs px-2.5 py-1 font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                  Near Limit
                </span>
              ) : (
                <span className="text-xs px-2.5 py-1 font-medium rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  On Track
                </span>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isOverallExceeded
                  ? 'bg-rose-500'
                  : isOverallNearLimit
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(3, overallPercentage))}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Category Budgets Grid */}
      {!loading && budgets.length === 0 ? (
        <EmptyState
          icon={PieChart}
          title={`No budgets set for ${formatMonthYear(month, year)}`}
          description="Setting a budget helps you prevent overspending on categories like groceries, dining, shopping, or entertainment."
          actionText="Set Category Budget"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((b) => (
            <BudgetCard key={b._id} budget={b} onDelete={handleDeleteBudget} />
          ))}
        </div>
      )}

      {/* Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categories={categories}
        onSubmit={handleCreateBudget}
        currentMonth={month}
        currentYear={year}
      />
    </div>
  );
}
