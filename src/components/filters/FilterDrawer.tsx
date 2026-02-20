import { Modal } from '../ui/Modal';
import type { BoosterFilter, OwnershipFilter, SortOption } from '../../types/card';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  boosterFilter: BoosterFilter;
  onBoosterChange: (v: BoosterFilter) => void;
  ownershipFilter: OwnershipFilter;
  onOwnershipChange: (v: OwnershipFilter) => void;
  sortOption: SortOption;
  onSortChange: (v: SortOption) => void;
  boosterMapLoading?: boolean;
  hasActiveFilters?: boolean;
  onReset?: () => void;
}

interface SegmentedOption<T extends string> {
  id: T;
  label: string;
}

interface DrawerSegmentedProps<T extends string> {
  label: string;
  options: SegmentedOption<T>[];
  value: T;
  onChange: (v: T) => void;
  disabled?: boolean;
}

function DrawerSegmented<T extends string>({ label, options, value, onChange, disabled }: DrawerSegmentedProps<T>) {
  return (
    <div className="space-y-2">
      {label && <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">{label}</p>}
      <div className={`flex text-sm ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`
              flex-1 px-3 py-2 font-medium transition-colors duration-150 cursor-pointer relative
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

const OWNERSHIP_OPTIONS: SegmentedOption<OwnershipFilter>[] = [
  { id: 'all', label: 'All' },
  { id: 'owned', label: 'Owned' },
  { id: 'missing', label: 'Missing' },
];

const BOOSTER_OPTIONS: SegmentedOption<BoosterFilter>[] = [
  { id: 'all', label: 'All' },
  { id: 'play', label: 'Play' },
  { id: 'collector', label: 'Collector' },
];

export function FilterDrawer({
  isOpen,
  onClose,
  boosterFilter,
  onBoosterChange,
  ownershipFilter,
  onOwnershipChange,
  sortOption,
  onSortChange,
  boosterMapLoading,
  hasActiveFilters,
  onReset,
}: FilterDrawerProps) {
  const handleSortClick = (group: 'number' | 'price') => {
    if (group === 'number') {
      onSortChange(sortOption === 'number-asc' ? 'number-desc' : 'number-asc');
    } else {
      onSortChange(sortOption === 'price-asc' ? 'price-desc' : 'price-asc');
    }
  };

  const isNumberActive = sortOption === 'number-asc' || sortOption === 'number-desc';
  const isPriceActive = sortOption === 'price-asc' || sortOption === 'price-desc';
  const numberLabel = `Number ${sortOption === 'number-desc' ? '↓' : '↑'}`;
  const priceLabel = `Price ${sortOption === 'price-desc' ? '↓' : '↑'}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-5">
        <h2 className="text-base font-semibold text-neutral-900">Filters</h2>

        <DrawerSegmented
          label="Ownership"
          options={OWNERSHIP_OPTIONS}
          value={ownershipFilter}
          onChange={onOwnershipChange}
        />

        <div className="space-y-2">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Sort by</p>
          <div className="flex text-sm">
            {([
              { group: 'number' as const, label: numberLabel, active: isNumberActive },
              { group: 'price' as const, label: priceLabel, active: isPriceActive },
            ]).map((item) => (
              <button
                key={item.group}
                type="button"
                onClick={() => handleSortClick(item.group)}
                className={`
                  flex-1 px-3 py-2 font-medium transition-colors duration-150 cursor-pointer relative
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
        </div>

        <DrawerSegmented
          label="Booster"
          options={BOOSTER_OPTIONS}
          value={boosterFilter}
          onChange={onBoosterChange}
          disabled={boosterMapLoading}
        />

        <button
          type="button"
          onClick={onReset}
          disabled={!hasActiveFilters}
          className={`w-full py-3 text-sm font-medium rounded-lg transition-colors ${
            hasActiveFilters
              ? 'bg-neutral-800 text-white hover:bg-neutral-900 cursor-pointer'
              : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
          }`}
        >
          Reset filters
        </button>
      </div>
    </Modal>
  );
}
