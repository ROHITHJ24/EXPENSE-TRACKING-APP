import { useState, useEffect } from 'react';
import { GroupParticipant, SuggestedSettlement } from '../../types/index.js';
import { api } from '../../services/api.js';
import { formatCurrency } from '../../utils/formatters.js';
import { X, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

interface RecordSettlementModalProps {
  isOpen: boolean;
  groupId: string;
  participants: GroupParticipant[];
  prefilled?: SuggestedSettlement | null;
  onClose: () => void;
  onSettlementRecorded: () => void;
}

export function RecordSettlementModal({
  isOpen,
  groupId,
  participants,
  prefilled,
  onClose,
  onSettlementRecorded,
}: RecordSettlementModalProps) {
  const [fromParticipantId, setFromParticipantId] = useState('');
  const [toParticipantId, setToParticipantId] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'pending' | 'settled'>('settled');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (prefilled) {
        setFromParticipantId(prefilled.fromParticipantId);
        setToParticipantId(prefilled.toParticipantId);
        setAmount(String(prefilled.amount));
        setNotes('Settled via simplified balance plan');
      } else if (participants.length >= 2) {
        setFromParticipantId(participants[0]._id);
        setToParticipantId(participants[1]._id);
        setAmount('');
        setNotes('');
      }
      setStatus('settled');
      setError(null);
    }
  }, [isOpen, prefilled, participants]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromParticipantId || !toParticipantId) {
      setError('Please select both the person paying and the person receiving the settlement.');
      return;
    }
    if (fromParticipantId === toParticipantId) {
      setError('A member cannot record a settlement payment to themselves. Please select another person.');
      return;
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a settlement amount greater than zero.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await api.recordSettlement(groupId, {
        fromParticipantId,
        toParticipantId,
        amount: numAmount,
        notes: notes.trim(),
        status,
      });
      onSettlementRecorded();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Unable to record this settlement payment right now. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const fromName = participants.find((p) => p._id === fromParticipantId)?.name || 'Payer';
  const toName = participants.find((p) => p._id === toParticipantId)?.name || 'Receiver';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                Record Settlement
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Mark debt as settled between members
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Visual Settlement Flow */}
          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs font-semibold">
            <span className="text-neutral-700 dark:text-neutral-300">{fromName}</span>
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <span>pays</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
            <span className="text-neutral-700 dark:text-neutral-300">{toName}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                Who Paid? (Debtor)
              </label>
              <select
                value={fromParticipantId}
                onChange={(e) => setFromParticipantId(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                Who Received? (Creditor)
              </label>
              <select
                value={toParticipantId}
                onChange={(e) => setToParticipantId(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {participants.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
              Settlement Amount (₹) *
            </label>
            <input
              type="number"
              placeholder="0.00"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
              Notes / Payment Method (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Paid via GooglePay / Cash"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
              Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus('settled')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  status === 'settled'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                ✓ Already Settled
              </button>
              <button
                type="button"
                onClick={() => setStatus('pending')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  status === 'pending'
                    ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                    : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                ⏳ Payment Pending
              </button>
            </div>
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
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span>{submitting ? 'Recording...' : 'Record Settlement'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
