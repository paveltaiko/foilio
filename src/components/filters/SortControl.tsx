import type { SortOption } from '../../types/card';

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

  const isNumberActive = value === 'number-asc' || value === 'number-desc';
  const isPriceActive = value === 'price-asc' || value === 'price-desc';
  const numberLabel = `Number ${value === 'number-asc' ? '↑' : value === 'number-desc' ? '↓' : '↑'}`;
  const priceLabel = `Price ${value === 'price-asc' ? '↑' : value === 'price-desc' ? '↓' : '↑'}`;

  return (
    <div className="flex text-sm">
      {([
        { group: 'number' as SortGroup, label: numberLabel, active: isNumberActive },
        { group: 'price' as SortGroup, label: priceLabel, active: isPriceActive },
      ]).map((item) => (
        <button
          key={item.group}
          type="button"
          onClick={() => handleClick(item.group)}
          className={`
            px-4 py-1.5 font-medium transition-colors duration-150 cursor-pointer relative
            border first:rounded-l-lg last:rounded-r-lg -ml-px first:ml-0
            ${item.active
              ? 'bg-primary-500 text-white border-primary-500 z-10'
              : 'bg-white text-neutral-500 border-neutral-200 hover:text-neutral-700 hover:bg-neutral-50 z-0'
            }
          `}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
