import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import type { ScryfallCard, SortOption, OwnershipFilter, OwnedCard, CardWithVariant } from '../types/card';
import type { SecretLairDrop } from '../config/secretLairDrops';
import { fetchCardsForSLDDrop } from '../services/scryfall';
import { getCachedSLDDrop, setCachedSLDDrop, invalidateCachedSLDDrop } from '../utils/scryfallCache';
import { useCollectionStats } from './useCollectionStats';
import { parsePrice } from '../utils/formatPrice';
import { getBatchSize } from '../utils/responsive';

interface DropState {
  cards: ScryfallCard[];
  isFetching: boolean;
  initialized: boolean;
  error: string | null;
}

const EMPTY_DROP_STATE: DropState = {
  cards: [],
  isFetching: false,
  initialized: false,
  error: null,
};

interface UseSecretLairCollectionOptions {
  ownedCards: Map<string, OwnedCard>;
  searchQuery?: string;
  drops: SecretLairDrop[];
  active: boolean;
}

export function useSecretLairCollection({
  ownedCards,
  searchQuery = '',
  drops,
  active,
}: UseSecretLairCollectionOptions) {
  const [activeDrop, setActiveDrop] = useState<string>('all');
  const [sortOption, setSortOption] = useState<SortOption>('number-asc');
  const [ownershipFilter, setOwnershipFilter] = useState<OwnershipFilter>('all');
  const [selectedCard, setSelectedCard] = useState<ScryfallCard | null>(null);
  const [renderLimit, setRenderLimit] = useState(getBatchSize);
  const [dropStates, setDropStates] = useState<Record<string, DropState>>({});

  const inFlightRef = useRef<Set<string>>(new Set());

  // Cleanup in-flight tracking on unmount to prevent stale state updates
  useEffect(() => {
    return () => {
      inFlightRef.current.clear();
    };
  }, []);

  // Hydrate from localStorage cache on first activation
  useEffect(() => {
    if (!active) return;
    setDropStates((prev) => {
      const next = { ...prev };
      for (const drop of drops) {
        if (next[drop.id]?.initialized) continue;
        const cached = getCachedSLDDrop(drop.id);
        if (cached) {
          next[drop.id] = { cards: cached, isFetching: false, initialized: true, error: null };
        }
      }
      return next;
    });
  }, [active, drops]);

  const fetchDrop = useCallback(
    async (dropId: string) => {
      if (inFlightRef.current.has(dropId)) return;

      const drop = drops.find((d) => d.id === dropId);
      if (!drop) return;

      const state = dropStates[dropId];
      if (state?.initialized || state?.isFetching) return;

      inFlightRef.current.add(dropId);
      setDropStates((prev) => ({
        ...prev,
        [dropId]: { ...EMPTY_DROP_STATE, isFetching: true },
      }));

      try {
        const cards = await fetchCardsForSLDDrop(drop.releasedAt);
        setCachedSLDDrop(dropId, cards);
        setDropStates((prev) => ({
          ...prev,
          [dropId]: { cards, isFetching: false, initialized: true, error: null },
        }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch drop';
        setDropStates((prev) => ({
          ...prev,
          [dropId]: { cards: [], isFetching: false, initialized: true, error: message },
        }));
      } finally {
        inFlightRef.current.delete(dropId);
      }
    },
    [drops, dropStates]
  );

  // Fetch active drop on demand
  useEffect(() => {
    if (!active) return;
    if (activeDrop === 'all') {
      // Fetch all drops lazily
      for (const drop of drops) {
        const state = dropStates[drop.id];
        if (!state?.initialized && !state?.isFetching) {
          fetchDrop(drop.id);
        }
      }
    } else {
      fetchDrop(activeDrop);
    }
  }, [active, activeDrop, drops, dropStates, fetchDrop]);

  // All cards across all initialized drops
  const allCards = useMemo(() => {
    return drops.flatMap((drop) => dropStates[drop.id]?.cards ?? []);
  }, [drops, dropStates]);

  // Cards for the active drop (or all)
  const currentCards = useMemo(() => {
    if (activeDrop === 'all') return allCards;
    return dropStates[activeDrop]?.cards ?? [];
  }, [activeDrop, allCards, dropStates]);

  const isCardsLoading = useMemo(() => {
    if (activeDrop === 'all') {
      return drops.some((drop) => dropStates[drop.id]?.isFetching);
    }
    return dropStates[activeDrop]?.isFetching ?? false;
  }, [activeDrop, drops, dropStates]);

  // Card counts per drop (for tabs)
  const cardCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const drop of drops) {
      counts[drop.id] = dropStates[drop.id]?.cards.length ?? 0;
    }
    counts['all'] = allCards.length;
    return counts;
  }, [drops, dropStates, allCards]);

  // Filtered + sorted cards
  const sortedFilteredCards = useMemo((): CardWithVariant[] => {
    let cards = currentCards;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      cards = cards.filter((c) => c.name.toLowerCase().includes(q));
    }

    // Ownership filter
    if (ownershipFilter !== 'all') {
      cards = cards.filter((card) => {
        const owned = ownedCards.get(card.id);
        const isOwned = owned ? owned.ownedNonFoil || owned.ownedFoil : false;
        return ownershipFilter === 'owned' ? isOwned : !isOwned;
      });
    }

    // Expand into variants
    const withVariants: CardWithVariant[] = [];
    for (const card of cards) {
      const hasNonFoil = card.finishes.includes('nonfoil');
      const hasFoil = card.finishes.includes('foil') || card.finishes.includes('etched');

      if (hasNonFoil && hasFoil) {
        withVariants.push({ card, variant: null, sortPrice: parsePrice(card.prices.eur) });
      } else if (hasNonFoil) {
        withVariants.push({ card, variant: 'nonfoil', sortPrice: parsePrice(card.prices.eur) });
      } else if (hasFoil) {
        withVariants.push({ card, variant: 'foil', sortPrice: parsePrice(card.prices.eur_foil) });
      } else {
        withVariants.push({ card, variant: null, sortPrice: null });
      }
    }

    // Sort
    withVariants.sort((a, b) => {
      if (sortOption === 'price-asc' || sortOption === 'price-desc') {
        const aPrice = a.sortPrice ?? -1;
        const bPrice = b.sortPrice ?? -1;
        return sortOption === 'price-asc' ? aPrice - bPrice : bPrice - aPrice;
      }
      const aNum = parseInt(a.card.collector_number, 10);
      const bNum = parseInt(b.card.collector_number, 10);
      return sortOption === 'number-asc' ? aNum - bNum : bNum - aNum;
    });

    return withVariants;
  }, [currentCards, searchQuery, ownershipFilter, ownedCards, sortOption]);

  const visibleCards = useMemo(
    () => sortedFilteredCards.slice(0, renderLimit),
    [sortedFilteredCards, renderLimit]
  );

  const hasNextPage = visibleCards.length < sortedFilteredCards.length;

  const loadNextPage = useCallback(() => {
    setRenderLimit((prev) => prev + getBatchSize());
  }, []);

  // Reset render limit when active drop or filters change
  useEffect(() => {
    setRenderLimit(getBatchSize());
  }, [activeDrop, ownershipFilter, sortOption, searchQuery]);

  const stats = useCollectionStats(currentCards, ownedCards, 'all');

  const refreshCards = useCallback(() => {
    inFlightRef.current.clear();
    for (const drop of drops) {
      invalidateCachedSLDDrop(drop.id);
    }
    setDropStates({});
    setRenderLimit(getBatchSize());
  }, [drops]);

  return {
    activeDrop,
    setActiveDrop,
    sortOption,
    setSortOption,
    ownershipFilter,
    setOwnershipFilter,
    selectedCard,
    setSelectedCard,
    currentCards,
    visibleCards,
    isCardsLoading,
    cardCounts,
    stats,
    sortedFilteredCards,
    hasNextPage,
    loadNextPage,
    refreshCards,
  };
}
