import type { BoosterFilter as BoosterFilterType } from '../../types/card';

interface BoosterFilterProps {
  value: BoosterFilterType;
  onChange: (filter: BoosterFilterType) => void;
  isLoading?: boolean;
}

const OPTIONS: { id: BoosterFilterType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'play', label: 'Play' },
  { id: 'collector', label: 'Collector' },
];

export function BoosterFilter({ value, onChange, isLoading }: BoosterFilterProps) {
  return (
    <div className={`flex items-center ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex text-sm">
        {OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`
              px-4 py-1.5 font-medium transition-colors duration-150 cursor-pointer relative
              border first:rounded-l-lg last:rounded-r-lg -ml-px first:ml-0
              ${value === option.id
                ? 'bg-primary-500 text-white border-primary-500 z-10'
                : 'bg-white text-neutral-500 border-neutral-200 hover:text-neutral-700 hover:bg-neutral-50 z-0'
              }
            `}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
