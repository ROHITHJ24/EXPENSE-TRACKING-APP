import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  amount: string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'neutral' | 'success' | 'danger';
}

export function StatCard({
  label,
  amount,
  subtitle,
  icon: Icon,
  variant = 'neutral',
}: StatCardProps) {
  const iconColorClasses = {
    neutral: 'text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400',
    success: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400',
    danger: 'text-rose-600 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-400',
  }[variant];

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-xs transition-all hover:border-neutral-300 dark:hover:border-neutral-700">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          {label}
        </span>
        <div className={`p-2.5 rounded-xl ${iconColorClasses}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
          {amount}
        </h3>
      </div>
      {subtitle && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 flex items-center gap-1">
          {subtitle}
        </p>
      )}
    </div>
  );
}
