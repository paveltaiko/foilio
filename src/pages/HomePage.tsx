import { useState, useCallback, useMemo } from 'react';
import { Share2, Check } from 'lucide-react';
import type { User } from 'firebase/auth';
import type { ScryfallCard, SetCode, SortOption, OwnershipFilter as OwnershipFilterType } from '../types/card';
import { isFirebaseConfigured } from '../config/firebase';
import { useScryfallCards } from '../hooks/useScryfallCards';
import { useOwnedCards } from '../hooks/useOwnedCards';
import { useCollectionStats } from '../hooks/useCollectionStats';
import { toggleCardOwnership, updateCardQuantity } from '../services/firestore';
import { parsePrice } from '../utils/formatPrice';
import { SetTabs } from '../components/filters/SetTabs';
import { SortControl } from '../components/filters/SortControl';
import { OwnershipFilter } from '../components/filters/OwnershipFilter';
import { CollectionSummary } from '../components/stats/CollectionSummary';
import { CardGrid, CardGridSkeleton } from '../components/cards/CardGrid';
import { CardDetail } from '../components/cards/CardDetail';

interface HomePageProps {
  user: User;
  searchQuery: string;
}

function ShareButton({ userId }: { userId: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/user/${userId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      prompt('Odkaz na sbírku:', url);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center justify-center gap-2 w-full py-2 text-sm font-medium text-neutral-500 bg-surface-primary border border-surface-border rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-owned" />
          <span className="text-owned">Odkaz zkopírován!</span>
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4" />
          <span>Sdílet sbírku</span>
        </>
      )}
    </button>
  );
}

