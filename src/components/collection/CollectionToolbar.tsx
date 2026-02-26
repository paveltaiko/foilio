import { Layers, LayoutGrid, SlidersHorizontal, RotateCcw } from 'lucide-react';
import type { User } from 'firebase/auth';
import type { SortOption, OwnershipFilter, BoosterFilter } from '../../types/card';
import { isFirebaseConfigured } from '../../config/firebase';
import { SortControl } from '../filters/SortControl';
import { OwnershipFilter as OwnershipFilterControl } from '../filters/OwnershipFilter';
import { BoosterFilter as BoosterFilterControl } from '../filters/BoosterFilter';
import { ShareCollectionButton } from './ShareCollectionButton';
import type { ShareToastType } from './ShareCollectionButton';

interface CollectionToolbarProps {
  user: User;
  isSLMode: boolean;
  activeTab: string;
  sortOption: SortOption;
  onSortChange: (v: SortOption) => void;
  ownershipFilter: OwnershipFilter;
  onOwnershipChange: (v: OwnershipFilter) => void;
  boosterFilter: BoosterFilter;
  onBoosterChange: (v: BoosterFilter) => void;
  boosterMapLoading: boolean;
  hasBoosterData: boolean;
  groupBySet: boolean;
  onGroupBySetToggle: () => void;
  activeFilterCount: number;
  hasActiveFilters: boolean;
  onReset: () => void;
  onFilterDrawerOpen: () => void;
  onTokenReady: (token: string) => void;
  onShareFeedback: (message: string, type: ShareToastType) => void;
}

export function CollectionToolbar({
  user,
  isSLMode,
  activeTab,
  sortOption,
  onSortChange,
  ownershipFilter,
  onOwnershipChange,
  boosterFilter,
  onBoosterChange,
  boosterMapLoading,
  hasBoosterData,
  groupBySet,
  onGroupBySetToggle,
  activeFilterCount,
  hasActiveFilters,
  onReset,
  onFilterDrawerOpen,
  onTokenReady,
  onShareFeedback,
}: CollectionToolbarProps) {
  const showGroupBySet = !isSLMode && activeTab === 'all';
  const showBoosterFilter = !isSLMode && hasBoosterData;

  const shareButton = isFirebaseConfigured ? (
    <ShareCollectionButton
      user={user}
      onTokenReady={onTokenReady}
      onFeedback={onShareFeedback}
    />
  ) : null;

  const resetButton = hasActiveFilters ? (
    <button
      type="button"
      onClick={onReset}
      title="Reset filters"
      className="flex items-center justify-center cursor-pointer transition-colors duration-150 border rounded-lg bg-white text-neutral-500 border-surface-border hover:text-neutral-700 hover:bg-neutral-50"
    >
      <RotateCcw className="w-4 h-4" />
    </button>
  ) : null;

  return (
    <div className="pt-7 pb-4 space-y-2">
      {/* Mobile toolbar */}
      <div className="flex items-center justify-between gap-2 md:hidden">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onFilterDrawerOpen}
            title="Open filters"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-600 bg-white border border-surface-border rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="flex items-center justify-center w-5 h-5 text-[11px] font-bold bg-primary-500 text-white rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              title="Reset filters"
              className="flex items-center justify-center h-[38px] w-[38px] cursor-pointer transition-colors duration-150 border rounded-lg bg-white text-neutral-500 border-surface-border hover:text-neutral-700 hover:bg-neutral-50"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {showGroupBySet && (
            <button
              onClick={onGroupBySetToggle}
              title={groupBySet ? 'Show all at once' : 'Group by set'}
              className={`
                flex items-center justify-center h-[38px] w-[38px] cursor-pointer transition-colors duration-150
                border rounded-lg
                ${groupBySet
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'bg-white text-neutral-500 border-neutral-200 hover:text-neutral-700 hover:bg-neutral-50'
                }
              `}
            >
              {groupBySet ? <Layers className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
            </button>
          )}
          {shareButton}
        </div>
      </div>

      {/* Desktop toolbar */}
      <div className="hidden md:flex items-center gap-4">
        <OwnershipFilterControl value={ownershipFilter} onChange={onOwnershipChange} />
        <SortControl value={sortOption} onChange={onSortChange} />
        {showBoosterFilter && (
          <BoosterFilterControl
            value={boosterFilter}
            onChange={onBoosterChange}
            isLoading={boosterMapLoading}
          />
        )}
        {showGroupBySet && (
          <button
            onClick={onGroupBySetToggle}
            title={groupBySet ? 'Show all at once' : 'Group by set'}
            className={`
              p-2 cursor-pointer transition-colors duration-150 relative
              border rounded-lg text-sm font-medium
              ${groupBySet
                ? 'bg-primary-500 text-white border-primary-500 z-10'
                : 'bg-white text-neutral-500 border-neutral-200 hover:text-neutral-700 hover:bg-neutral-50 z-0'
              }
            `}
          >
            {groupBySet ? <Layers className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
          </button>
        )}
        {resetButton && (
          <button
            type="button"
            onClick={onReset}
            title="Reset filters"
            className="p-2 cursor-pointer transition-colors duration-150 border rounded-lg text-sm font-medium bg-white text-neutral-500 border-neutral-200 hover:text-neutral-700 hover:bg-neutral-50"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
        {shareButton}
      </div>
    </div>
  );
}
