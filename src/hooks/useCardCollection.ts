import { useState, useMemo } from 'react';
import type { ScryfallCard, SetCode, SortOption, OwnershipFilter, OwnedCard, CardWithVariant } from '../types/card';
import { useScryfallCards } from './useScryfallCards';
import { useCollectionStats } from './useCollectionStats';
import { parsePrice } from '../utils/formatPrice';

interface UseCardCollectionOptions {
  ownedCards: Map<string, OwnedCard>;
  searchQuery?: string;
}

export function useCardCollection({ ownedCards, searchQuery = '' }: UseCardCollectionOptions) {
  const [activeSet, setActiveSet] = useState<SetCode>('all');
  const [sortOption, setSortOption] = useState<SortOption>('number-asc');
  const [ownershipFilter, setOwnershipFilter] = useState<OwnershipFilter>('all');
  const [selectedCard, setSelectedCard] = useState<ScryfallCard | null>(null);
  const [groupBySet, setGroupBySet] = useState(true);

  // Fetch cards from Scryfall
  const { data: spmCards = [], isLoading: spmLoading } = useScryfallCards('spm');
  const { data: speCards = [], isLoading: speLoading } = useScryfallCards('spe');
  const { data: marCards = [], isLoading: marLoading } = useScryfallCards('mar');

  // All cards combined
  const combinedCards = useMemo(
    () => [...spmCards, ...speCards, ...marCards],
    [spmCards, speCards, marCards]
  );

  // Current set cards
  const allCards: Record<SetCode, ScryfallCard[]> = useMemo(
    () => ({ all: combinedCards, spm: spmCards, spe: speCards, mar: marCards }),
    [combinedCards, spmCards, speCards, marCards]
  );
  const currentCards = allCards[activeSet];
  const isCardsLoading = activeSet === 'all'
    ? (spmLoading || speLoading || marLoading)
    : activeSet === 'spm' ? spmLoading : activeSet === 'spe' ? speLoading : marLoading;

  // Stats
  const stats = useCollectionStats(currentCards, ownedCards, activeSet);

  // Card counts per set
  const cardCounts: Record<SetCode, number> = useMemo(
    () => ({ all: combinedCards.length, spm: spmCards.length, spe: speCards.length, mar: marCards.length }),
    [combinedCards.length, spmCards.length, speCards.length, marCards.length]
  );

  // Sort & filter
  const sortedFilteredCards: CardWithVariant[] = useMemo(() => {
    let cards = [...currentCards];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      cards = cards.filter((c) =>
        c.name.toLowerCase().includes(query) ||
        c.collector_number.toLowerCase().includes(query)
      );
    }

    // Ownership filter (for number sorting - card-level)
    const isPriceSorting = sortOption === 'price-asc' || sortOption === 'price-desc';
    if (!isPriceSorting) {
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
    }

    // Sort by number
    if (sortOption === 'number-asc' || sortOption === 'number-desc') {
      const setOrder = ['spm', 'spe', 'mar'];
      cards.sort((a, b) => {
        // When grouped by set, sort by set first to match visual grid order
        if (activeSet === 'all' && groupBySet) {
          const setDiff = setOrder.indexOf(a.set) - setOrder.indexOf(b.set);
          if (setDiff !== 0) return setDiff;
        }
        const aNum = parseInt(a.collector_number) || 0;
        const bNum = parseInt(b.collector_number) || 0;
        return sortOption === 'number-asc' ? aNum - bNum : bNum - aNum;
      });
      return cards.map(card => ({ card, variant: null, sortPrice: null }));
    }

    // Sort by price - expand variants
    const expanded: CardWithVariant[] = [];

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

    // Filter ownership per variant (not per card)
    let filtered = expanded;
    if (ownershipFilter === 'owned') {
      filtered = expanded.filter(({ card, variant }) => {
        const o = ownedCards.get(card.id);
        return variant === 'nonfoil' ? o?.ownedNonFoil : o?.ownedFoil;
      });
    } else if (ownershipFilter === 'missing') {
      filtered = expanded.filter(({ card, variant }) => {
        const o = ownedCards.get(card.id);
        return variant === 'nonfoil' ? !o?.ownedNonFoil : !o?.ownedFoil;
      });
    }

    filtered.sort((a, b) => {
      const aPrice = a.sortPrice ?? 0;
      const bPrice = b.sortPrice ?? 0;
      return sortOption === 'price-asc' ? aPrice - bPrice : bPrice - aPrice;
    });

    return filtered;
  }, [currentCards, ownershipFilter, sortOption, ownedCards, searchQuery, activeSet, groupBySet]);

  return {
    // State
    activeSet,
    setActiveSet,
    sortOption,
    setSortOption,
    ownershipFilter,
    setOwnershipFilter,
    selectedCard,
    setSelectedCard,
    groupBySet,
    setGroupBySet,

    // Data
    currentCards,
    isCardsLoading,
    cardCounts,
    stats,
    sortedFilteredCards,
  };
}
