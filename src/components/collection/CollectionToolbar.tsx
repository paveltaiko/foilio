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
  activeFilterCount: number;
  hasActiveFilters: boolean;
  onReset: () => void;
  onFilterDrawerOpen: () => void;
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
  activeFilterCount?: never;
  hasActiveFilters?: never;
  onReset?: never;
  onFilterDrawerOpen?: never;
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
} & (WriteProps | ReadOnlyProps);

export function CollectionToolbar({
  activeTab,
  sortOption,
  onSortChange,
  ownershipFilter,
  onOwnershipChange,
  groupBySet,
  onGroupBySetToggle,
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
    <div className="pt-3 pb-4 md:pt-8 md:pb-10 space-y-2">
      {/* Mobile toolbar */}
      <div className="flex items-center justify-between gap-2 md:hidden">
        <div className="flex items-center gap-2">
          {readOnly ? (
            <OwnershipFilterControl value={ownershipFilter} onChange={onOwnershipChange} />
          ) : (
            <>
              <button
                type="button"
                onClick={(rest as WriteProps).onFilterDrawerOpen}
                title="Open filters"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-600 bg-white border border-surface-border rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filters</span>
                {(rest as WriteProps).activeFilterCount > 0 && (
                  <span className="flex items-center justify-center w-5 h-5 text-[11px] font-bold bg-primary-500 text-white rounded-full">
                    {(rest as WriteProps).activeFilterCount}
                  </span>
                )}
              </button>
              {(rest as WriteProps).hasActiveFilters && (
                <IconButton onClick={(rest as WriteProps).onReset} title="Reset filters">
                  <RotateCcw className="w-4 h-4" />
                </IconButton>
              )}
            </>
          )}
        </div>
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
          {readOnly ? (
            <SortControl value={sortOption} onChange={onSortChange} />
          ) : (
            shareButton
          )}
        </div>
      </div>

      {/* Desktop toolbar */}
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
        {showGroupBySet && (
          <IconButton
            onClick={onGroupBySetToggle}
            title={groupBySet ? 'Show all at once' : 'Group by set'}
            active={groupBySet}
          >
            {groupBySet ? <Layers className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
          </IconButton>
        )}
        {!readOnly && (rest as WriteProps).hasActiveFilters && (
          <IconButton onClick={(rest as WriteProps).onReset} title="Reset filters">
            <RotateCcw className="w-4 h-4" />
          </IconButton>
        )}
        {shareButton}
      </div>
    </div>
  );
}
