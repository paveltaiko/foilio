import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Layers, LayoutGrid } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
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

interface SharedCollectionPageProps {
  currentUserId: string | null;
  isSearchOpen: boolean;
  onSearchClose: () => void;
}

export function SharedCollectionPage({ currentUserId, isSearchOpen, onSearchClose }: SharedCollectionPageProps) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
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
    isCardsLoading, cardCounts, stats, sortedFilteredCards,
  } = useCardCollection({ ownedCards, searchQuery });

  const isLoading = collectionLoading || isCardsLoading;
  const handleRefresh = async () => {
    refresh();
    await queryClient.refetchQueries({
      queryKey: ['scryfall-cards'],
      type: 'active',
    });
  };

  // No-op toggle for read-only mode
  const noop = () => {};

  if (error) {
    return (
      <div className="max-w-6xl mx-auto py-16 text-center">
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
    <PullToRefresh onRefresh={handleRefresh} disabled={isSearchOpen}>
      <div className="max-w-6xl mx-auto safe-bottom touch-pan-y">
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
        <SetTabs activeSet={activeSet} onChange={setActiveSet} cardCounts={cardCounts} />

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
          <CardGrid
            cards={sortedFilteredCards}
            ownedCards={ownedCards}
            onToggle={noop}
            onCardClick={setSelectedCard}
            readOnly
            groupBySet={activeSet === 'all' && groupBySet}
          />
        )}

        {/* Card detail modal */}
        <CardDetail
          card={selectedCard}
          owned={selectedCard ? ownedCards.get(selectedCard.id) : undefined}
          onClose={() => setSelectedCard(null)}
          onToggle={noop}
          cards={sortedFilteredCards}
          onNavigate={setSelectedCard}
          readOnly
        />

        {/* Search overlay */}
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          isOpen={isSearchOpen}
          onClose={onSearchClose}
        />
      </div>
    </PullToRefresh>
  );
}
