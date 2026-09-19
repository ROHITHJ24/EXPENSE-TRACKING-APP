import { useState, useEffect } from 'react';
import { GroupListItem, Category } from '../../types/index.js';
import { api } from '../../services/api.js';
import { formatCurrency } from '../../utils/formatters.js';
import { GroupDetailView } from './GroupDetailView.js';
import { CreateGroupModal } from './CreateGroupModal.js';
import { CardSkeleton } from '../common/LoadingSkeleton.js';
import { Users, Plus, ArrowRight, CheckCircle2, Receipt, AlertCircle } from 'lucide-react';

interface GroupsViewProps {
  categories: Category[];
  currentUserId?: string;
  initialGroupId?: string | null;
  onClearInitialGroup?: () => void;
}

export function GroupsView({
  categories,
  currentUserId,
  initialGroupId = null,
  onClearInitialGroup,
}: GroupsViewProps) {
  const [groups, setGroups] = useState<GroupListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(initialGroupId);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialGroupId) {
      setSelectedGroupId(initialGroupId);
      if (onClearInitialGroup) onClearInitialGroup();
    }
  }, [initialGroupId]);

  const loadGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getUserGroups();
      setGroups(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  // If a group is selected, show detail view
  if (selectedGroupId) {
    return (
      <GroupDetailView
        groupId={selectedGroupId}
        categories={categories}
        currentUserId={currentUserId}
        onBack={() => setSelectedGroupId(null)}
        onRefreshParent={loadGroups}
      />
    );
  }

  // Calculate overall metrics
  const totalNet = groups.reduce((sum, g) => sum + (g.userNetBalance || 0), 0);
  const totalYouPaid = groups.reduce((sum, g) => sum + (g.userPaid || 0), 0);
  const totalYouOwe = groups.reduce((sum, g) => sum + (g.userOwed || 0), 0);

  const isOwed = totalNet > 0;
  const owes = totalNet < 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Split & Group Expenses
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Manage shared bills for trips, roommates, events, and dinners with simplified settlements.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="self-start sm:self-auto flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Group</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Overall Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className={`border rounded-2xl p-5 shadow-xs transition-all ${
            isOwed
              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
              : owes
              ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
              : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'
          }`}
        >
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 block mb-1">
            Overall Shared Net Balance
          </span>
          <span
            className={`text-2xl font-extrabold tracking-tight ${
              isOwed
                ? 'text-emerald-600 dark:text-emerald-400'
                : owes
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-neutral-900 dark:text-white'
            }`}
          >
            {isOwed && '+'}
            {formatCurrency(totalNet)}
          </span>
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block mt-1">
            {isOwed
              ? 'You are owed money overall'
              : owes
              ? 'You owe money across groups'
              : 'All groups are currently settled'}
          </span>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 block mb-1">
            Total You Paid in Groups
          </span>
          <span className="text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            {formatCurrency(totalYouPaid)}
          </span>
          <span className="text-[11px] text-neutral-400 block mt-1">
            Across {groups.length} active {groups.length === 1 ? 'group' : 'groups'}
          </span>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 block mb-1">
            Your Total Consumption
          </span>
          <span className="text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            {formatCurrency(totalYouOwe)}
          </span>
          <span className="text-[11px] text-neutral-400 block mt-1">
            Your personal share of group expenses
          </span>
        </div>
      </div>

      {/* Groups List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-base text-neutral-900 dark:text-white">
            Your Groups ({groups.length})
          </h3>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : groups.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
            <Users className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
              No groups created yet
            </h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
              Create a group to track shared expenses for trips, roommates, housemates, or restaurant bills.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-4 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Group</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group) => {
              const groupOwed = (group.userNetBalance || 0) > 0;
              const groupOwes = (group.userNetBalance || 0) < 0;

              return (
                <div
                  key={group._id}
                  onClick={() => setSelectedGroupId(group._id)}
                  className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-700 transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-base text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {group.name}
                        </h4>
                        {group.description && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2">
                            {group.description}
                          </p>
                        )}
                      </div>

                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 shrink-0">
                        {group.participantsCount} members
                      </span>
                    </div>

                    <div className="pt-2 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                      <span>Total Group Spend</span>
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                        {formatCurrency(group.totalSpent)}
                      </span>
                    </div>
                  </div>

                  {/* Footer status */}
                  <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-medium">
                        Your Balance
                      </span>
                      <span
                        className={`text-sm font-bold ${
                          groupOwed
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : groupOwes
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-neutral-500'
                        }`}
                      >
                        {groupOwed && '+'}
                        {formatCurrency(group.userNetBalance || 0)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform">
                      <span>View</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onGroupCreated={(newGroup) => {
          loadGroups();
          if (newGroup?._id) {
            setSelectedGroupId(newGroup._id);
          }
        }}
      />
    </div>
  );
}
