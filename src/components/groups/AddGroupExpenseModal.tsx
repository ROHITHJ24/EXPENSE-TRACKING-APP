import { useState, useEffect } from 'react';
import { GroupParticipant, Category } from '../../types/index.js';
import { api } from '../../services/api.js';
import { formatCurrency } from '../../utils/formatters.js';
import { X, Plus, AlertCircle, Check } from 'lucide-react';

interface AddGroupExpenseModalProps {
  isOpen: boolean;
  groupId: string;
  participants: GroupParticipant[];
  categories: Category[];
  onClose: () => void;
  onExpenseAdded: () => void;
}

type SplitMethod = 'equal' | 'custom' | 'percentage' | 'shares';

export function AddGroupExpenseModal({
  isOpen,
  groupId,
  participants,
  categories,
  onClose,
  onExpenseAdded,
}: AddGroupExpenseModalProps) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('equal');

  // Equal: which participants are selected
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);

  // Custom amounts per participant
  const [customAmounts, setCustomAmounts] = useState<{ [id: string]: string }>({});

  // Percentages per participant
  const [percentages, setPercentages] = useState<{ [id: string]: string }>({});

  // Shares per participant
  const [shares, setShares] = useState<{ [id: string]: string }>({});

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  useEffect(() => {
    if (isOpen && participants.length > 0) {
      if (!paidBy) setPaidBy(participants[0]._id);
      setSelectedParticipants(participants.map((p) => p._id));

      if (expenseCategories.length > 0 && !categoryId) {
        setCategoryId(expenseCategories[0]._id);
      }

      // Initialize split values
      const initCustom: { [id: string]: string } = {};
      const initPct: { [id: string]: string } = {};
      const initShares: { [id: string]: string } = {};

      const count = participants.length;
      const basePct = count > 0 ? (100 / count).toFixed(1) : '0';

      participants.forEach((p) => {
        initCustom[p._id] = '';
        initPct[p._id] = basePct;
        initShares[p._id] = '1';
      });

      setCustomAmounts(initCustom);
      setPercentages(initPct);
      setShares(initShares);
    }
  }, [isOpen, participants]);

  if (!isOpen) return null;

  const numAmount = Number(amount) || 0;

  // Compute live breakdown for display
  const getCalculatedShares = () => {
    if (splitMethod === 'equal') {
      const activeCount = selectedParticipants.length;
      if (activeCount === 0 || numAmount <= 0) return [];
      const perPerson = Math.floor((numAmount / activeCount) * 100) / 100;
      let remainder = Math.round((numAmount - perPerson * activeCount) * 100) / 100;

      return selectedParticipants.map((pId) => {
        let share = perPerson;
        if (remainder > 0) {
          share = Math.round((share + 0.01) * 100) / 100;
          remainder = Math.round((remainder - 0.01) * 100) / 100;
        }
        const p = participants.find((part) => part._id === pId);
        return {
          participantId: pId,
          name: p?.name || 'Participant',
          shareAmount: share,
        };
      });
    } else if (splitMethod === 'custom') {
      return participants.map((p) => ({
        participantId: p._id,
        name: p.name,
        shareAmount: Number(customAmounts[p._id]) || 0,
      }));
    } else if (splitMethod === 'percentage') {
      const totalPct = Object.values(percentages).reduce((sum, v) => sum + (Number(v) || 0), 0);
      return participants.map((p) => {
        const pct = Number(percentages[p._id]) || 0;
        const share = numAmount > 0 ? Math.round(numAmount * (pct / 100) * 100) / 100 : 0;
        return {
          participantId: p._id,
          name: p.name,
          shareAmount: share,
          totalPct,
        };
      });
    } else if (splitMethod === 'shares') {
      const totalShares = Object.values(shares).reduce((sum, v) => sum + (Number(v) || 0), 0);
      return participants.map((p) => {
        const s = Number(shares[p._id]) || 0;
        const share = totalShares > 0 ? Math.round(numAmount * (s / totalShares) * 100) / 100 : 0;
        return {
          participantId: p._id,
          name: p.name,
          shareAmount: share,
          totalShares,
        };
      });
    }
    return [];
  };

  const calculatedPreview = getCalculatedShares();

  // Validation before submission
  const validateForm = () => {
    if (!title.trim()) return 'Please enter a description for this expense (e.g. Dinner, Taxi, Groceries).';
    if (numAmount <= 0) return 'Please enter an expense amount greater than zero.';
    if (!paidBy) return 'Please select the person who paid for this expense.';

    if (splitMethod === 'equal' && selectedParticipants.length === 0) {
      return 'Please choose at least one person to share this expense with.';
    }

    if (splitMethod === 'custom') {
      const sumCustom = Object.values(customAmounts).reduce((sum, v) => sum + (Number(v) || 0), 0);
      if (Math.abs(sumCustom - numAmount) > 0.05) {
        return `The sum of individual shares (₹${sumCustom.toFixed(2)}) should match the total bill amount (₹${numAmount.toFixed(2)}).`;
      }
    }

    if (splitMethod === 'percentage') {
      const sumPct = Object.values(percentages).reduce((sum, v) => sum + (Number(v) || 0), 0);
      if (Math.abs(sumPct - 100) > 0.05) {
        return `The split percentages need to add up to exactly 100% (currently ${sumPct.toFixed(1)}%).`;
      }
    }

    if (splitMethod === 'shares') {
      const sumShares = Object.values(shares).reduce((sum, v) => sum + (Number(v) || 0), 0);
      if (sumShares <= 0) {
        return 'Please assign at least one share to the participating members.';
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valError = validateForm();
    if (valError) {
      setError(valError);
      return;
    }

    setSubmitting(true);
    setError(null);

    // Build splits payload based on splitMethod
    let splitsPayload: any[] = [];
    if (splitMethod === 'equal') {
      splitsPayload = selectedParticipants.map((pId) => ({
        participantId: pId,
        rawValue: 1,
      }));
    } else if (splitMethod === 'custom') {
      splitsPayload = participants.map((p) => ({
        participantId: p._id,
        shareAmount: Number(customAmounts[p._id]) || 0,
      }));
    } else if (splitMethod === 'percentage') {
      splitsPayload = participants.map((p) => ({
        participantId: p._id,
        rawValue: Number(percentages[p._id]) || 0,
      }));
    } else if (splitMethod === 'shares') {
      splitsPayload = participants.map((p) => ({
        participantId: p._id,
        rawValue: Number(shares[p._id]) || 0,
      }));
    }

    try {
      await api.addGroupExpense(groupId, {
        title: title.trim(),
        amount: numAmount,
        date,
        categoryId: categoryId || undefined,
        paidBy,
        splitMethod,
        splits: splitsPayload,
      });

      onExpenseAdded();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Unable to record this shared expense right now. Please check your entries and try again.');
    } finally {
      setSubmitting(false);
    }
  };

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
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                Add Group Expense
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Split by Equal, Custom, Percentage, or Shares
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 max-h-[78vh] overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                Expense Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Resort Booking, Dinner at Nilgiris, Gas / Fuel"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                Total Amount (₹) *
              </label>
              <input
                type="number"
                placeholder="0.00"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                Paid By *
              </label>
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {participants.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">General</option>
                {expenseCategories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Split Method Tabs */}
          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5">
              Split Method
            </label>
            <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs">
              {(['equal', 'custom', 'percentage', 'shares'] as SplitMethod[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSplitMethod(m)}
                  className={`py-1.5 px-2 rounded-lg capitalize font-medium transition-all text-center ${
                    splitMethod === m
                      ? 'bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Split Inputs */}
          <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              <span>Participants Breakdown</span>
              {splitMethod === 'custom' && (
                <span className="text-[11px] text-neutral-400">
                  Sum:{' '}
                  {formatCurrency(
                    Object.values(customAmounts).reduce((sum, v) => sum + (Number(v) || 0), 0)
                  )}{' '}
                  / {formatCurrency(numAmount)}
                </span>
              )}
              {splitMethod === 'percentage' && (
                <span className="text-[11px] text-neutral-400">
                  Total:{' '}
                  {Object.values(percentages)
                    .reduce((sum, v) => sum + (Number(v) || 0), 0)
                    .toFixed(1)}
                  % / 100%
                </span>
              )}
            </div>

            {/* Equal Split Selection */}
            {splitMethod === 'equal' && (
              <div className="space-y-1.5">
                {participants.map((p) => {
                  const isChecked = selectedParticipants.includes(p._id);
                  return (
                    <label
                      key={p._id}
                      className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedParticipants([...selectedParticipants, p._id]);
                            } else {
                              setSelectedParticipants(selectedParticipants.filter((id) => id !== p._id));
                            }
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-medium text-neutral-800 dark:text-neutral-200">
                          {p.name}
                        </span>
                      </div>
                      <span className="text-neutral-500 font-semibold">
                        {isChecked && numAmount > 0
                          ? formatCurrency(
                              calculatedPreview.find((s) => s.participantId === p._id)?.shareAmount || 0
                            )
                          : 'Excluded'}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            {/* Custom Amounts */}
            {splitMethod === 'custom' && (
              <div className="space-y-2">
                {participants.map((p) => (
                  <div
                    key={p._id}
                    className="flex items-center justify-between gap-3 p-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs"
                  >
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">
                      {p.name}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-neutral-400">₹</span>
                      <input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        value={customAmounts[p._id] || ''}
                        onChange={(e) =>
                          setCustomAmounts({
                            ...customAmounts,
                            [p._id]: e.target.value,
                          })
                        }
                        className="w-24 px-2 py-1 text-right text-xs rounded border border-neutral-200 dark:border-neutral-700 bg-transparent text-neutral-900 dark:text-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Percentage */}
            {splitMethod === 'percentage' && (
              <div className="space-y-2">
                {participants.map((p) => {
                  const shareCalc = calculatedPreview.find((s) => s.participantId === p._id);
                  return (
                    <div
                      key={p._id}
                      className="flex items-center justify-between gap-3 p-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs"
                    >
                      <div>
                        <span className="font-medium text-neutral-800 dark:text-neutral-200 block">
                          {p.name}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          ≈ {formatCurrency(shareCalc?.shareAmount || 0)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="any"
                          placeholder="0"
                          value={percentages[p._id] || ''}
                          onChange={(e) =>
                            setPercentages({
                              ...percentages,
                              [p._id]: e.target.value,
                            })
                          }
                          className="w-16 px-2 py-1 text-right text-xs rounded border border-neutral-200 dark:border-neutral-700 bg-transparent text-neutral-900 dark:text-white"
                        />
                        <span className="text-neutral-400">%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Shares */}
            {splitMethod === 'shares' && (
              <div className="space-y-2">
                {participants.map((p) => {
                  const shareCalc = calculatedPreview.find((s) => s.participantId === p._id);
                  return (
                    <div
                      key={p._id}
                      className="flex items-center justify-between gap-3 p-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs"
                    >
                      <div>
                        <span className="font-medium text-neutral-800 dark:text-neutral-200 block">
                          {p.name}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          ≈ {formatCurrency(shareCalc?.shareAmount || 0)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          placeholder="1"
                          value={shares[p._id] || ''}
                          onChange={(e) =>
                            setShares({
                              ...shares,
                              [p._id]: e.target.value,
                            })
                          }
                          className="w-16 px-2 py-1 text-right text-xs rounded border border-neutral-200 dark:border-neutral-700 bg-transparent text-neutral-900 dark:text-white"
                        />
                        <span className="text-neutral-400">shares</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span>{submitting ? 'Saving...' : 'Add Expense'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
