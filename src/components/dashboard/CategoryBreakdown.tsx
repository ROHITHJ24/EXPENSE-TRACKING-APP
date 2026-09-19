import { formatCurrency, formatPercent } from '../../utils/formatters.js';
import { Tag } from 'lucide-react';

interface CategoryItem {
  categoryId: string;
  name: string;
  amount: number;
  percentage: number;
  color?: string;
  icon?: string;
}

interface CategoryBreakdownProps {
  categories: CategoryItem[];
}

export function CategoryBreakdown({ categories }: CategoryBreakdownProps) {
  if (!categories || categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <Tag className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mb-2" />
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          No expense breakdown available yet.
        </p>
      </div>
    );
  }

  // Visual color mapping
  const colorMap: Record<string, string> = {
    orange: 'bg-orange-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    red: 'bg-rose-500',
    pink: 'bg-pink-500',
    emerald: 'bg-emerald-500',
    indigo: 'bg-indigo-500',
    cyan: 'bg-cyan-500',
    violet: 'bg-violet-500',
    rose: 'bg-rose-500',
    slate: 'bg-slate-500',
  };

  return (
    <div className="space-y-4">
      {categories.map((cat, idx) => {
        const bgClass = colorMap[cat.color || 'blue'] || 'bg-blue-500';

        return (
          <div key={cat.categoryId || idx} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${bgClass}`}></span>
                <span className="font-medium text-neutral-800 dark:text-neutral-200">
                  {cat.name}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {formatCurrency(cat.amount)}
                </span>
                <span className="text-xs text-neutral-400 w-8 text-right font-medium">
                  {formatPercent(cat.percentage)}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full ${bgClass}`}
                style={{ width: `${Math.min(100, Math.max(2, cat.percentage))}%` }}
              ></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
