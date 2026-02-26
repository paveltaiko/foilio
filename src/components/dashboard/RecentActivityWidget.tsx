import { WidgetCard } from './WidgetCard';
import type { OwnedCard } from '../../types/card';

interface RecentActivityWidgetProps {
  recentCards: OwnedCard[];
}

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function RecentActivityWidget({ recentCards }: RecentActivityWidgetProps) {
  if (recentCards.length === 0) {
    return (
      <WidgetCard title="Recent">
        <p className="text-xs text-neutral-400 py-1">No cards added yet</p>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard title="Recent">
      <div className="flex flex-col gap-2.5">
        {recentCards.map((card) => (
          <div key={card.scryfallId} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              {/* Finish dots */}
              <div className="flex gap-0.5 shrink-0">
                {card.ownedNonFoil && (
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
                )}
                {card.ownedFoil && (
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)' }}
                  />
                )}
              </div>
              <span className="text-xs sm:text-sm text-neutral-800 font-medium truncate">
                {card.name}
              </span>
            </div>
            <span className="text-2xs sm:text-xs font-mono text-neutral-400 shrink-0">
              {formatRelativeTime(card.updatedAt)}
            </span>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}
