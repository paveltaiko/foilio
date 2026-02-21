import { useState, useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import type { ScryfallCard, SetCode, SortOption, OwnershipFilter, BoosterFilter, OwnedCard, CardWithVariant } from '../types/card';
import type { CollectionSet } from '../config/collections';
import { fetchCardsForSet } from '../services/scryfall';
import { useCollectionStats } from './useCollectionStats';
import { useBoosterMap } from './useBoosterMap';
import { parsePrice } from '../utils/formatPrice';

const STALE_TIME = 24 * 60 * 60 * 1000;

interface UseCardCollectionOptions {
  ownedCards: Map<string, OwnedCard>;
  searchQuery?: string;
  visibleSetIds?: string[];
  sets: CollectionSet[];
}

export function useCardCollection({ ownedCards, searchQuery = '', visibleSetIds, sets }: UseCardCollectionOptions) {
  const [activeSet, setActiveSet] = useState<SetCode>('all');
  const [sortOption, setSortOption] = useState<SortOption>('number-asc');
  const [ownershipFilter, setOwnershipFilter] = useState<OwnershipFilter>('all');
  const [boosterFilter, setBoosterFilter] = useState<BoosterFilter>('all');
  const [selectedCard, setSelectedCard] = useState<ScryfallCard | null>(null);
  const [groupBySet, setGroupBySet] = useState(true);

  const { data: boosterMap, isLoading: boosterMapLoading } = useBoosterMap();

  // Fetch cards dynamically for all sets
  const setQueries = useQueries({
    queries: sets.map((set) => ({
      queryKey: ['scryfall-cards', set.id],
      queryFn: () => fetchCardsForSet(set.id),
      staleTime: STALE_TIME,
      gcTime: STALE_TIME,
      refetchOnWindowFocus: false,
    })),
  });

  // Build a map: setId -> cards
  const cardsBySet = useMemo(() => {
    const map: Record<string, ScryfallCard[]> = {};
    sets.forEach((set, i) => {
      map[set.id] = setQueries[i]?.data ?? [];
    });
    return map;
  }, [sets, setQueries]);

  // Set order derived from config (respects the order field)
  const setOrder = useMemo(() => sets.map((s) => s.id), [sets]);

  // All cards combined (filtered by visible sets if provided)
  const combinedCards = useMemo(() => {
    const all = setOrder.flatMap((id) => cardsBySet[id] ?? []);
    if (!visibleSetIds) return all;
    const allowed = new Set(visibleSetIds);
    return all.filter((c) => allowed.has(c.set));
  }, [setOrder, cardsBySet, visibleSetIds]);

  // Current set cards
  const currentCards = useMemo(() => {
    if (activeSet === 'all') return combinedCards;
    if (visibleSetIds && !visibleSetIds.includes(activeSet)) return [];
    return cardsBySet[activeSet] ?? [];
  }, [activeSet, combinedCards, cardsBySet, visibleSetIds]);

  const isCardsLoading = useMemo(() => {
    if (activeSet === 'all') return setQueries.some((q) => q.isLoading);
    const idx = sets.findIndex((s) => s.id === activeSet);
    return idx >= 0 ? (setQueries[idx]?.isLoading ?? false) : false;
  }, [activeSet, sets, setQueries]);

  // Stats
  const stats = useCollectionStats(currentCards, ownedCards, activeSet);

  // Whether the current card set has any booster data available
  const hasBoosterData = useMemo(() => {
    if (!boosterMap || boosterMap.size === 0) return false;
    return currentCards.some((c) => boosterMap.has(`${c.set}:${c.collector_number}`));
  }, [boosterMap, currentCards]);

  // Card counts per set + all
  const cardCounts = useMemo(() => {
    const counts: Record<string, number> = { all: combinedCards.length };
    for (const id of setOrder) {
      counts[id] = visibleSetIds && !visibleSetIds.includes(id) ? 0 : (cardsBySet[id]?.length ?? 0);
    }
    return counts;
  }, [combinedCards.length, setOrder, cardsBySet, visibleSetIds]);

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

    // Booster filter — filter cards and restrict which variants to show
    const getBoosterVariants = boosterFilter !== 'all' && boosterMap
      ? (c: import('../types/card').ScryfallCard): Set<'foil' | 'nonfoil'> | null => {
          const entry = boosterMap.get(`${c.set}:${c.collector_number}`);
          if (!entry) return null;
          const bucket = boosterFilter === 'play' ? entry.play : entry.collector;
          return bucket.size > 0 ? bucket : null;
        }
      : null;

    if (getBoosterVariants) {
      cards = cards.filter((c) => getBoosterVariants(c) !== null);
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
      if (getBoosterVariants) {
        const result: CardWithVariant[] = [];
        for (const card of cards) {
          const variants = getBoosterVariants(card)!;
          if (variants.has('nonfoil') && card.finishes.includes('nonfoil')) {
            result.push({ card, variant: 'nonfoil', sortPrice: null });
          }
          if (variants.has('foil') && card.finishes.includes('foil')) {
            result.push({ card, variant: 'foil', sortPrice: null });
          }
        }
        return result;
      }
      return cards.map(card => ({ card, variant: null, sortPrice: null }));
    }

    // Sort by price - expand variants, restricted by booster filter if active
    const expanded: CardWithVariant[] = [];

    for (const card of cards) {
      const boosterVariants = getBoosterVariants ? getBoosterVariants(card) : null;
      const showNonFoil = card.finishes.includes('nonfoil') && (!boosterVariants || boosterVariants.has('nonfoil'));
      const showFoil = card.finishes.includes('foil') && (!boosterVariants || boosterVariants.has('foil'));

      if (showNonFoil) {
        expanded.push({ card, variant: 'nonfoil', sortPrice: parsePrice(card.prices.eur) });
      }
      if (showFoil) {
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
  }, [currentCards, ownershipFilter, boosterFilter, boosterMap, sortOption, ownedCards, searchQuery, activeSet, groupBySet, setOrder]);

  return {
    // State
    activeSet,
    setActiveSet,
    sortOption,
    setSortOption,
    ownershipFilter,
    setOwnershipFilter,
    boosterFilter,
    setBoosterFilter,
    boosterMapLoading,
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
    hasBoosterData,
  };
}
