import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import type { ScryfallCard, SetCode, SortOption, OwnershipFilter as OwnershipFilterType } from '../types/card';
import { useScryfallCards } from '../hooks/useScryfallCards';
import { useSharedCollection } from '../hooks/useSharedCollection';
import { useCollectionStats } from '../hooks/useCollectionStats';
import { parsePrice } from '../utils/formatPrice';
import { SetTabs } from '../components/filters/SetTabs';
import { SortControl } from '../components/filters/SortControl';
import { OwnershipFilter } from '../components/filters/OwnershipFilter';
import { CollectionSummary } from '../components/stats/CollectionSummary';
import { CardGrid, CardGridSkeleton } from '../components/cards/CardGrid';
import { CardDetail } from '../components/cards/CardDetail';

interface SharedCollectionPageProps {
  currentUserId: string | null;
}

export function SharedCollectionPage({ currentUserId }: SharedCollectionPageProps) {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [activeSet, setActiveSet] = useState<SetCode>('spm');
  const [sortOption, setSortOption] = useState<SortOption>('number-asc');
  const [ownershipFilter, setOwnershipFilter] = useState<OwnershipFilterType>('all');
  const [selectedCard, setSelectedCard] = useState<ScryfallCard | null>(null);

  // Redirect to home if viewing own collection
  if (userId && currentUserId && userId === currentUserId) {
    navigate('/', { replace: true });
    return null;
  }

  // Fetch shared collection
  const { ownedCards, profile, loading: collectionLoading, error } = useSharedCollection(userId);

  // Fetch cards from Scryfall
  const { data: spmCards = [], isLoading: spmLoading } = useScryfallCards('spm');
  const { data: speCards = [], isLoading: speLoading } = useScryfallCards('spe');
  const { data: marCards = [], isLoading: marLoading } = useScryfallCards('mar');

  const allCards: Record<SetCode, ScryfallCard[]> = useMemo(
    () => ({ spm: spmCards, spe: speCards, mar: marCards }),
    [spmCards, speCards, marCards]
  );
  const currentCards = allCards[activeSet];
  const isLoading = collectionLoading || (activeSet === 'spm' ? spmLoading : activeSet === 'spe' ? speLoading : marLoading);

  const stats = useCollectionStats(currentCards, ownedCards, activeSet);

  const cardCounts: Record<SetCode, number> = useMemo(
    () => ({ spm: spmCards.length, spe: speCards.length, mar: marCards.length }),
    [spmCards.length, speCards.length, marCards.length]
  );

  // Sort & filter (same logic as HomePage)
  const sortedFilteredCards = useMemo(() => {
    let cards = [...currentCards];

    if (ownershipFilter === 'owned') {
      cards = cards.filter((c) => {
        const o = ownedCards.get(c.id);
        return o && (o.ownedNonFoil || o.ownedFoil);
      });
    } else if (ownershipFilter === 'missing') {
      cards = cards.filter((c) => {
        const o = ownedCards.get(c.id);
        return !o || (!o.ownedNonFoil && !o.ownedFoil);
      });
    }

    if (sortOption === 'number-asc' || sortOption === 'number-desc') {
      cards.sort((a, b) => {
        const aNum = parseInt(a.collector_number) || 0;
        const bNum = parseInt(b.collector_number) || 0;
        return sortOption === 'number-asc' ? aNum - bNum : bNum - aNum;
      });
      return cards.map(card => ({ card, variant: null, sortPrice: null }));
    } else {
      const expanded: { card: typeof cards[0]; variant: 'nonfoil' | 'foil'; sortPrice: number | null }[] = [];

      for (const card of cards) {
        const hasNonFoil = card.finishes.includes('nonfoil');
        const hasFoil = card.finishes.includes('foil');

        if (hasNonFoil) {
          expanded.push({ card, variant: 'nonfoil', sortPrice: parsePrice(card.prices.eur) });
        }
        if (hasFoil) {
          expanded.push({ card, variant: 'foil', sortPrice: parsePrice(card.prices.eur_foil) });
        }
      }

      expanded.sort((a, b) => {
        const aPrice = a.sortPrice ?? 0;
        const bPrice = b.sortPrice ?? 0;
        return sortOption === 'price-asc' ? aPrice - bPrice : bPrice - aPrice;
      });

      return expanded;
    }
  }, [currentCards, ownershipFilter, sortOption, ownedCards]);

  // No-op toggle for read-only mode
  const noop = () => {};

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-16 text-center">
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
    <div className="max-w-6xl mx-auto px-3 sm:px-6 pb-8 safe-bottom touch-pan-y">
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
        <SortControl value={sortOption} onChange={setSortOption} />
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
