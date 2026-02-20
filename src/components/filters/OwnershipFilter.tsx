import type { OwnershipFilter as OwnershipFilterType } from '../../types/card';

interface OwnershipFilterProps {
  value: OwnershipFilterType;
  onChange: (filter: OwnershipFilterType) => void;
}

const OPTIONS: { id: OwnershipFilterType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'owned', label: 'Owned' },
  { id: 'missing', label: 'Missing' },
];

export function OwnershipFilter({ value, onChange }: OwnershipFilterProps) {
  return (
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
  );
}
