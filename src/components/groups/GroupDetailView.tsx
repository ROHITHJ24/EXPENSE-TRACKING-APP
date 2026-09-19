import { useState, useEffect } from 'react';
import { GroupDetails, Category, SuggestedSettlement } from '../../types/index.js';
import { api } from '../../services/api.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { AddGroupExpenseModal } from './AddGroupExpenseModal.js';
import { RecordSettlementModal } from './RecordSettlementModal.js';
import { AddParticipantModal } from './AddParticipantModal.js';
import { CardSkeleton } from '../common/LoadingSkeleton.js';
import {
  ArrowLeft,
  Users,
  Plus,
  Receipt,
  CheckCircle2,
  Trash2,
  UserPlus,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Clock,
} from 'lucide-react';

interface GroupDetailViewProps {
  groupId: string;
  categories: Category[];
  currentUserId?: string;
  onBack: () => void;
  onRefreshParent: () => void;
}

export function GroupDetailView({
  groupId,
  categories,
  currentUserId,
  onBack,
  onRefreshParent,
}: GroupDetailViewProps) {
  const [details, setDetails] = useState<GroupDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<'expenses' | 'balances' | 'settlements'>('expenses');

  // Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [prefilledSettlement, setPrefilledSettlement] = useState<SuggestedSettlement | null>(null);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

  const fetchDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getGroupDetails(groupId);
      setDetails(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load group details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [groupId]);

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this shared expense?')) return;
    try {
      await api.deleteGroupExpense(groupId, expenseId);
      await fetchDetails();
      onRefreshParent();
    } catch (err: any) {
      alert(err.message || 'Failed to delete expense');
    }
  };

  const handleToggleSettlementStatus = async (
    settlementId: string,
    currentStatus: 'pending' | 'settled'
  ) => {
    const nextStatus = currentStatus === 'pending' ? 'settled' : 'pending';
    try {
      await api.updateSettlementStatus(groupId, settlementId, nextStatus);
      await fetchDetails();
      onRefreshParent();
    } catch (err: any) {
      alert(err.message || 'Failed to update settlement status');
    }
  };

  const handleOpenPrefilledSettlement = (settlement: SuggestedSettlement) => {
    setPrefilledSettlement(settlement);
    setIsSettlementModalOpen(true);
  };

  if (loading && !details) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="h-6 w-48 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
        </div>
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-red-500 text-sm">{error || 'Group not found'}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
        >
          Return to Groups
        </button>
      </div>
    );
  }

  const { group, balances, suggestedSettlements, expenses, settlements, summary } = details;

  // Find user's own balance
  const userBalance = balances.find((b) => {
    const participant = group.participants.find((p) => p._id === b.participantId);
    return participant?.linkedUserId && currentUserId && participant.linkedUserId === currentUserId;
  }) || balances[0]; // fallback to first (organizer)

  const isUserOwed = (userBalance?.netBalance || 0) > 0;
  const doesUserOwe = (userBalance?.netBalance || 0) < 0;

  return (
    <div className="space-y-6">
      {/* Top Bar with Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition-colors shrink-0"
            title="Back to all groups"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                {group.name}
              </h2>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40">
                {group.participants.length} members
              </span>
            </div>
            {group.description && (
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                {group.description}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsAddMemberModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Member</span>
          </button>

          <button
            onClick={() => {
              setPrefilledSettlement(null);
              setIsSettlementModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Settle Up</span>
          </button>

          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Participants Pill Strip */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs font-semibold text-neutral-400 mr-1">Members:</span>
        {group.participants.map((p) => (
          <span
            key={p._id}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-700/60"
          >
            {p.name}
          </span>
        ))}
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 block mb-1">
            Total Group Spend
          </span>
          <span className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
            {formatCurrency(summary.totalSpent)}
          </span>
          <span className="text-[10px] text-neutral-400 block mt-0.5">
            {summary.expensesCount} shared {summary.expensesCount === 1 ? 'expense' : 'expenses'}
          </span>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 block mb-1">
            You Paid
          </span>
          <span className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
            {formatCurrency(userBalance?.paidAmount || 0)}
          </span>
          <span className="text-[10px] text-neutral-400 block mt-0.5">Your payments</span>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 block mb-1">
            Your Share
          </span>
          <span className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
            {formatCurrency(userBalance?.owedAmount || 0)}
          </span>
          <span className="text-[10px] text-neutral-400 block mt-0.5">Your consumption</span>
        </div>

        <div
          className={`border rounded-2xl p-4 shadow-xs ${
            isUserOwed
              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
              : doesUserOwe
              ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
              : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'
          }`}
        >
          <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 block mb-1">
            Your Net Balance
          </span>
          <span
            className={`text-lg sm:text-xl font-bold ${
              isUserOwed
                ? 'text-emerald-600 dark:text-emerald-400'
                : doesUserOwe
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-neutral-700 dark:text-neutral-300'
            }`}
          >
            {isUserOwed && '+'}
            {formatCurrency(userBalance?.netBalance || 0)}
          </span>
          <span className="text-[10px] text-neutral-400 block mt-0.5 font-medium">
            {isUserOwed ? 'You are owed' : doesUserOwe ? 'You owe this group' : 'All settled'}
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-neutral-200 dark:border-neutral-800">
        <button
          onClick={() => setActiveTab('expenses')}
          className={`pb-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'expenses'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Expenses ({expenses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('balances')}
          className={`pb-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'balances'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Balances & Settlement Plan</span>
          {suggestedSettlements.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              {suggestedSettlements.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('settlements')}
          className={`pb-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'settlements'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Settlements History ({settlements.length})</span>
        </button>
      </div>

      {/* TAB 1: EXPENSES LIST */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          {expenses.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
              <Receipt className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                No group expenses yet
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
                Add your first shared expense. Choose from Equal, Custom, Percentage, or Shares splitting.
              </p>
              <button
                onClick={() => setIsExpenseModalOpen(true)}
                className="mt-4 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Expense</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense) => {
                const payerName = expense.payerName || 'Member';

                return (
                  <div
                    key={expense._id}
                    className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-xs transition-all hover:border-neutral-300 dark:hover:border-neutral-700"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white">
                            {expense.title}
                          </h4>
                          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                            {expense.splitMethod} split
                          </span>
                        </div>

                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          Paid by <strong className="font-semibold text-neutral-700 dark:text-neutral-300">{payerName}</strong> on{' '}
                          {formatDate(expense.date)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <span className="text-lg font-extrabold text-neutral-900 dark:text-white">
                          {formatCurrency(expense.amount)}
                        </span>
                        <button
                          onClick={() => handleDeleteExpense(expense._id)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 transition-colors"
                          title="Delete expense"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Breakdown of shares */}
                    <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                      <div className="flex items-center gap-2 flex-wrap text-xs text-neutral-600 dark:text-neutral-400">
                        <span className="text-[11px] font-medium text-neutral-400">Split among:</span>
                        {expense.splits.map((s) => (
                          <span
                            key={s.participantId}
                            className="px-2 py-0.5 rounded-md bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800 text-[11px]"
                          >
                            {s.participantName}: <strong>{formatCurrency(s.shareAmount)}</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BALANCES & SIMPLIFIED SETTLEMENT PLAN */}
      {activeTab === 'balances' && (
        <div className="space-y-6">
          {/* Section 1: Simplified Settlement Plan (Greedy Engine Output) */}
          <div className="bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-white dark:from-neutral-900 dark:via-blue-950/20 dark:to-neutral-900 border border-blue-100 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Minimal Debt Settlement
                </span>
                <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white mt-0.5">
                  Suggested Settlement Plan
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Calculated using our graph debt reduction algorithm to clear all group balances in the minimum transactions.
                </p>
              </div>
            </div>

            {suggestedSettlements.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-white/70 dark:bg-neutral-800/40 border border-blue-100/60 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>All balances in this group are completely settled! No payments required.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {suggestedSettlements.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between shadow-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                        <span>{s.fromName}</span>
                        <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                        <span>{s.toName}</span>
                      </div>
                      <span className="text-base font-extrabold text-neutral-900 dark:text-white block">
                        {formatCurrency(s.amount)}
                      </span>
                    </div>

                    <button
                      onClick={() => handleOpenPrefilledSettlement(s)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs flex items-center gap-1 shrink-0"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Settle Up</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Participant Net Balances Table */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  Member Balances Breakdown
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Overview of each member's total payments, consumption share, and net balance.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-100 dark:border-neutral-800 text-neutral-400 uppercase tracking-wider text-[10px]">
                    <th className="pb-3 font-medium">Member</th>
                    <th className="pb-3 font-medium">Total Paid</th>
                    <th className="pb-3 font-medium">Their Share</th>
                    <th className="pb-3 font-medium text-right">Net Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {balances.map((b) => {
                    const isOwed = b.netBalance > 0;
                    const owes = b.netBalance < 0;

                    return (
                      <tr key={b.participantId} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                        <td className="py-3 font-semibold text-neutral-800 dark:text-neutral-200">
                          {b.name}
                        </td>
                        <td className="py-3 text-neutral-600 dark:text-neutral-400">
                          {formatCurrency(b.paidAmount)}
                        </td>
                        <td className="py-3 text-neutral-600 dark:text-neutral-400">
                          {formatCurrency(b.owedAmount)}
                        </td>
                        <td className="py-3 text-right font-bold">
                          <span
                            className={
                              isOwed
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : owes
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-neutral-500'
                            }
                          >
                            {isOwed && '+'}
                            {formatCurrency(b.netBalance)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SETTLEMENTS HISTORY */}
      {activeTab === 'settlements' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
              Recorded Settlements
            </h3>
            <button
              onClick={() => {
                setPrefilledSettlement(null);
                setIsSettlementModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record New Settlement</span>
            </button>
          </div>

          {settlements.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
              <CheckCircle2 className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                No settlements recorded yet
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
                When members pay each other back via cash or UPI, record it here to clear their balances.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {settlements.map((st) => {
                const isSettled = st.status === 'settled';

                return (
                  <div
                    key={st._id}
                    className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                        <span>{st.fromName}</span>
                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <span>paid</span>
                          <ArrowRight className="w-3 h-3" />
                        </div>
                        <span>{st.toName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                        <span>{formatDate(st.createdAt)}</span>
                        {st.notes && <span>• {st.notes}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <span className="text-base font-extrabold text-neutral-900 dark:text-white">
                        {formatCurrency(st.amount)}
                      </span>

                      <button
                        onClick={() => handleToggleSettlementStatus(st._id, st.status)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                          isSettled
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        }`}
                        title="Click to toggle status"
                      >
                        {isSettled ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Settled</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            <span>Pending</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <AddGroupExpenseModal
        isOpen={isExpenseModalOpen}
        groupId={groupId}
        participants={group.participants}
        categories={categories}
        onClose={() => setIsExpenseModalOpen(false)}
        onExpenseAdded={() => {
          fetchDetails();
          onRefreshParent();
        }}
      />

      <RecordSettlementModal
        isOpen={isSettlementModalOpen}
        groupId={groupId}
        participants={group.participants}
        prefilled={prefilledSettlement}
        onClose={() => setIsSettlementModalOpen(false)}
        onSettlementRecorded={() => {
          fetchDetails();
          onRefreshParent();
        }}
      />

      <AddParticipantModal
        isOpen={isAddMemberModalOpen}
        groupId={groupId}
        onClose={() => setIsAddMemberModalOpen(false)}
        onParticipantAdded={() => {
          fetchDetails();
          onRefreshParent();
        }}
      />
    </div>
  );
}
