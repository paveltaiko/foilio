import type { BoosterFilter as BoosterFilterType } from '../../types/card';
import { SegmentedControl } from '../ui/SegmentedControl';

interface BoosterFilterProps {
  value: BoosterFilterType;
  onChange: (filter: BoosterFilterType) => void;
  isLoading?: boolean;
}

const OPTIONS: { id: BoosterFilterType; label: string; title: string }[] = [
  { id: 'all', label: 'All', title: 'Show all boosters' },
  { id: 'play', label: 'Play', title: 'Show only Play Booster cards' },
  { id: 'collector', label: 'Collector', title: 'Show only Collector Booster cards' },
];

export function BoosterFilter({ value, onChange, isLoading }: BoosterFilterProps) {
  return (
    <div className={isLoading ? 'opacity-50 pointer-events-none' : undefined}>
      <SegmentedControl options={OPTIONS} value={value} onChange={onChange} />
    </div>
  );
}
