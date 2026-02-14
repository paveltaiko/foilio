import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Layers, LayoutGrid } from 'lucide-react';
import { useSharedCollection } from '../hooks/useSharedCollection';
import { useCardCollection } from '../hooks/useCardCollection';
import { SetTabs } from '../components/filters/SetTabs';
import { SortControl } from '../components/filters/SortControl';
import { OwnershipFilter } from '../components/filters/OwnershipFilter';
import { CollectionSummary } from '../components/stats/CollectionSummary';
import { CardGrid, CardGridSkeleton } from '../components/cards/CardGrid';
import { CardDetail } from '../components/cards/CardDetail';

interface SharedCollectionPageProps {
  currentUserId: string | null;
  searchQuery?: string;
}

export function SharedCollectionPage({ currentUserId, searchQuery }: SharedCollectionPageProps) {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  // Redirect to home if viewing own collection
  if (userId && currentUserId && userId === currentUserId) {
    navigate('/', { replace: true });
    return null;
  }

  // Fetch shared collection
  const { ownedCards, profile, loading: collectionLoading, error } = useSharedCollection(userId);

  const {
    activeSet, setActiveSet,
    sortOption, setSortOption,
    ownershipFilter, setOwnershipFilter,
    selectedCard, setSelectedCard,
    groupBySet, setGroupBySet,
    isCardsLoading, cardCounts, stats, sortedFilteredCards,
  } = useCardCollection({ ownedCards, searchQuery });

  const isLoading = collectionLoading || isCardsLoading;

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
          Zpět na hlavní stránku
        </button>
      </div>
    );
  }

  return (
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
            {profile?.displayName ?? 'Načítání...'}
          </p>
          <p className="text-xs text-neutral-400">Sdílená sbírka</p>
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
              title={groupBySet ? 'Zobrazit vše najednou' : 'Seskupit podle edice'}
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
    </div>
  );
}
