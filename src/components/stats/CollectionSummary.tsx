import { ProgressBar } from '../ui/ProgressBar';
import { formatPrice } from '../../utils/formatPrice';

interface CollectionSummaryProps {
  totalCards: number;
  ownedCount: number;
  totalValue: number;
  percentage: number;
}

export function CollectionSummary({
  totalCards,
  ownedCount,
  totalValue,
  percentage,
}: CollectionSummaryProps) {
  return (
    <div className="bg-surface-primary border border-surface-border rounded-lg p-3 sm:p-4">
      <div className="flex items-baseline justify-between gap-2 mb-3">
        <div className="flex items-baseline gap-2 sm:gap-3">
          <span className="text-xl sm:text-2xl font-bold text-neutral-800 font-mono tracking-tight">
            {ownedCount}
            <span className="text-xs sm:text-sm font-normal text-neutral-400">/{totalCards}</span>
          </span>
          <span className="text-xs sm:text-sm text-neutral-500">cards</span>
        </div>
        <div className="sm:text-right">
          <span className="text-base sm:text-lg font-bold text-neutral-800 font-mono">
            {formatPrice(totalValue)}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <ProgressBar value={percentage} className="flex-1" />
        <span className="text-xs font-mono font-bold text-primary-500 min-w-[3ch] text-right">
          {percentage}%
        </span>
      </div>
    </div>
  );
}
