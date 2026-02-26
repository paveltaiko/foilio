import { WidgetCard } from './WidgetCard';
import type { FranchiseStat } from '../../hooks/useHomeStats';

interface TopFranchisesWidgetProps {
  topFranchises: FranchiseStat[];
}

export function TopFranchisesWidget({ topFranchises }: TopFranchisesWidgetProps) {
  if (topFranchises.length === 0) {
    return (
      <WidgetCard title="Collection Progress">
        <p className="text-sm text-neutral-400">
          Enable franchises in Settings to see progress
        </p>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard title="Collection Progress">
      <div className="flex flex-col gap-2">
        {topFranchises.map((f) => (
          <div key={f.franchiseId} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold font-mono text-neutral-500 truncate pr-2">
                {f.name}
              </span>
              <span className="text-sm font-mono font-bold text-neutral-600 shrink-0 whitespace-nowrap">
                {f.owned}
                <span className="font-normal text-neutral-400">/{f.total}</span>
              </span>
            </div>
            <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 bg-primary-500"
                style={{ width: `${f.pct}%`, minWidth: f.pct > 0 ? '4px' : '0' }}
              />
            </div>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}
