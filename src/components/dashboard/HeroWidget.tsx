import { ProgressBar } from '../ui/ProgressBar';
import { formatPrice } from '../../utils/formatPrice';
import { WidgetCard } from './WidgetCard';

interface HeroWidgetProps {
  totalUniqueOwned: number;
  totalValueEur: number;
  globalCompletionPct: number;
}

function getCompletionStyle(pct: number): { bg: string; border: string; value: string; label: string } {
  if (pct >= 100) return { bg: 'bg-green-50', border: 'border-green-100', value: 'text-green-700', label: 'text-green-500' };
  if (pct >= 50) return { bg: 'bg-green-50', border: 'border-green-100', value: 'text-green-700', label: 'text-green-500' };
  if (pct >= 25) return { bg: 'bg-yellow-50', border: 'border-yellow-100', value: 'text-yellow-700', label: 'text-yellow-500' };
  return { bg: 'bg-red-50', border: 'border-red-100', value: 'text-red-700', label: 'text-red-500' };
}

export function HeroWidget({
  totalUniqueOwned,
  totalValueEur,
  globalCompletionPct,
}: HeroWidgetProps) {
  const completionStyle = getCompletionStyle(globalCompletionPct);

  return (
    <WidgetCard title="My Collection">
      <div className="flex flex-col items-center gap-3 py-1">
        <span className="text-3xl sm:text-4xl font-bold text-neutral-800 font-mono tracking-tight">
          {totalValueEur > 0 ? formatPrice(totalValueEur) : '—'}
        </span>
        <div className="flex items-center gap-2 w-full">
          <div className="flex flex-1 flex-col items-center rounded-xl bg-blue-50 border border-blue-100 px-3 py-2.5">
            <span className="text-base sm:text-lg font-bold font-mono text-blue-700 leading-tight">{totalUniqueOwned.toLocaleString()}</span>
            <span className="text-2xs sm:text-xs font-semibold uppercase tracking-wider text-blue-500 leading-tight mt-0.5">Cards</span>
          </div>
          <div className={`flex flex-1 flex-col items-center rounded-xl border px-3 py-2.5 ${completionStyle.bg} ${completionStyle.border}`}>
            <span className={`text-base sm:text-lg font-bold font-mono leading-tight ${completionStyle.value}`}>{globalCompletionPct}%</span>
            <span className={`text-2xs sm:text-xs font-semibold uppercase tracking-wider leading-tight mt-0.5 ${completionStyle.label}`}>Complete</span>
          </div>
        </div>
      </div>
      <ProgressBar value={globalCompletionPct} />
    </WidgetCard>
  );
}
