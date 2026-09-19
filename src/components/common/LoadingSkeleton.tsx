export function StatCardSkeleton() {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 w-20 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
        <div className="w-8 h-8 rounded-lg bg-neutral-200 dark:bg-neutral-800"></div>
      </div>
      <div className="h-8 w-32 bg-neutral-200 dark:bg-neutral-800 rounded mb-2"></div>
      <div className="h-3 w-24 bg-neutral-100 dark:bg-neutral-800/60 rounded"></div>
    </div>
  );
}

export function TransactionRowSkeleton() {
  return (
    <div className="flex items-center justify-between py-3.5 px-4 border-b border-neutral-100 dark:border-neutral-800/60 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-neutral-200 dark:bg-neutral-800"></div>
        <div>
          <div className="h-4 w-28 bg-neutral-200 dark:bg-neutral-800 rounded mb-1.5"></div>
          <div className="h-3 w-20 bg-neutral-100 dark:bg-neutral-800/60 rounded"></div>
        </div>
      </div>
      <div className="text-right">
        <div className="h-4 w-16 bg-neutral-200 dark:bg-neutral-800 rounded mb-1.5 ml-auto"></div>
        <div className="h-3 w-12 bg-neutral-100 dark:bg-neutral-800/60 rounded ml-auto"></div>
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs animate-pulse">
      <div className="h-5 w-36 bg-neutral-200 dark:bg-neutral-800 rounded mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 w-full bg-neutral-100 dark:bg-neutral-800/60 rounded"></div>
        <div className="h-4 w-5/6 bg-neutral-100 dark:bg-neutral-800/60 rounded"></div>
        <div className="h-4 w-4/6 bg-neutral-100 dark:bg-neutral-800/60 rounded"></div>
      </div>
    </div>
  );
}
