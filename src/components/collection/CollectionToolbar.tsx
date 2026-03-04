import { Layers, LayoutGrid, SlidersHorizontal, RotateCcw } from 'lucide-react';
import type { User } from 'firebase/auth';
import type { SortOption, OwnershipFilter, BoosterFilter } from '../../types/card';
import { isFirebaseConfigured } from '../../config/firebase';
import { SortControl } from '../filters/SortControl';
import { OwnershipFilter as OwnershipFilterControl } from '../filters/OwnershipFilter';
import { BoosterFilter as BoosterFilterControl } from '../filters/BoosterFilter';
import { ShareCollectionButton } from './ShareCollectionButton';
import type { ShareToastType } from './ShareCollectionButton';
import { IconButton } from '../ui/IconButton';

type WriteProps = {
  readOnly?: false;
  user: User;
  isSLMode: boolean;
  boosterFilter: BoosterFilter;
  onBoosterChange: (v: BoosterFilter) => void;
  boosterMapLoading: boolean;
  hasBoosterData: boolean;
  onTokenReady: (token: string) => void;
  onShareFeedback: (message: string, type: ShareToastType) => void;
};

type ReadOnlyProps = {
  readOnly: true;
  user?: never;
  isSLMode?: never;
  boosterFilter?: never;
  onBoosterChange?: never;
  boosterMapLoading?: never;
  hasBoosterData?: never;
  onTokenReady?: never;
  onShareFeedback?: never;
};

type CollectionToolbarProps = {
  activeTab: string;
  sortOption: SortOption;
  onSortChange: (v: SortOption) => void;
  ownershipFilter: OwnershipFilter;
  onOwnershipChange: (v: OwnershipFilter) => void;
  groupBySet: boolean;
  onGroupBySetToggle: () => void;
  activeFilterCount: number;
  hasActiveFilters: boolean;
  onReset: () => void;
  onFilterDrawerOpen: () => void;
} & (WriteProps | ReadOnlyProps);

export function CollectionToolbar({
  activeTab,
  sortOption,
  onSortChange,
  ownershipFilter,
  onOwnershipChange,
  groupBySet,
  onGroupBySetToggle,
  activeFilterCount,
  hasActiveFilters,
  onReset,
  onFilterDrawerOpen,
  readOnly = false,
  ...rest
}: CollectionToolbarProps) {
  const isSLMode = readOnly ? false : (rest as WriteProps).isSLMode;
  const showGroupBySet = !isSLMode && activeTab === 'all';
  const showBoosterFilter = !readOnly && !isSLMode && (rest as WriteProps).hasBoosterData;

  const shareButton = !readOnly && isFirebaseConfigured ? (
    <ShareCollectionButton
      user={(rest as WriteProps).user}
      onTokenReady={(rest as WriteProps).onTokenReady}
      onFeedback={(rest as WriteProps).onShareFeedback}
    />
  ) : null;

  return (
    <div className="pt-3 pb-4 md:pt-8 md:pb-10">
      <div className="flex items-center justify-between gap-2">
        {/* Left side: filters */}
        <div className="flex items-center gap-2">
          {/* Mobile: drawer button */}
          <button
            type="button"
            onClick={onFilterDrawerOpen}
            title="Open filters"
            className="flex md:hidden items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-600 bg-white border border-surface-border rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="flex items-center justify-center w-5 h-5 text-[11px] font-bold bg-primary-500 text-white rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
          {/* Desktop: inline filters */}
          <div className="hidden md:flex items-center gap-4">
            <OwnershipFilterControl value={ownershipFilter} onChange={onOwnershipChange} />
            <SortControl value={sortOption} onChange={onSortChange} />
            {showBoosterFilter && (
              <BoosterFilterControl
                value={(rest as WriteProps).boosterFilter}
                onChange={(rest as WriteProps).onBoosterChange}
                isLoading={(rest as WriteProps).boosterMapLoading}
              />
            )}
          </div>
          {hasActiveFilters && (
            <IconButton onClick={onReset} title="Reset filters">
              <RotateCcw className="w-4 h-4" />
            </IconButton>
          )}
        </div>
        {/* Right side: actions */}
        <div className="flex items-center gap-2">
          {showGroupBySet && (
            <IconButton
              onClick={onGroupBySetToggle}
              title={groupBySet ? 'Show all at once' : 'Group by set'}
              active={groupBySet}
            >
              {groupBySet ? <Layers className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
            </IconButton>
          )}
          {!readOnly && shareButton}
        </div>
      </div>
    </div>
  );
}
