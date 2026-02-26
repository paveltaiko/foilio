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
      <div className="flex flex-col items-center gap-1 py-1">
        <span className="text-3xl sm:text-4xl font-bold text-neutral-800 font-mono tracking-tight">
          {totalValueEur > 0 ? formatPrice(totalValueEur) : '—'}
        </span>
        <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-400 font-mono">
          <span>{totalUniqueOwned.toLocaleString()} cards</span>
          <span className="text-neutral-200">·</span>
          <span>{globalCompletionPct}% complete</span>
        </div>
      </div>
      <ProgressBar value={globalCompletionPct} />
    </WidgetCard>
  );
}
