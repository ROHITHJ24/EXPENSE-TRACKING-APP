import { Sparkles, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';

interface SpendingInsightsProps {
  insights?: string[];
}

export function SpendingInsights({ insights = [] }: SpendingInsightsProps) {
  if (!insights || insights.length === 0) {
    return null;
  }

  const getInsightIcon = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes('higher') || lower.includes('spent') || lower.includes('surge')) {
      return <TrendingUp className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />;
    }
    if (lower.includes('on track') || lower.includes('below')) {
      return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />;
    }
    if (lower.includes('safe') || lower.includes('guideline')) {
      return <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />;
    }
    return <AlertCircle className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />;
  };

  return (
    <div
      id="spending-insights-section"
      className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-xs"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <div>
          <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white">
            Spending Insights
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {insights.map((insight, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50/80 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300"
          >
            {getInsightIcon(insight)}
            <p className="leading-relaxed">{insight}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
