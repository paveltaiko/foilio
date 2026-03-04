import { WidgetCard } from './WidgetCard';
import { formatPrice } from '../../utils/formatPrice';
import type { ValuableCard } from '../../hooks/useHomeStats';

interface MostValuableWidgetProps {
  mostValuableCards: ValuableCard[];
}

export function MostValuableWidget({ mostValuableCards }: MostValuableWidgetProps) {
  if (mostValuableCards.length === 0) {
    return (
      <WidgetCard title="Most Valuable">
        <p className="text-xs text-neutral-400 py-1">
          Browse your collection first
        </p>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard title="Most Valuable">
      <div className="flex flex-col gap-2.5">
        {mostValuableCards.map((card) => (
          <div key={`${card.scryfallId}-${card.isFoil}`} className="flex items-center gap-2">
            <div className="flex-1 min-w-0 flex items-center gap-1.5">
              <div
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${card.isFoil ? 'bg-violet-500' : 'bg-neutral-300'}`}
              />
              <span className="text-xs sm:text-sm text-neutral-800 font-medium truncate">
                {card.name}
              </span>
            </div>
            <span className={`text-xs sm:text-sm font-bold font-mono shrink-0 ${card.isFoil ? 'text-violet-500' : 'text-neutral-700'}`}>
              {formatPrice(card.priceEur)}
            </span>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}
