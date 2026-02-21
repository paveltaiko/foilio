import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Layers, LayoutGrid } from 'lucide-react';
import { useSharedCollection } from '../hooks/useSharedCollection';
import { useCardCollection } from '../hooks/useCardCollection';
import { SetTabs } from '../components/filters/SetTabs';
import { SortControl } from '../components/filters/SortControl';
import { OwnershipFilter } from '../components/filters/OwnershipFilter';
import { SearchInput } from '../components/filters/SearchInput';
import { CollectionSummary } from '../components/stats/CollectionSummary';
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
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  // Fetch shared collection
  const { ownedCards, ownerUserId, profile, loading: collectionLoading, error, refresh } = useSharedCollection(token);

  useEffect(() => {
    if (ownerUserId && currentUserId && ownerUserId === currentUserId) {
      navigate('/', { replace: true });
    }
  }, [ownerUserId, currentUserId, navigate]);

  const {
    activeSet, setActiveSet,
    sortOption, setSortOption,
    ownershipFilter, setOwnershipFilter,
    selectedCard, setSelectedCard,
    groupBySet, setGroupBySet,
    isCardsLoading, cardCounts, stats, sortedFilteredCards, visibleCards,
    isFetchingNextPage, hasNextPage, loadNextPage, loadMoreError, isCompletingSearch,
    isComputingTotalValue,
    refreshCards,
  } = useCardCollection({ ownedCards, searchQuery, sets: collectionSets });

  const isLoading = collectionLoading || isCardsLoading;
  const handleRefresh = async () => {
    refresh();
    refreshCards();
  };

  // No-op toggle for read-only mode
  const noop = () => {};

  if (error) {
    return (
      <div className="app-container py-16 text-center">
        <p className="text-neutral-500 text-sm">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 text-sm text-primary-500 hover:text-primary-600 transition-colors cursor-pointer"
        >
          Back to home
        </button>
      </div>
    );
  }

  return (
    <>
      <PullToRefresh onRefresh={handleRefresh} disabled={isSearchOpen || !!selectedCard}>
        <div className="app-container-padded safe-bottom touch-pan-y">
          {/* Owner banner */}
          <div className="flex items-center gap-3 py-4">
            <button
              onClick={() => navigate('/')}
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
          <SetTabs activeSet={activeSet} onChange={setActiveSet} sets={collectionSets} cardCounts={cardCounts} />

          {/* Stats */}
          <div className="py-4">
            <CollectionSummary
              totalCards={stats.totalCards}
              ownedCount={stats.ownedCount}
              totalValue={stats.totalValue}
              percentage={stats.percentage}
            />
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between gap-2 sm:gap-3 pb-4">
            <OwnershipFilter value={ownershipFilter} onChange={setOwnershipFilter} />
            <div className="flex items-center gap-4">
              {activeSet === 'all' && (
                <button
                  onClick={() => setGroupBySet(!groupBySet)}
                  className={`cursor-pointer transition-colors duration-150 ${
                    groupBySet ? 'text-primary-500' : 'text-neutral-400 hover:text-neutral-600'
                  }`}
                  title={groupBySet ? 'Show all at once' : 'Group by set'}
                >
                  {groupBySet ? <Layers className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
                </button>
              )}
              <SortControl value={sortOption} onChange={setSortOption} />
            </div>
          </div>

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
