import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRenderBatch } from './useRenderBatch';
import { useSetPagination } from './useSetPagination';
import { useCollectionStats } from './useCollectionStats';
import { useBoosterMap } from './useBoosterMap';
import { filterAndSortCards } from '../utils/cardFiltering';
import { fetchCardsByIds } from '../services/scryfall';
import { parsePrice } from '../utils/formatPrice';
import type {
  ScryfallCard,
  SetCode,
  SortOption,
  OwnershipFilter,
  BoosterFilter,
  OwnedCard,
} from '../types/card';
import type { CollectionSet } from '../config/collections';

interface UseCardCollectionOptions {
  ownedCards: Map<string, OwnedCard>;
  searchQuery?: string;
  visibleSetIds?: string[];
  sets: CollectionSet[];
}

export function useCardCollection({ ownedCards, searchQuery = '', visibleSetIds, sets }: UseCardCollectionOptions) {
  // ── UI state ──────────────────────────────────────────────────────────
  const [activeSet, setActiveSet] = useState<SetCode>('all');
  const [sortOption, setSortOption] = useState<SortOption>('number-asc');
  const [ownershipFilter, setOwnershipFilter] = useState<OwnershipFilter>('all');
  const [boosterFilter, setBoosterFilter] = useState<BoosterFilter>('all');
  const [selectedCard, setSelectedCard] = useState<ScryfallCard | null>(null);
  const [groupBySet, setGroupBySet] = useState(true);

  // ── Value resolution state ────────────────────────────────────────────
  const [ownedCardDetails, setOwnedCardDetails] = useState<Record<string, ScryfallCard>>({});
  const [isComputingTotalValue, setIsComputingTotalValue] = useState(false);

  // ── Booster data ──────────────────────────────────────────────────────
  const { data: boosterMap, isLoading: boosterMapLoading } = useBoosterMap();

  // ── Render batching ───────────────────────────────────────────────────
  const renderResetKey = `${activeSet}:${searchQuery}`;
  const { renderBatchSize, renderLimit, setRenderLimit } = useRenderBatch(renderResetKey);

  // ── Pagination (delegated to useSetPagination) ────────────────────────
  const {
    setOrder,
    currentCards,
    loadedCardsById,
    isCardsLoading,
    isNetworkFetching,
    networkHasMore,
    loadMoreError,
    isCompletingSearch,
    cardCounts,
    fetchNextPageForSet,
    fetchNextForAll,
    refreshCards: refreshPagination,
  } = useSetPagination({ sets, visibleSetIds, activeSet, searchQuery });

  // Reset activeSet if it's no longer in the visible set order
  useEffect(() => {
    if (activeSet !== 'all' && !setOrder.includes(activeSet)) {
      setActiveSet('all');
    }
  }, [activeSet, setOrder]);

  // ── Derived search / group state ──────────────────────────────────────
  const isSearchActive = searchQuery.trim().length > 0;
  const shouldGroupBySet = activeSet === 'all' && groupBySet && !isSearchActive;

  // ── Stats: base stats from loaded cards ───────────────────────────────
  const baseStats = useCollectionStats(currentCards, ownedCards, activeSet);

  const ownedCountBySet = useMemo(() => {
    const result: Record<string, number> = {};
    for (const owned of ownedCards.values()) {
      if (!owned.ownedNonFoil && !owned.ownedFoil) continue;
      result[owned.set] = (result[owned.set] ?? 0) + 1;
    }
    return result;
  }, [ownedCards]);

  // ── Scoped owned cards (for owned-filter completeness) ────────────────
  const scopedOwnedCardIds = useMemo(() => {
    const ids: string[] = [];
    for (const [cardId, owned] of ownedCards.entries()) {
      if (!owned.ownedNonFoil && !owned.ownedFoil) continue;
      if (activeSet !== 'all' && owned.set !== activeSet) continue;
      if (activeSet === 'all' && visibleSetIds && !visibleSetIds.includes(owned.set)) continue;
      ids.push(cardId);
    }
    return ids;
  }, [ownedCards, activeSet, visibleSetIds]);

  // Keep owned-filter results complete even when "all" mode has only partially
  // paged data loaded for some sets.
  const scopedOwnedCards = useMemo(() => {
    const result: ScryfallCard[] = [];
    const seen = new Set<string>();

    for (const cardId of scopedOwnedCardIds) {
      const card = loadedCardsById[cardId] ?? ownedCardDetails[cardId];
      if (!card) continue;
      if (activeSet !== 'all' && card.set !== activeSet) continue;
      if (activeSet === 'all' && visibleSetIds && !visibleSetIds.includes(card.set)) continue;
      if (seen.has(card.id)) continue;
      seen.add(card.id);
      result.push(card);
    }

    return result;
  }, [scopedOwnedCardIds, loadedCardsById, ownedCardDetails, activeSet, visibleSetIds]);

  // ── Resolve missing card details for value calculation ────────────────
  useEffect(() => {
    if (scopedOwnedCardIds.length === 0) {
      setIsComputingTotalValue(false);
      return;
    }

    const missingIds = scopedOwnedCardIds.filter(
      (id) => !loadedCardsById[id] && !ownedCardDetails[id]
    );
    if (missingIds.length === 0) {
      setIsComputingTotalValue(false);
      return;
    }

    let cancelled = false;
    setIsComputingTotalValue(true);

    const resolveMissing = async () => {
      try {
        const cards = await fetchCardsByIds(missingIds);
        if (cancelled) return;
        setOwnedCardDetails((prev) => ({ ...prev, ...cards }));
      } catch {
        if (!cancelled) {
          // Keep partial price data; retry is automatic on future scope changes.
        }
      } finally {
        if (!cancelled) {
          setIsComputingTotalValue(false);
        }
      }
    };

    void resolveMissing();
    return () => {
      cancelled = true;
    };
  }, [scopedOwnedCardIds, loadedCardsById, ownedCardDetails]);

  // ── Total value from owned cards in current scope ─────────────────────
  const totalValueFromOwnedScope = useMemo(() => {
    let sum = 0;
    for (const cardId of scopedOwnedCardIds) {
      const owned = ownedCards.get(cardId);
      if (!owned) continue;
      const card = loadedCardsById[cardId] ?? ownedCardDetails[cardId];
      if (!card) continue;

      if (owned.ownedNonFoil) {
        const price = parsePrice(card.prices.eur);
        const qty = owned.quantityNonFoil || 1;
        if (price !== null) sum += price * qty;
      }
      if (owned.ownedFoil) {
        const price = parsePrice(card.prices.eur_foil);
        const qty = owned.quantityFoil || 1;
        if (price !== null) sum += price * qty;
      }
    }
    return sum;
  }, [scopedOwnedCardIds, ownedCards, loadedCardsById, ownedCardDetails]);

  // ── Aggregated stats ──────────────────────────────────────────────────
  const stats = useMemo(() => {
    const getTotalForSet = (setId: string) => cardCounts[setId] ?? 0;

    const totalCards = activeSet === 'all'
      ? cardCounts['all'] ?? 0
      : getTotalForSet(activeSet);

    const ownedCount = activeSet === 'all'
      ? setOrder.reduce((sum, setId) => sum + (ownedCountBySet[setId] ?? 0), 0)
      : (ownedCountBySet[activeSet] ?? 0);

    return {
      totalCards,
      ownedCount,
      totalValue: totalValueFromOwnedScope || baseStats.totalValue,
      percentage: totalCards > 0 ? Math.round((ownedCount / totalCards) * 100) : 0,
    };
  }, [activeSet, setOrder, cardCounts, ownedCountBySet, totalValueFromOwnedScope, baseStats.totalValue]);

  // ── Booster data availability ─────────────────────────────────────────
  const hasBoosterData = useMemo(() => {
    if (!boosterMap || boosterMap.size === 0) return false;
    return currentCards.some((c) => boosterMap.has(`${c.set}:${c.collector_number}`));
  }, [boosterMap, currentCards]);

  // ── Filtering & sorting (delegated to utility) ────────────────────────
  const sortedFilteredCards = useMemo(
    () => filterAndSortCards({
      currentCards,
      scopedOwnedCards,
      ownedCards,
      ownershipFilter,
      boosterFilter,
      boosterMap,
      sortOption,
      searchQuery,
      shouldGroupBySet,
      setOrder,
    }),
    [currentCards, scopedOwnedCards, ownershipFilter, boosterFilter, boosterMap, sortOption, ownedCards, searchQuery, shouldGroupBySet, setOrder]
  );

  // ── Render-limited visible cards ──────────────────────────────────────
  const visibleCards = useMemo(
    () => sortedFilteredCards.slice(0, renderLimit),
    [sortedFilteredCards, renderLimit]
  );

  // ── Pagination controls ───────────────────────────────────────────────
  const canExpandRender = renderLimit < sortedFilteredCards.length;
  const hasNextPage = canExpandRender || networkHasMore;

  const loadNextPage = useCallback(() => {
    if (canExpandRender) {
      setRenderLimit((prev) => prev + renderBatchSize);
      return;
    }
    if (isNetworkFetching) return;
    if (activeSet === 'all') {
      void fetchNextForAll();
      return;
    }
    void fetchNextPageForSet(activeSet);
  }, [canExpandRender, renderBatchSize, isNetworkFetching, activeSet, fetchNextForAll, fetchNextPageForSet]);

  const refreshCards = useCallback(() => {
    refreshPagination();
    setRenderLimit(renderBatchSize);
  }, [refreshPagination, renderBatchSize]);

  return {
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

    currentCards,
    visibleCards,
    isCardsLoading,
    cardCounts,
    ownedCountBySet,
    stats,
    sortedFilteredCards,
    hasBoosterData,

    isFetchingNextPage: isNetworkFetching,
    hasNextPage,
    loadNextPage,
    loadMoreError,
    isCompletingSearch,
    isComputingTotalValue,
    refreshCards,
  };
}
