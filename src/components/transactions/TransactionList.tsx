import { Transaction, PaginationMeta } from '../../types/index.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { TypeBadge } from '../common/Badge.js';
import { EmptyState } from '../common/EmptyState.js';
import { ArrowLeftRight, ChevronLeft, ChevronRight, Edit2, Trash2 } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  pagination: PaginationMeta;
  loading: boolean;
  onPageChange: (page: number) => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
}

export function TransactionList({
  transactions,
  pagination,
  loading,
  onPageChange,
  onEdit,
  onDelete,
  onAddNew,
}: TransactionListProps) {
  if (!loading && transactions.length === 0) {
    return (
      <EmptyState
        icon={ArrowLeftRight}
        title="No transactions yet"
        description="Add your first transaction to start tracking your income and expenses effortlessly."
        actionText="Add Transaction"
        onAction={onAddNew}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Container Card */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/40 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                <th className="py-3.5 px-6">Transaction</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Payment Method</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/70 text-sm">
              {transactions.map((tx) => {
                const isIncome = tx.type === 'income';

                return (
                  <tr
                    key={tx._id}
                    className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 transition-colors group"
                  >
                    {/* Category & Note */}
                    <td className="py-3.5 px-6">
                      <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {tx.category?.name || 'General'}
                      </div>
                      {tx.description && (
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-xs mt-0.5">
                          {tx.description}
                        </div>
                      )}
                    </td>

                    {/* Type Badge */}
                    <td className="py-3.5 px-4">
                      <TypeBadge type={tx.type} size="sm" />
                    </td>

                    {/* Payment Method */}
                    <td className="py-3.5 px-4 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                      <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800">
                        {tx.paymentMethod}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-xs text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                      {formatDate(tx.date)}
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 text-right">
                      <span
                        className={`font-semibold text-sm ${
                          isIncome
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-neutral-900 dark:text-white'
                        }`}
                      >
                        {isIncome ? '+' : '-'} {formatCurrency(tx.amount)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEdit(tx)}
                          title="Edit transaction"
                          className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Delete this transaction?')) {
                              onDelete(tx._id);
                            }
                          }}
                          title="Delete transaction"
                          className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List View */}
        <div className="md:hidden divide-y divide-neutral-100 dark:divide-neutral-800">
          {transactions.map((tx) => {
            const isIncome = tx.type === 'income';

            return (
              <div key={tx._id} className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                      {tx.category?.name || 'General'}
                    </span>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {formatDate(tx.date)} • {tx.paymentMethod}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-bold text-sm ${
                        isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-neutral-900 dark:text-white'
                      }`}
                    >
                      {isIncome ? '+' : '-'} {formatCurrency(tx.amount)}
                    </div>
                    <div className="mt-1 flex justify-end">
                      <TypeBadge type={tx.type} size="sm" />
                    </div>
                  </div>
                </div>

                {tx.description && (
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/50 p-2 rounded-lg">
                    {tx.description}
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => onEdit(tx)}
                    className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 px-2 py-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Delete this transaction?')) {
                        onDelete(tx._id);
                      }
                    }}
                    className="flex items-center gap-1 text-xs font-medium text-rose-600 dark:text-rose-400 px-2 py-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Server-Side Pagination Footer */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-6 py-3.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span>
              Showing {transactions.length} of {pagination.total} transactions
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 disabled:opacity-40 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 disabled:opacity-40 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
