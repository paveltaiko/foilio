import type { User } from 'firebase/auth';
import { useOwnedCards } from '../hooks/useOwnedCards';
import { useUnifiedCollection } from '../hooks/useUnifiedCollection';
import { useShareCollection } from '../hooks/useShareCollection';
import { useCardOwnershipHandlers } from '../hooks/useCardOwnershipHandlers';
import { collectionSets } from '../config/collections';
import { FilterDrawer } from '../components/filters/FilterDrawer';
import { CardGrid, CardGridSkeleton } from '../components/cards/CardGrid';
import { CardDetail } from '../components/cards/CardDetail';
import { PullToRefresh } from '../components/ui/PullToRefresh';
import { Tabs } from '../components/ui/Tabs';
import { CollectionToolbar } from '../components/collection/CollectionToolbar';
import { CollectionEmptyState } from '../components/collection/CollectionEmptyState';
import { ShareFeedbackToast } from '../components/collection/ShareFeedbackToast';

interface CollectionPageProps {
  user: User;
  isSearchOpen: boolean;
  searchQuery: string;
}

export function CollectionPage({ user, isSearchOpen, searchQuery }: CollectionPageProps) {
  const { ownedCards, updateLocal } = useOwnedCards(user.uid);

  const collection = useUnifiedCollection({ ownedCards, searchQuery });
  const share = useShareCollection(user.uid, collection.visibleSetIds);
  const { handleToggle, handleQuantityChange } = useCardOwnershipHandlers({
    userId: user.uid,
    ownedCards,
    shareToken: share.shareToken,
    updateLocal,
  });

  const {
    activeTab, setActiveTab, isSLMode, isAllTab,
    selectedCard, setSelectedCard, selectedVariant, setSelectedVariant,
    isFilterDrawerOpen, setIsFilterDrawerOpen,
    activeSortOption, setActiveSortOption,
    activeOwnershipFilter, setActiveOwnershipFilter,
    boosterFilter, setBoosterFilter, boosterMapLoading, hasBoosterData,
    groupBySet, setGroupBySet,
    activeFilterCount, hasActiveFilters, handleResetFilters,
    sortedFilteredCards, visibleCards, isCardsLoading, gridKey,
    allTabs,
    hasNextPage, loadNextPage, isFetchingNextPage, loadMoreError,
    isCompletingSearch, isComputingTotalValue,
    handleRefresh, noCollectionSelected,
  } = collection;

  return (
    <>
      <PullToRefresh onRefresh={handleRefresh} disabled={isSearchOpen || !!selectedCard || isFilterDrawerOpen}>
        <div className="app-container-padded safe-bottom touch-pan-y">
          {/* Unified tabs — UB sety + enabled SL dropy */}
          <Tabs
            tabs={allTabs}
            activeTab={activeTab}
            onChange={setActiveTab}
          />

          {/* Toolbar */}
          <CollectionToolbar
            user={user}
            isSLMode={isSLMode}
            activeTab={activeTab}
            sortOption={activeSortOption}
            onSortChange={setActiveSortOption}
            ownershipFilter={activeOwnershipFilter}
            onOwnershipChange={setActiveOwnershipFilter}
            boosterFilter={boosterFilter}
            onBoosterChange={setBoosterFilter}
            boosterMapLoading={boosterMapLoading}
            hasBoosterData={hasBoosterData}
            groupBySet={groupBySet}
            onGroupBySetToggle={setGroupBySet}
            activeFilterCount={activeFilterCount}
            hasActiveFilters={hasActiveFilters}
            onReset={handleResetFilters}
            onFilterDrawerOpen={() => setIsFilterDrawerOpen(true)}
            onTokenReady={share.setShareToken}
            onShareFeedback={share.showShareToast}
          />

          {/* Card grid */}
          {isCardsLoading ? (
            <CardGridSkeleton />
          ) : noCollectionSelected ? (
            <CollectionEmptyState gridKey={gridKey} />
          ) : (
            <div key={gridKey} className="animate-fade-in space-y-3">
              {!isSLMode && (isCompletingSearch || isFetchingNextPage || isComputingTotalValue) && (
                <p className="text-xs text-neutral-500">
                  {isComputingTotalValue
                    ? 'Calculating total collection value…'
                    : isCompletingSearch
                      ? 'Searching through remaining cards…'
                      : 'Loading more cards…'}
                </p>
              )}
              <CardGrid
                cards={visibleCards}
                ownedCards={ownedCards}
                onToggle={handleToggle}
                onCardClick={(card, variant) => {
                  setSelectedCard(card);
                  setSelectedVariant(variant);
                }}
                groupBySet={!isSLMode && isAllTab && groupBySet && searchQuery.trim().length === 0}
                sets={collectionSets}
                onLoadMore={loadNextPage}
                hasMore={hasNextPage}
                isLoadingMore={isFetchingNextPage}
                loadMoreError={loadMoreError}
              />
            </div>
          )}
        </div>
      </PullToRefresh>

      {/* Mobile filter drawer */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        boosterFilter={boosterFilter}
        onBoosterChange={setBoosterFilter}
        ownershipFilter={activeOwnershipFilter}
        onOwnershipChange={setActiveOwnershipFilter}
        sortOption={activeSortOption}
        onSortChange={setActiveSortOption}
        boosterMapLoading={boosterMapLoading}
        showBoosterFilter={!isSLMode && hasBoosterData}
        hasActiveFilters={hasActiveFilters}
        onReset={handleResetFilters}
      />

      {/* Card detail modal */}
      <CardDetail
        card={selectedCard}
        selectedVariant={selectedVariant}
        owned={selectedCard ? ownedCards.get(selectedCard.id) : undefined}
        onClose={() => {
          setSelectedCard(null);
          setSelectedVariant(null);
        }}
        onToggle={handleToggle}
        onQuantityChange={handleQuantityChange}
        cards={sortedFilteredCards}
        onNavigate={(card, variant) => {
          setSelectedCard(card);
          setSelectedVariant(variant);
        }}
      />

      <ShareFeedbackToast message={share.shareToastMessage} type={share.shareToastType} />
    </>
  );
}
