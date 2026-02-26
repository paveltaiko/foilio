import { WidgetCard } from './WidgetCard';
import type { NearCompleteSet } from '../../hooks/useHomeStats';

interface NearCompleteWidgetProps {
  nearCompleteSets: NearCompleteSet[];
}

export function NearCompleteWidget({ nearCompleteSets }: NearCompleteWidgetProps) {
  if (nearCompleteSets.length === 0) {
    return (
      <WidgetCard title="Almost Complete">
        <p className="text-sm text-neutral-400">No sets above 60% yet</p>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard title="Almost Complete">
      <div className="flex flex-col gap-0">
        {nearCompleteSets.map((s) => (
          <div key={s.setId} className="flex items-center justify-between py-2">
            <span className="text-sm text-neutral-700 truncate pr-2">{s.name}</span>
            <span className="text-sm font-mono font-semibold text-owned shrink-0">
              {s.remaining} left
            </span>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}
