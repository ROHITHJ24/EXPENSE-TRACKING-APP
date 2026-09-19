import { useState } from 'react';
import { DashboardAnalytics, Category, Transaction } from '../../types/index.js';
import { formatCurrency } from '../../utils/formatters.js';
import { StatCard } from './StatCard.js';
import { SpendingChart } from './SpendingChart.js';
import { CategoryBreakdown } from './CategoryBreakdown.js';
import { RecentTransactions } from './RecentTransactions.js';
import { SafeToSpendCard } from './SafeToSpendCard.js';
import { SpendingInsights } from './SpendingInsights.js';
import { MonthComparison } from './MonthComparison.js';
import { GroupSummaryWidget } from './GroupSummaryWidget.js';
import { ManageRecurringModal } from './ManageRecurringModal.js';
import { StatCardSkeleton, CardSkeleton } from '../common/LoadingSkeleton.js';
import { Wallet, TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface DashboardViewProps {
  analytics: DashboardAnalytics | null;
  loading: boolean;
  categories: Category[];
  onOpenAddTransaction: (type?: 'income' | 'expense') => void;
  onNavigateToTransactions: () => void;
  onSelectTransaction: (tx: Transaction) => void;
  onNavigateToGroups?: () => void;
  onRefreshData?: () => void;
}

export function DashboardView({
  analytics,
  loading,
  categories,
  onOpenAddTransaction,
  onNavigateToTransactions,
  onSelectTransaction,
  onNavigateToGroups,
  onRefreshData,
}: DashboardViewProps) {
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);

  if (loading && !analytics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CardSkeleton />
          </div>
          <div>
            <CardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  const isPositiveBalance = (analytics?.totalBalance || 0) >= 0;

  return (
    <div className="space-y-6">
      {/* Top Welcome / Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Financial Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Real-time snapshot of your balance, safe-to-spend guideline, and shared expenses.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onOpenAddTransaction('income')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800/60 transition-colors"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Add Income</span>
          </button>
          <button
            onClick={() => onOpenAddTransaction('expense')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800/60 transition-colors"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* FEATURE 1: Prominent Safe-to-Spend Section */}
      <SafeToSpendCard
        safeToSpend={analytics?.safeToSpend}
        upcomingCommitments={analytics?.upcomingCommitmentsList}
        onOpenManageRecurring={() => setIsRecurringModalOpen(true)}
        onAddTransaction={onOpenAddTransaction}
      />

      {/* Primary KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Balance"
          amount={formatCurrency(analytics?.totalBalance || 0)}
          subtitle={
            isPositiveBalance
              ? 'Positive net balance'
              : 'Negative balance'
          }
          icon={Wallet}
          variant={isPositiveBalance ? 'neutral' : 'danger'}
        />

        <StatCard
          label="Total Income"
          amount={formatCurrency(analytics?.totalIncome || 0)}
          subtitle={`This month: ${formatCurrency(analytics?.monthlyIncome || 0)}`}
          icon={TrendingUp}
          variant="success"
        />

        <StatCard
          label="Total Expenses"
          amount={formatCurrency(analytics?.totalExpense || 0)}
          subtitle={`This month: ${formatCurrency(analytics?.monthlyExpense || 0)}`}
          icon={TrendingDown}
          variant="danger"
        />
      </div>

      {/* Grounded Spending Insights */}
      {analytics?.spendingInsights && analytics.spendingInsights.length > 0 && (
        <SpendingInsights insights={analytics.spendingInsights} />
      )}

      {/* Month-to-Month Comparison */}
      {analytics?.monthComparison && analytics.monthComparison.categories.length > 0 && (
        <MonthComparison data={analytics.monthComparison} />
      )}

      {/* Split & Group Expenses Overview Widget */}
      {onNavigateToGroups && (
        <GroupSummaryWidget onNavigateToGroups={onNavigateToGroups} />
      )}

      {/* Main Grid: Spending Trend + Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spending & Income Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                Income & Expense Trend
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Monthly comparison for the last 6 months
              </p>
            </div>
          </div>
          <SpendingChart data={analytics?.monthlyTrend || []} />
        </div>

        {/* Category Spending Breakdown */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                Spending by Category
              </h3>
              <span className="text-xs text-neutral-400 font-medium">This month</span>
            </div>
            <CategoryBreakdown categories={analytics?.categoryBreakdown || []} />
          </div>

          {analytics?.highestExpense && (
            <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800 text-xs">
              <span className="text-neutral-400 block mb-1">Highest Single Expense</span>
              <div className="flex items-center justify-between font-semibold text-neutral-800 dark:text-neutral-200">
                <span className="truncate max-w-[150px]">
                  {analytics.highestExpense.description || analytics.highestExpense.categoryName}
                </span>
                <span className="text-rose-600 dark:text-rose-400">
                  {formatCurrency(analytics.highestExpense.amount)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions Card */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-base text-neutral-900 dark:text-white">
              Recent Transactions
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Latest activity recorded in your account
            </p>
          </div>
        </div>
        <RecentTransactions
          transactions={analytics?.recentTransactions || []}
          onViewAll={onNavigateToTransactions}
          onSelectTransaction={onSelectTransaction}
        />
      </div>

      {/* Manage Recurring Commitments Modal */}
      <ManageRecurringModal
        isOpen={isRecurringModalOpen}
        onClose={() => setIsRecurringModalOpen(false)}
        categories={categories}
        onCommitmentsUpdated={() => {
          if (onRefreshData) onRefreshData();
        }}
      />
    </div>
  );
}
