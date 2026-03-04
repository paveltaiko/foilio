import { useState } from 'react';
import { WidgetCard } from './WidgetCard';
import type { SetProgressStat } from '../../hooks/useHomeStats';

interface SetProgressWidgetProps {
  setProgress: SetProgressStat[];
}

const COLLAPSED_COUNT = 5;

export function SetProgressWidget({ setProgress }: SetProgressWidgetProps) {
  const [expanded, setExpanded] = useState(false);

  if (setProgress.length === 0) {
    return (
      <WidgetCard title="Set Progress">
        <p className="text-sm text-neutral-400">
          Enable franchises in Settings to see progress
        </p>
      </WidgetCard>
    );
  }

  const visibleSets = expanded ? setProgress : setProgress.slice(0, COLLAPSED_COUNT);
  const hasMore = setProgress.length > COLLAPSED_COUNT;

  return (
    <WidgetCard title="Set Progress">
      <div className="flex flex-col gap-2">
        {visibleSets.map((set) => (
          <div key={set.setId} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold font-mono text-neutral-500 truncate pr-2">
                {set.name}
              </span>
              <span className="text-sm font-mono font-bold text-neutral-600 shrink-0 whitespace-nowrap">
                {set.owned}
                <span className="font-normal text-neutral-400">/{set.total}</span>
              </span>
            </div>
            <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 bg-slate-500"
                style={{ width: `${set.pct}%`, minWidth: set.pct > 0 ? '4px' : '0' }}
              />
            </div>
          </div>
        ))}
        {hasMore && (
          <button
            onClick={() => setExpanded((prev) => !prev)}
            className="mt-2 flex items-center gap-1 text-sm font-mono font-bold text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer"
          >
            <span>{expanded ? 'Show less' : `Show all (${setProgress.length})`}</span>
            <svg
              className={`w-3 h-3 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
              viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <polyline points="2,4 6,8 10,4" />
            </svg>
          </button>
        )}
      </div>
    </WidgetCard>
  );
}
