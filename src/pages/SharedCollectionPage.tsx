import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { useSharedCollection } from '../hooks/useSharedCollection';
import { useCardCollection } from '../hooks/useCardCollection';
import { SetTabs } from '../components/filters/SetTabs';
import { CollectionToolbar } from '../components/collection/CollectionToolbar';
import { FilterDrawer } from '../components/filters/FilterDrawer';
import { SearchInput } from '../components/filters/SearchInput';
import { CardGrid, CardGridSkeleton } from '../components/cards/CardGrid';
import { CardDetail } from '../components/cards/CardDetail';
import { PullToRefresh } from '../components/ui/PullToRefresh';
import type { CardVariant } from '../types/card';
import { collectionSets } from '../config/collections';

interface SharedCollectionPageProps {
  currentUserId: string | null;
  isSearchOpen: boolean;
  onSearchClose: () => void;
}

export function SharedCollectionPage({ currentUserId, isSearchOpen, onSearchClose }: SharedCollectionPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVariant, setSelectedVariant] = useState<CardVariant>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const { ownedCards, ownerUserId, profile, visibleSetIds, loading: collectionLoading, error, refresh } = useSharedCollection(token);

  useEffect(() => {
    if (ownerUserId && currentUserId && ownerUserId === currentUserId) {
      navigate('/', { replace: true });
    }
  }, [ownerUserId, currentUserId, navigate]);

  const visibleSets = useMemo(() => {
    if (collectionLoading || visibleSetIds === undefined) return collectionSets;
    const allowed = new Set(visibleSetIds);
    return collectionSets.filter((s) => allowed.has(s.id));
  }, [collectionLoading, visibleSetIds]);

  const {
    activeSet, setActiveSet,
    sortOption, setSortOption,
    ownershipFilter, setOwnershipFilter,
    selectedCard, setSelectedCard,
    groupBySet, setGroupBySet,
    isCardsLoading, cardCounts, sortedFilteredCards, visibleCards,
    isFetchingNextPage, hasNextPage, loadNextPage, loadMoreError, isCompletingSearch,
    isComputingTotalValue,
    refreshCards,
  } = useCardCollection({ ownedCards, searchQuery, sets: visibleSets });

  const isLoading = collectionLoading || isCardsLoading;
  const hasActiveFilters = ownershipFilter !== 'all' || sortOption !== 'number-asc';
  const activeFilterCount = ownershipFilter !== 'all' ? 1 : 0;

  const handleRefresh = async () => {
    refresh();
    refreshCards();
  };

  const handleResetFilters = () => {
    setOwnershipFilter('all');
    setSortOption('number-asc');
  };

  const noop = () => {};

  if (error) {
    return (
      <div className="app-container py-16 text-center">
        <p className="text-neutral-500 text-sm">{error}</p>
        <button
          onClick={() => navigate('/collection')}
          className="mt-4 text-sm text-primary-500 hover:text-primary-600 transition-colors cursor-pointer"
        >
          Back to home
        </button>
      </div>
    );
  }

  return (
    <>
      <PullToRefresh onRefresh={handleRefresh} disabled={isSearchOpen || !!selectedCard || isFilterDrawerOpen}>
        <div className="app-container-padded safe-bottom touch-pan-y">
          {/* Owner banner */}
          <div className="flex items-center gap-3 py-4">
            <button
              onClick={() => navigate('/collection')}
              className="text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            {profile?.photoURL && (
              <img
                src={profile.photoURL}
                alt={profile.displayName}
                className="w-8 h-8 rounded-full"
                referrerPolicy="no-referrer"
              />
            )}
            <div>
              <p className="text-sm font-semibold text-neutral-800">
                {profile?.displayName ?? 'Loading...'}
              </p>
              <p className="text-xs text-neutral-400">Shared collection</p>
            </div>
          </div>

          {/* Set tabs */}
          <SetTabs activeSet={activeSet} onChange={setActiveSet} sets={visibleSets} cardCounts={cardCounts} />

          {/* Toolbar */}
          <CollectionToolbar
            readOnly
            activeTab={activeSet}
            sortOption={sortOption}
            onSortChange={setSortOption}
            ownershipFilter={ownershipFilter}
            onOwnershipChange={setOwnershipFilter}
            groupBySet={groupBySet}
            onGroupBySetToggle={() => setGroupBySet(!groupBySet)}
            activeFilterCount={activeFilterCount}
            hasActiveFilters={hasActiveFilters}
            onReset={handleResetFilters}
            onFilterDrawerOpen={() => setIsFilterDrawerOpen(true)}
          />

          {/* Card grid */}
          {isLoading ? (
            <CardGridSkeleton />
          ) : (
            <div className="space-y-3">
              {(isCompletingSearch || isFetchingNextPage || isComputingTotalValue) && (
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
                onToggle={noop}
                onCardClick={(card, variant) => {
                  setSelectedCard(card);
                  setSelectedVariant(variant);
                }}
                readOnly
                groupBySet={activeSet === 'all' && groupBySet && searchQuery.trim().length === 0}
                sets={visibleSets}
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
        ownershipFilter={ownershipFilter}
        onOwnershipChange={setOwnershipFilter}
        sortOption={sortOption}
        onSortChange={setSortOption}
        showBoosterFilter={false}
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
        onToggle={noop}
        cards={sortedFilteredCards}
        onNavigate={(card, variant) => {
          setSelectedCard(card);
          setSelectedVariant(variant);
        }}
        readOnly
      />

      {/* Search overlay */}
      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        isOpen={isSearchOpen}
        onClose={onSearchClose}
      />
    </>
  );
}
