import { formatPrice } from '../../utils/formatPrice';
import { WidgetCard } from './WidgetCard';
import { SectionHeading } from '../ui/SectionHeading';

interface HeroWidgetProps {
  totalValueEur: number;
  totalUniqueOwned: number;
  totalCardsInCollection: number;
  globalCompletionPct: number;
}

export function HeroWidget({
  totalValueEur,
  totalUniqueOwned,
  totalCardsInCollection,
  globalCompletionPct,
}: HeroWidgetProps) {
  const rows = [
    {
      label: 'Cards',
      main: `${totalUniqueOwned}`,
      suffix: totalCardsInCollection > 0 ? `/${totalCardsInCollection}` : null,
      pct: totalCardsInCollection > 0 ? Math.round((totalUniqueOwned / totalCardsInCollection) * 100) : 0,
    },
    {
      label: 'Complete',
      main: `${globalCompletionPct}%`,
      suffix: null,
      pct: globalCompletionPct,
    },
  ];

  return (
    <WidgetCard title="My Collection">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col items-center gap-0.5 py-2 sm:py-0">
          <span className="text-3xl sm:text-4xl text-neutral-800 font-mono tracking-tight" style={{ fontWeight: 800 }}>
            {totalValueEur > 0 ? formatPrice(totalValueEur) : '—'}
          </span>
          <SectionHeading className="text-neutral-500">Total Value</SectionHeading>
        </div>
        <div className="flex flex-col gap-2">
          {rows.map((row) => (
            <div key={row.label} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold font-mono text-neutral-500">{row.label}</span>
                <span className="text-sm font-mono font-bold text-neutral-600 shrink-0 whitespace-nowrap">
                  {row.main}
                  {row.suffix && <span className="font-normal text-neutral-400">{row.suffix}</span>}
                </span>
              </div>
              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-primary-500"
                  style={{ width: `${row.pct}%`, minWidth: row.pct > 0 ? '4px' : '0' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </WidgetCard>
  );
}
