import type { SortOption } from '../../types/card';
import { SegmentedControl } from '../ui/SegmentedControl';

interface SortControlProps {
  value: SortOption;
  onChange: (sort: SortOption) => void;
}

type SortGroup = 'number' | 'price';

export function SortControl({ value, onChange }: SortControlProps) {
  const handleClick = (group: SortGroup) => {
    if (group === 'number') {
      if (value === 'number-asc') onChange('number-desc');
      else onChange('number-asc');
    } else {
      if (value === 'price-asc') onChange('price-desc');
      else onChange('price-asc');
    }
  };

  const isPriceActive = value === 'price-asc' || value === 'price-desc';
  const numberLabel = `Number ${value === 'number-asc' ? '↑' : value === 'number-desc' ? '↓' : '↑'}`;
  const priceLabel = `Price ${value === 'price-asc' ? '↑' : value === 'price-desc' ? '↓' : '↑'}`;

  const activeGroup: SortGroup = isPriceActive ? 'price' : 'number';

  const options: { id: SortGroup; label: string; title: string }[] = [
    { id: 'number', label: numberLabel, title: 'Sort by collector number' },
    { id: 'price', label: priceLabel, title: 'Sort by price' },
  ];

  return (
    <SegmentedControl
      options={options}
      value={activeGroup}
      onChange={handleClick}
    />
  );
}
