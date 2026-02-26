import { WidgetCard } from './WidgetCard';
import { getRarityInfo } from '../../utils/rarity';

interface RarityBreakdownWidgetProps {
  rarityBreakdown: Record<string, number>;
}

const RARITY_ORDER = ['mythic', 'rare', 'uncommon', 'common', 'special', 'bonus'] as const;

export function RarityBreakdownWidget({ rarityBreakdown }: RarityBreakdownWidgetProps) {
  const total = Object.values(rarityBreakdown).reduce((a, b) => a + b, 0);

  if (total === 0) {
    return (
      <WidgetCard title="Rarity">
        <p className="text-sm text-neutral-400 py-1">
          Browse your collection first
        </p>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard title="Rarity">
      <div className="flex flex-col gap-2">
        {RARITY_ORDER.map((rarity) => {
          const count = rarityBreakdown[rarity] ?? 0;
          if (count === 0) return null;
          const info = getRarityInfo(rarity);
          const pct = Math.round((count / total) * 100);

          return (
            <div key={rarity} className="flex items-center gap-2">
              <span className={`text-sm font-bold w-5 shrink-0 font-mono ${info.colorClass}`}>
                {info.short}
              </span>
              <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${info.badgeClass}`}
                  style={{ width: `${pct}%`, minWidth: pct > 0 ? '4px' : '0' }}
                />
              </div>
              <span className="text-sm font-mono font-bold text-neutral-600 w-8 text-right shrink-0">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </WidgetCard>
  );
}
