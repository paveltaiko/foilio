import type { SortOption } from '../../types/card';

interface SortControlProps {
  value: SortOption;
  onChange: (sort: SortOption) => void;
}

type SortGroup = 'number' | 'price';

export function SortControl({ value, onChange }: SortControlProps) {
  const handleClick = (group: SortGroup) => {
    if (group === 'number') {
      if (value === 'number-asc') {
        onChange('number-desc');
      } else if (value === 'number-desc') {
        onChange('number-asc');
      } else {
        onChange('number-asc');
      }
    } else {
      if (value === 'price-asc') {
        onChange('price-desc');
      } else if (value === 'price-desc') {
        onChange('price-asc');
      } else {
        onChange('price-asc');
      }
    }
  };

  const isNumberActive = value === 'number-asc' || value === 'number-desc';
  const isPriceActive = value === 'price-asc' || value === 'price-desc';
  const numberArrow = value === 'number-asc' ? '↑' : '↓';
  const priceArrow = value === 'price-asc' ? '↑' : '↓';

  return (
    <div className="flex items-center text-sm gap-4">
      <button
        onClick={() => handleClick('number')}
        className={`
          cursor-pointer transition-colors duration-150
          ${isNumberActive
            ? 'text-primary-500 font-bold'
            : 'text-neutral-400 hover:text-neutral-600'
          }
        `}
      >
        Číslo {isNumberActive && numberArrow}
      </button>
      <button
        onClick={() => handleClick('price')}
        className={`
          cursor-pointer transition-colors duration-150
          ${isPriceActive
            ? 'text-primary-500 font-bold'
            : 'text-neutral-400 hover:text-neutral-600'
          }
        `}
      >
        Cena {isPriceActive && priceArrow}
      </button>
    </div>
  );
}