export function HomePage({ user, searchQuery }: HomePageProps) {
  const [activeSet, setActiveSet] = useState<SetCode>('spm');
  const [sortOption, setSortOption] = useState<SortOption>('number-asc');
  const [ownershipFilter, setOwnershipFilter] = useState<OwnershipFilterType>('all');
  const [selectedCard, setSelectedCard] = useState<ScryfallCard | null>(null);

  // Fetch cards from Scryfall
  const { data: spmCards = [], isLoading: spmLoading } = useScryfallCards('spm');
  const { data: speCards = [], isLoading: speLoading } = useScryfallCards('spe');
  const { data: marCards = [], isLoading: marLoading } = useScryfallCards('mar');

  // Owned cards
  const { ownedCards, updateLocal } = useOwnedCards(user.uid);

  // Current set cards
  const allCards: Record<SetCode, ScryfallCard[]> = useMemo(
    () => ({ spm: spmCards, spe: speCards, mar: marCards }),
    [spmCards, speCards, marCards]
  );
  const currentCards = allCards[activeSet];
  const isLoading = activeSet === 'spm' ? spmLoading : activeSet === 'spe' ? speLoading : marLoading;

  // Stats
  const stats = useCollectionStats(currentCards, ownedCards, activeSet);

  // Card counts per set
  const cardCounts: Record<SetCode, number> = useMemo(
    () => ({ spm: spmCards.length, spe: speCards.length, mar: marCards.length }),
    [spmCards.length, speCards.length, marCards.length]
  );

  // Sort & filter
  const sortedFilteredCards = useMemo(() => {
    let cards = [...currentCards];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      cards = cards.filter((c) =>
        c.name.toLowerCase().includes(query) ||
        c.collector_number.toLowerCase().includes(query)
      );
    }

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
      // Řazení podle čísla - jedna karta = jeden záznam
      cards.sort((a, b) => {
        const aNum = parseInt(a.collector_number) || 0;
        const bNum = parseInt(b.collector_number) || 0;
        return sortOption === 'number-asc' ? aNum - bNum : bNum - aNum;
      });
      return cards.map(card => ({ card, variant: null, sortPrice: null }));
    } else {
      // Řazení podle ceny - expandovat karty s oběma variantami
      const expanded: { card: typeof cards[0]; variant: 'nonfoil' | 'foil'; sortPrice: number | null }[] = [];

      for (const card of cards) {
        const hasNonFoil = card.finishes.includes('nonfoil');
        const hasFoil = card.finishes.includes('foil');

        if (hasNonFoil) {
          expanded.push({
            card,
            variant: 'nonfoil',
            sortPrice: parsePrice(card.prices.eur)
          });
        }
        if (hasFoil) {
          expanded.push({
            card,
            variant: 'foil',
            sortPrice: parsePrice(card.prices.eur_foil)
          });
        }
      }

      expanded.sort((a, b) => {
        const aPrice = a.sortPrice ?? 0;
        const bPrice = b.sortPrice ?? 0;
        return sortOption === 'price-asc' ? aPrice - bPrice : bPrice - aPrice;
      });

      return expanded;
    }
  }, [currentCards, ownershipFilter, sortOption, ownedCards, searchQuery]);

  // Handlers
  const handleToggle = useCallback(
    (cardId: string, variant: 'nonfoil' | 'foil') => {
      const card = currentCards.find((c) => c.id === cardId);
      if (!card) return;

      if (isFirebaseConfigured) {
        toggleCardOwnership(user.uid, cardId, {
          set: card.set,
          collectorNumber: card.collector_number,
          name: card.name,
        }, variant, ownedCards.get(cardId));
      } else {
        // localStorage mode
        updateLocal((prev) => {
          const next = new Map(prev);
          const existing = next.get(cardId);
          const isNowOwned = variant === 'nonfoil'
            ? !(existing?.ownedNonFoil ?? false)
            : !(existing?.ownedFoil ?? false);

          const newNonFoil = variant === 'nonfoil' ? isNowOwned : (existing?.ownedNonFoil ?? false);
          const newFoil = variant === 'foil' ? isNowOwned : (existing?.ownedFoil ?? false);
          const newQtyNonFoil = variant === 'nonfoil' ? (isNowOwned ? 1 : 0) : (existing?.quantityNonFoil ?? 0);
          const newQtyFoil = variant === 'foil' ? (isNowOwned ? 1 : 0) : (existing?.quantityFoil ?? 0);

          if (!newNonFoil && !newFoil) {
            next.delete(cardId);
          } else {
            next.set(cardId, {
              scryfallId: cardId,
              set: card.set,
              collectorNumber: card.collector_number,
              name: card.name,
              ownedNonFoil: newNonFoil,
              ownedFoil: newFoil,
              quantityNonFoil: newQtyNonFoil,
              quantityFoil: newQtyFoil,
              customPrice: existing?.customPrice ?? null,
              customPriceFoil: existing?.customPriceFoil ?? null,
              addedAt: existing?.addedAt ?? new Date(),
              updatedAt: new Date(),
            });
          }
          return next;
        });
      }
    },
    [user.uid, currentCards, ownedCards, updateLocal]
  );

  // Handler for quantity change
  const handleQuantityChange = useCallback(
    (cardId: string, variant: 'nonfoil' | 'foil', quantity: number) => {
      const card = currentCards.find((c) => c.id === cardId);
      const existing = ownedCards.get(cardId);
      if (!card || !existing) return;

      if (isFirebaseConfigured) {
        updateCardQuantity(user.uid, cardId, variant, quantity, existing);
      } else {
        // localStorage mode
        updateLocal((prev) => {
          const next = new Map(prev);
          const newQtyNonFoil = variant === 'nonfoil' ? quantity : existing.quantityNonFoil;
          const newQtyFoil = variant === 'foil' ? quantity : existing.quantityFoil;
          const newOwnedNonFoil = variant === 'nonfoil' ? quantity > 0 : existing.ownedNonFoil;
          const newOwnedFoil = variant === 'foil' ? quantity > 0 : existing.ownedFoil;

          if (!newOwnedNonFoil && !newOwnedFoil) {
            next.delete(cardId);
          } else {
            next.set(cardId, {
              ...existing,
              ownedNonFoil: newOwnedNonFoil,
              ownedFoil: newOwnedFoil,
              quantityNonFoil: newQtyNonFoil,
              quantityFoil: newQtyFoil,
              updatedAt: new Date(),
            });
          }
          return next;
        });
      }
    },
    [user.uid, currentCards, ownedCards, updateLocal]
  );

  return (
    <div className="max-w-6xl mx-auto safe-bottom touch-pan-y">
      {/* Set tabs */}
      <SetTabs activeSet={activeSet} onChange={setActiveSet} cardCounts={cardCounts} />

      {/* Stats + Share */}
      <div className="py-4 space-y-2">
        <CollectionSummary
          totalCards={stats.totalCards}
          ownedCount={stats.ownedCount}
          totalValue={stats.totalValue}
          percentage={stats.percentage}
        />
        {isFirebaseConfigured && (
          <ShareButton userId={user.uid} />
        )}
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
          onToggle={handleToggle}
          onCardClick={setSelectedCard}
        />
      )}

      {/* Card detail modal */}
      <CardDetail
        card={selectedCard}
        owned={selectedCard ? ownedCards.get(selectedCard.id) : undefined}
        onClose={() => setSelectedCard(null)}
        onToggle={handleToggle}
        onQuantityChange={handleQuantityChange}
        cards={sortedFilteredCards}
        onNavigate={setSelectedCard}
      />
    </div>
  );
}
