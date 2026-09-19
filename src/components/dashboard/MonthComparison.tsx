import { MonthComparison as MonthComparisonType } from '../../types/index.js';
import { formatCurrency } from '../../utils/formatters.js';
import { ArrowUp, ArrowDown, Minus, ArrowLeftRight } from 'lucide-react';

interface MonthComparisonProps {
  data?: MonthComparisonType;
}

export function MonthComparison({ data }: MonthComparisonProps) {
  if (!data || !data.categories || data.categories.length === 0) {
    return null;
  }

  const { categories, summary } = data;

  return (
    <div
      id="month-to-month-comparison-section"
      className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-xs"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <ArrowLeftRight className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white">
              Month-to-Month Comparison
            </h3>
          </div>
        </div>
        <span className="text-xs text-neutral-400 font-medium">This month vs Last month</span>
      </div>

      {/* Category Change Pills / Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 mb-3.5">
        {categories.map((cat) => {
          const isUp = cat.direction === 'up';
          const isDown = cat.direction === 'down';

          return (
            <div
              key={cat.name}
              className="flex flex-col p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 text-xs"
            >
              <span className="text-neutral-500 dark:text-neutral-400 truncate font-medium">
                {cat.name}
              </span>
              <div className="flex items-center gap-1 mt-1 font-semibold">
                {isUp && <ArrowUp className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                {isDown && <ArrowDown className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                {!isUp && !isDown && <Minus className="w-3 h-3 text-neutral-400 shrink-0" />}
                <span
                  className={
                    isUp
                      ? 'text-rose-600 dark:text-rose-400'
                      : isDown
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-neutral-600 dark:text-neutral-400'
                  }
                >
                  {formatCurrency(cat.absDiff)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Concise human explanation */}
      {summary && (
        <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            {summary}
          </p>
        </div>
      )}
    </div>
  );
}
