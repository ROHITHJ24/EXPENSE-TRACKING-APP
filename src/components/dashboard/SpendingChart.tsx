import { formatCurrency } from '../../utils/formatters.js';

interface MonthlyData {
  label: string;
  year: number;
  month: number;
  income: number;
  expense: number;
}

interface SpendingChartProps {
  data: MonthlyData[];
}

export function SpendingChart({ data }: SpendingChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-52 text-sm text-neutral-400">
        No trend data available yet
      </div>
    );
  }

  // Calculate highest amount for Y-axis scale
  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.income, d.expense)),
    1000
  );

  return (
    <div className="w-full">
      {/* Legend */}
      <div className="flex items-center justify-end gap-5 mb-4 text-xs font-medium">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500"></span>
          <span className="text-neutral-600 dark:text-neutral-400">Income</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-xs bg-rose-500"></span>
          <span className="text-neutral-600 dark:text-neutral-400">Expense</span>
        </div>
      </div>

      {/* Chart Bars */}
      <div className="h-52 flex items-end justify-between gap-2 sm:gap-4 pt-4 pb-2 border-b border-neutral-100 dark:border-neutral-800">
        {data.map((item, index) => {
          const incomeHeight = maxVal > 0 ? Math.round((item.income / maxVal) * 100) : 0;
          const expenseHeight = maxVal > 0 ? Math.round((item.expense / maxVal) * 100) : 0;

          return (
            <div key={index} className="flex-1 flex flex-col items-center h-full justify-end group relative">
              {/* Tooltip on hover */}
              <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center bg-neutral-900 text-white text-[11px] py-1 px-2.5 rounded-lg shadow-md pointer-events-none whitespace-nowrap">
                <span>Income: {formatCurrency(item.income)}</span>
                <span>Expense: {formatCurrency(item.expense)}</span>
              </div>

              {/* Bar container */}
              <div className="w-full max-w-[36px] flex items-end justify-center gap-1 h-full">
                {/* Income bar */}
                <div
                  style={{ height: `${Math.max(incomeHeight, 3)}%` }}
                  className="w-1/2 rounded-t-sm bg-emerald-500/90 group-hover:bg-emerald-600 transition-all duration-300"
                  title={`Income: ${formatCurrency(item.income)}`}
                ></div>
                {/* Expense bar */}
                <div
                  style={{ height: `${Math.max(expenseHeight, 3)}%` }}
                  className="w-1/2 rounded-t-sm bg-rose-500/90 group-hover:bg-rose-600 transition-all duration-300"
                  title={`Expense: ${formatCurrency(item.expense)}`}
                ></div>
              </div>

              {/* Month label */}
              <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mt-2">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
