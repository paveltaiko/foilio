import { WidgetCard } from './WidgetCard';
import type { FranchiseStat } from '../../hooks/useHomeStats';

interface TopFranchisesWidgetProps {
  topFranchises: FranchiseStat[];
}

function abbrev(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return name.slice(0, 3).toUpperCase();
  return words.map((w) => w[0]).join('').slice(0, 3).toUpperCase();
}

export function TopFranchisesWidget({ topFranchises }: TopFranchisesWidgetProps) {
  if (topFranchises.length === 0) {
    return (
      <WidgetCard title="Collection Progress">
        <p className="text-xs text-neutral-400">
          Enable franchises in Settings to see progress
        </p>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard title="Collection Progress">
      <div className="flex flex-col gap-2 sm:gap-2.5">
        {topFranchises.map((f) => (
          <div key={f.franchiseId} className="flex items-center gap-2">
            <span className="text-2xs sm:text-xs font-bold w-7 shrink-0 font-mono text-neutral-500 truncate">
              {abbrev(f.name)}
            </span>
            <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 bg-primary-500"
                style={{ width: `${f.pct}%`, minWidth: f.pct > 0 ? '4px' : '0' }}
              />
            </div>
            <span className="text-2xs sm:text-xs font-mono font-bold text-neutral-600 text-right shrink-0 whitespace-nowrap">
              {f.owned}
              <span className="font-normal text-neutral-400">/{f.total}</span>
            </span>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}
