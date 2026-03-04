import { Modal } from '../ui/Modal';
import { SegmentedControl } from '../ui/SegmentedControl';
import type { BoosterFilter, OwnershipFilter, SortOption } from '../../types/card';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  boosterFilter?: BoosterFilter;
  onBoosterChange?: (v: BoosterFilter) => void;
  ownershipFilter: OwnershipFilter;
  onOwnershipChange: (v: OwnershipFilter) => void;
  sortOption: SortOption;
  onSortChange: (v: SortOption) => void;
  boosterMapLoading?: boolean;
  showBoosterFilter?: boolean;
  hasActiveFilters?: boolean;
  onReset?: () => void;
}

function SectionLabel({ children }: { children: string }) {
  return <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">{children}</p>;
}

const OWNERSHIP_OPTIONS: { id: OwnershipFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'owned', label: 'Owned' },
  { id: 'missing', label: 'Missing' },
];

const BOOSTER_OPTIONS: { id: BoosterFilter; label: string }[] = [
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
  showBoosterFilter = true,
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
  const numberLabel = `Number ${sortOption === 'number-desc' ? '↓' : '↑'}`;
  const priceLabel = `Price ${sortOption === 'price-desc' ? '↓' : '↑'}`;

  const sortOptions: { id: 'number' | 'price'; label: string }[] = [
    { id: 'number', label: numberLabel },
    { id: 'price', label: priceLabel },
  ];
  const activeSortGroup = isNumberActive ? 'number' as const : 'price' as const;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-5">
        <h2 className="text-base font-semibold text-neutral-900">Filters</h2>

        <div className="space-y-2">
          <SectionLabel>Ownership</SectionLabel>
          <SegmentedControl
            options={OWNERSHIP_OPTIONS}
            value={ownershipFilter}
            onChange={onOwnershipChange}
            fullWidth
          />
        </div>

        <div className="space-y-2">
          <SectionLabel>Sort by</SectionLabel>
          <SegmentedControl
            options={sortOptions}
            value={activeSortGroup}
            onChange={handleSortClick}
            fullWidth
          />
        </div>

        {showBoosterFilter && boosterFilter !== undefined && onBoosterChange && (
          <div className="space-y-2">
            <SectionLabel>Booster</SectionLabel>
            <SegmentedControl
              options={BOOSTER_OPTIONS}
              value={boosterFilter}
              onChange={onBoosterChange}
              fullWidth
              disabled={boosterMapLoading}
            />
          </div>
        )}

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
