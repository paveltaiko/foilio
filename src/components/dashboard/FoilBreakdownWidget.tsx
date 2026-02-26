import { WidgetCard } from './WidgetCard';
import { formatPrice } from '../../utils/formatPrice';

interface FoilBreakdownWidgetProps {
  nonFoilCount: number;
  foilCount: number;
  nonFoilValue: number;
  foilValue: number;
}

export function FoilBreakdownWidget({
  nonFoilCount,
  foilCount,
  nonFoilValue,
  foilValue,
}: FoilBreakdownWidgetProps) {
  const total = nonFoilCount + foilCount;
  const nonFoilPct = total > 0 ? Math.round((nonFoilCount / total) * 100) : 0;
  const foilPct = total > 0 ? Math.round((foilCount / total) * 100) : 0;

  const rows = [
    { label: 'NF', pct: nonFoilPct, count: nonFoilCount, value: nonFoilValue, barClass: 'bg-neutral-400' },
    { label: 'F', pct: foilPct, count: foilCount, value: foilValue, barClass: 'bg-violet-500' },
  ];

  return (
    <WidgetCard title="Finish">
      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold font-mono text-neutral-500">
                {row.label}
              </span>
              <span className="text-sm font-mono font-bold text-neutral-600 whitespace-nowrap">
                {row.count}
                {row.value > 0 && (
                  <span className="font-normal text-neutral-400"> / {formatPrice(row.value)}</span>
                )}
              </span>
            </div>
            <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${row.barClass}`}
                style={{ width: `${row.pct}%`, minWidth: row.pct > 0 ? '4px' : '0' }}
              />
            </div>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}
