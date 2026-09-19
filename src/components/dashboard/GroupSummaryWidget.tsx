import { useEffect, useState } from 'react';
import { GroupListItem } from '../../types/index.js';
import { api } from '../../services/api.js';
import { formatCurrency } from '../../utils/formatters.js';
import { Users, ArrowRight } from 'lucide-react';

interface GroupSummaryWidgetProps {
  onNavigateToGroups: () => void;
}

export function GroupSummaryWidget({ onNavigateToGroups }: GroupSummaryWidgetProps) {
  const [groups, setGroups] = useState<GroupListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api
      .getUserGroups()
      .then((data) => {
        if (isMounted) setGroups(data || []);
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) return null;

  // Calculate total net balance across all user groups
  const totalNet = groups.reduce((sum, g) => sum + (g.userNetBalance || 0), 0);
  const isOwed = totalNet > 0;
  const owes = totalNet < 0;

  return (
    <div
      id="dashboard-group-summary-widget"
      className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-xs"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                Split & Group Expenses
              </h4>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                {groups.length} {groups.length === 1 ? 'group' : 'groups'}
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {groups.length === 0 ? (
                'Split trips, dinners, and roommate expenses with simplified settlements.'
              ) : isOwed ? (
                <span>
                  Overall, you are owed{' '}
                  <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    +{formatCurrency(totalNet)}
                  </strong>{' '}
                  across shared groups.
                </span>
              ) : owes ? (
                <span>
                  Overall, you owe{' '}
                  <strong className="text-rose-600 dark:text-rose-400 font-semibold">
                    {formatCurrency(Math.abs(totalNet))}
                  </strong>{' '}
                  across shared groups.
                </span>
              ) : (
                'All your group balances are currently settled up.'
              )}
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToGroups}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors"
        >
          <span>{groups.length === 0 ? 'Create Group' : 'View Groups'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
