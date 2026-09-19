import { useState, useEffect } from 'react';
import { RecurringExpense, Category } from '../../types/index.js';
import { api } from '../../services/api.js';
import { formatCurrency } from '../../utils/formatters.js';
import { X, Plus, Trash2, Calendar, ShieldCheck, AlertCircle } from 'lucide-react';

interface ManageRecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onCommitmentsUpdated: () => void;
}

export function ManageRecurringModal({
  isOpen,
  onClose,
  categories,
  onCommitmentsUpdated,
}: ManageRecurringModalProps) {
  const [items, setItems] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New recurring item form state
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [dueDay, setDueDay] = useState(1);
  const [frequency, setFrequency] = useState<'monthly' | 'weekly' | 'yearly'>('monthly');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  useEffect(() => {
    if (isOpen) {
      loadRecurring();
      if (expenseCategories.length > 0 && !categoryId) {
        setCategoryId(expenseCategories[0]._id);
      }
    }
  }, [isOpen]);

  const loadRecurring = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getRecurringExpenses();
      setItems(data || []);
    } catch (err: any) {
      setError(err.message || 'Unable to load your recurring commitments right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setError('Please enter a title for this recurring expense (e.g. Rent, Electricity).');
    const num = Number(amount);
    if (isNaN(num) || num <= 0) return setError('Please enter an amount greater than zero.');
    if (!categoryId) return setError('Please select a category for this commitment.');

    setIsSubmitting(true);
    setError(null);
    try {
      await api.createRecurringExpense({
        title: title.trim(),
        amount: num,
        categoryId,
        frequency,
        dueDay: Number(dueDay),
        notes: notes.trim(),
      });
      setTitle('');
      setAmount('');
      setNotes('');
      await loadRecurring();
      onCommitmentsUpdated();
    } catch (err: any) {
      setError(err.message || 'Unable to save this recurring commitment. Please check your entries and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteRecurringExpense(id);
      setItems((prev) => prev.filter((item) => item._id !== id));
      onCommitmentsUpdated();
    } catch (err: any) {
      setError(err.message || 'Unable to remove this recurring commitment right now. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                Recurring Commitments
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Powers your Safe-to-Spend calculations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[75vh] overflow-y-auto space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Add Form */}
          <form onSubmit={handleAdd} className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 space-y-3">
            <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block">
              + Add Commitment (e.g. Rent, Netflix, EMI, Wifi)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 block mb-1">
                  Bill / Commitment Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Apartment Rent"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 block mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 block mb-1">
                  Due Day of Month
                </label>
                <select
                  value={dueDay}
                  onChange={(e) => setDueDay(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <option key={day} value={day}>
                      {day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of month
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 block mb-1">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {expenseCategories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save Recurring Commitment</span>
            </button>
          </form>

          {/* List of active commitments */}
          <div>
            <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-2">
              Active Commitments ({items.length})
            </span>

            {loading ? (
              <div className="py-6 text-center text-xs text-neutral-400">Loading commitments...</div>
            ) : items.length === 0 ? (
              <div className="py-6 text-center text-xs text-neutral-400 bg-neutral-50 dark:bg-neutral-800/30 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800">
                No recurring commitments yet. Add your monthly bills above.
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center justify-between p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-neutral-900 dark:text-white block">
                        {item.title}
                      </span>
                      <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        Due on day {item.dueDay} of every month
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm text-neutral-900 dark:text-white">
                        {formatCurrency(item.amount)}
                      </span>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="p-1 rounded text-neutral-400 hover:text-red-500 transition-colors"
                        title="Delete commitment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
