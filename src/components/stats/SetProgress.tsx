import { ProgressBar } from '../ui/ProgressBar';
import type { SetCode } from '../../types/card';

interface SetProgressProps {
  sets: Array<{
    code: SetCode;
    name: string;
    owned: number;
    total: number;
  }>;
}

export function SetProgress({ sets }: SetProgressProps) {
  return (
    <div className="flex flex-col gap-2">
      {sets.map((set) => {
        const pct = set.total > 0 ? Math.round((set.owned / set.total) * 100) : 0;
        return (
          <div key={set.code} className="flex items-center gap-3">
            <span className="text-2xs font-mono font-bold text-neutral-500 uppercase w-8">
              {set.code}
            </span>
            <ProgressBar value={pct} className="flex-1" />
            <span className="text-2xs font-mono text-neutral-500 min-w-[5ch] text-right">
              {set.owned}/{set.total}
            </span>
          </div>
        );
      })}
    </div>
  );
}
