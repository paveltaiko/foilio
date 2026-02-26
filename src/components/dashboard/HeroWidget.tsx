import { ProgressBar } from '../ui/ProgressBar';
import { formatPrice } from '../../utils/formatPrice';
import { WidgetCard } from './WidgetCard';

interface HeroWidgetProps {
  totalUniqueOwned: number;
  totalValueEur: number;
  globalCompletionPct: number;
}

export function HeroWidget({
  totalUniqueOwned,
  totalValueEur,
  globalCompletionPct,
}: HeroWidgetProps) {
  return (
    <WidgetCard title="My Collection">
      <div className="flex flex-col items-center gap-8 py-1">
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-3xl sm:text-4xl font-bold text-neutral-800 font-mono tracking-tight">
            {totalValueEur > 0 ? formatPrice(totalValueEur) : '—'}
          </span>
          <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-neutral-400">Total Value</span>
        </div>
        <div className="flex items-center gap-2 w-full">
          <div className="flex flex-1 flex-col items-center rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2.5">
            <span className="text-lg sm:text-xl font-bold font-mono text-neutral-800 leading-tight">{totalUniqueOwned.toLocaleString()}</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 leading-tight mt-0.5">Cards</span>
          </div>
          <div className="flex flex-1 flex-col items-center rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2.5">
            <span className="text-lg sm:text-xl font-bold font-mono text-neutral-800 leading-tight">{globalCompletionPct}%</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 leading-tight mt-0.5">Complete</span>
          </div>
        </div>
      </div>
      <ProgressBar value={globalCompletionPct} />
    </WidgetCard>
  );
}
