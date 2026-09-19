import { Transaction } from '../../types/index.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { ArrowUpRight, ArrowDownLeft, ArrowRight } from 'lucide-react';

interface RecentTransactionsProps {
  transactions: Transaction[];
  onViewAll: () => void;
  onSelectTransaction?: (tx: Transaction) => void;
}

export function RecentTransactions({
  transactions,
  onViewAll,
  onSelectTransaction,
}: RecentTransactionsProps) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          No transactions recorded yet.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
        {transactions.map((tx) => {
          const isIncome = tx.type === 'income';

          return (
            <div
              key={tx._id}
              onClick={() => onSelectTransaction && onSelectTransaction(tx)}
              className="py-3 px-1 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/40 rounded-xl transition-colors cursor-pointer group"
            >
              {/* Left Info */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    isIncome
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                      : 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
                  }`}
                >
                  {isIncome ? (
                    <ArrowDownLeft className="w-4 h-4" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                      {tx.category?.name || 'General'}
                    </span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 font-medium">
                      {tx.paymentMethod}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    <span>{formatDate(tx.date)}</span>
                    {tx.description && (
                      <>
                        <span>•</span>
                        <span className="truncate max-w-[150px]">{tx.description}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Amount */}
              <div className="text-right">
                <span
                  className={`font-semibold text-sm ${
                    isIncome
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-neutral-900 dark:text-white'
                  }`}
                >
                  {isIncome ? '+' : '-'} {formatCurrency(tx.amount)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
        <button
          onClick={onViewAll}
          className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 py-1 transition-colors"
        >
          <span>View all transactions</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
