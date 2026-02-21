import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import type {
  ScryfallCard,
  SetCode,
  SortOption,
  OwnershipFilter,
  BoosterFilter,
  OwnedCard,
  CardWithVariant,
} from '../types/card';
import type { CollectionSet } from '../config/collections';
import { fetchCardsByIds, fetchCardsPageForSet, fetchSetCardCount } from '../services/scryfall';
import { useCollectionStats } from './useCollectionStats';
import { useBoosterMap } from './useBoosterMap';
import { parsePrice } from '../utils/formatPrice';

const MOBILE_BATCH_SIZE = 24;
const DESKTOP_BATCH_SIZE = 48;
const FETCH_DELAY_MS = 100;

interface UseCardCollectionOptions {
  ownedCards: Map<string, OwnedCard>;
  searchQuery?: string;
  visibleSetIds?: string[];
  sets: CollectionSet[];
}

interface SetPaginationState {
  cards: ScryfallCard[];
  nextPage: string | null;
  hasMore: boolean;
  isFetching: boolean;
  initialized: boolean;
  error: string | null;
}

const EMPTY_STATE: SetPaginationState = {
  cards: [],
  nextPage: null,
  hasMore: true,
  isFetching: false,
  initialized: false,
  error: null,
};

function getBatchSize() {
  if (typeof window === 'undefined') return DESKTOP_BATCH_SIZE;
  return window.matchMedia('(max-width: 767px)').matches ? MOBILE_BATCH_SIZE : DESKTOP_BATCH_SIZE;
}

function mergeCards(existing: ScryfallCard[], incoming: ScryfallCard[]) {
  if (incoming.length === 0) return existing;
  const seen = new Set(existing.map((card) => card.id));
  const merged = [...existing];
  for (const card of incoming) {
    if (seen.has(card.id)) continue;
    merged.push(card);
    seen.add(card.id);
  }
  return merged;
}

function getStateForSet(map: Record<string, SetPaginationState>, setId: string): SetPaginationState {
  return map[setId] ?? EMPTY_STATE;
}

export function useCardCollection({ ownedCards, searchQuery = '', visibleSetIds, sets }: UseCardCollectionOptions) {
  const [activeSet, setActiveSet] = useState<SetCode>('all');
  const [sortOption, setSortOption] = useState<SortOption>('number-asc');
  const [ownershipFilter, setOwnershipFilter] = useState<OwnershipFilter>('all');
  const [boosterFilter, setBoosterFilter] = useState<BoosterFilter>('all');
  const [selectedCard, setSelectedCard] = useState<ScryfallCard | null>(null);
  const [groupBySet, setGroupBySet] = useState(true);
  const [renderBatchSize, setRenderBatchSize] = useState(getBatchSize);
  const [renderLimit, setRenderLimit] = useState(getBatchSize);
  const [setPages, setSetPages] = useState<Record<string, SetPaginationState>>({});
  const [setTotals, setSetTotals] = useState<Record<string, number>>({});
  const [ownedCardDetails, setOwnedCardDetails] = useState<Record<string, ScryfallCard>>({});
  const [isComputingTotalValue, setIsComputingTotalValue] = useState(false);

  const { data: boosterMap, isLoading: boosterMapLoading } = useBoosterMap();
  const inFlightRef = useRef<Set<string>>(new Set());
  const setPagesRef = useRef(setPages);

  useEffect(() => {
    setPagesRef.current = setPages;
  }, [setPages]);

  const setOrder = useMemo(() => {
    const ordered = [...sets].sort((a, b) => a.order - b.order).map((s) => s.id);
    if (!visibleSetIds) return ordered;
    const allowed = new Set(visibleSetIds);
    return ordered.filter((id) => allowed.has(id));
  }, [sets, visibleSetIds]);

  const allSetIds = useMemo(() => sets.map((s) => s.id), [sets]);

  useEffect(() => {
    const onResize = () => {
      const next = getBatchSize();
      setRenderBatchSize(next);
      setRenderLimit((prev) => (prev < next ? next : prev));
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (activeSet !== 'all' && !setOrder.includes(activeSet)) {
      setActiveSet('all');
    }
  }, [activeSet, setOrder]);

  useEffect(() => {
    if (setOrder.length === 0) return;
    let cancelled = false;

    const loadTotals = async () => {
      for (const setId of setOrder) {
        if (cancelled) break;
        if (setTotals[setId] !== undefined) continue;
        try {
          const count = await fetchSetCardCount(setId);
          if (!cancelled && count !== null) {
            setSetTotals((prev) => (prev[setId] === undefined ? { ...prev, [setId]: count } : prev));
          }
        } catch {
          // Keep fallback to loaded cards count when set metadata fails.
        }
      }
    };

    void loadTotals();
    return () => {
      cancelled = true;
    };
  }, [setOrder, setTotals]);

  useEffect(() => {
    setRenderLimit(renderBatchSize);
  }, [activeSet, renderBatchSize, searchQuery]);

  const fetchNextPageForSet = useCallback(async (setId: string): Promise<boolean> => {
    if (!setId) return false;
    if (inFlightRef.current.has(setId)) return false;

    const snapshot = getStateForSet(setPagesRef.current, setId);
    if (snapshot.initialized && !snapshot.hasMore && !snapshot.error) return false;

    inFlightRef.current.add(setId);
    setSetPages((prev) => ({
      ...prev,
      [setId]: {
        ...getStateForSet(prev, setId),
        isFetching: true,
        error: null,
      },
    }));

    try {
      const page = await fetchCardsPageForSet(setId, snapshot.initialized ? snapshot.nextPage : undefined);

      setSetPages((prev) => {
        const current = getStateForSet(prev, setId);
        return {
          ...prev,
          [setId]: {
            ...current,
            cards: mergeCards(current.cards, page.cards),
            nextPage: page.nextPage,
            hasMore: page.hasMore,
            initialized: true,
            isFetching: false,
            error: null,
          },
        };
      });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load cards';
      setSetPages((prev) => ({
        ...prev,
        [setId]: {
          ...getStateForSet(prev, setId),
          initialized: true,
          isFetching: false,
          error: message,
        },
      }));
      return false;
    } finally {
      inFlightRef.current.delete(setId);
    }
  }, []);

  const allNetworkTargetSet = useMemo(() => {
    for (const setId of setOrder) {
      const state = getStateForSet(setPages, setId);
      if (!state.initialized || state.hasMore || state.error) {
        return setId;
      }
    }
    return null;
  }, [setOrder, setPages]);

  const fetchNextForAll = useCallback(async () => {
    if (!allNetworkTargetSet) return false;
    return fetchNextPageForSet(allNetworkTargetSet);
  }, [allNetworkTargetSet, fetchNextPageForSet]);

  useEffect(() => {
    if (setOrder.length === 0) return;
    if (activeSet === 'all') {
      const first = setOrder[0];
      const state = getStateForSet(setPagesRef.current, first);
      if (!state.initialized && !state.isFetching) {
        void fetchNextPageForSet(first);
      }
      return;
    }

    const state = getStateForSet(setPagesRef.current, activeSet);
    if (!state.initialized && !state.isFetching) {
      void fetchNextPageForSet(activeSet);
    }
  }, [activeSet, setOrder, fetchNextPageForSet]);

  const isSearchActive = searchQuery.trim().length > 0;

  useEffect(() => {
    if (!isSearchActive || activeSet === 'all') return;
    let cancelled = false;

    const completeSearchData = async () => {
      while (!cancelled) {
        const state = getStateForSet(setPagesRef.current, activeSet);
        if (!state.initialized || state.isFetching || !state.hasMore) break;
        const loaded = await fetchNextPageForSet(activeSet);
        if (!loaded) break;
        await new Promise((resolve) => setTimeout(resolve, FETCH_DELAY_MS));
      }
    };

    void completeSearchData();
    return () => {
      cancelled = true;
    };
  }, [isSearchActive, activeSet, fetchNextPageForSet, setPages]);

  const cardsBySet = useMemo(() => {
    const map: Record<string, ScryfallCard[]> = {};
    for (const setId of allSetIds) {
      map[setId] = getStateForSet(setPages, setId).cards;
    }
    return map;
  }, [allSetIds, setPages]);

  const combinedCards = useMemo(() => {
    const all = setOrder.flatMap((id) => cardsBySet[id] ?? []);
    if (!visibleSetIds) return all;
    const allowed = new Set(visibleSetIds);
    return all.filter((c) => allowed.has(c.set));
  }, [setOrder, cardsBySet, visibleSetIds]);

  const currentCards = useMemo(() => {
    if (activeSet === 'all') return combinedCards;
    if (visibleSetIds && !visibleSetIds.includes(activeSet)) return [];
    return cardsBySet[activeSet] ?? [];
  }, [activeSet, combinedCards, cardsBySet, visibleSetIds]);

  const loadedCardsById = useMemo(() => {
    const map: Record<string, ScryfallCard> = {};
    for (const setId of allSetIds) {
      const cards = cardsBySet[setId] ?? [];
      for (const card of cards) {
        map[card.id] = card;
      }
    }
    return map;
  }, [allSetIds, cardsBySet]);

  const isCardsLoading = useMemo(() => {
    if (activeSet === 'all') {
      if (setOrder.length === 0) return false;
      const first = getStateForSet(setPages, setOrder[0]);
      return !first.initialized && first.isFetching;
    }

    const state = getStateForSet(setPages, activeSet);
    return !state.initialized && state.isFetching;
  }, [activeSet, setOrder, setPages]);

  const baseStats = useCollectionStats(currentCards, ownedCards, activeSet);

  const ownedCountBySet = useMemo(() => {
    const result: Record<string, number> = {};
    for (const owned of ownedCards.values()) {
      if (!owned.ownedNonFoil && !owned.ownedFoil) continue;
      result[owned.set] = (result[owned.set] ?? 0) + 1;
    }
    return result;
  }, [ownedCards]);

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

  const stats = useMemo(() => {
    const getTotalForSet = (setId: string) => setTotals[setId] ?? (cardsBySet[setId]?.length ?? 0);

    const totalCards = activeSet === 'all'
      ? setOrder.reduce((sum, setId) => sum + getTotalForSet(setId), 0)
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
  }, [activeSet, setOrder, setTotals, cardsBySet, ownedCountBySet, totalValueFromOwnedScope, baseStats.totalValue]);

  const hasBoosterData = useMemo(() => {
    if (!boosterMap || boosterMap.size === 0) return false;
    return currentCards.some((c) => boosterMap.has(`${c.set}:${c.collector_number}`));
  }, [boosterMap, currentCards]);

  const cardCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: setOrder.reduce((sum, setId) => sum + (setTotals[setId] ?? (cardsBySet[setId]?.length ?? 0)), 0),
    };
    for (const id of allSetIds) {
      counts[id] = visibleSetIds && !visibleSetIds.includes(id)
        ? 0
        : (setTotals[id] ?? (cardsBySet[id]?.length ?? 0));
    }
    return counts;
  }, [setOrder, setTotals, allSetIds, cardsBySet, visibleSetIds]);

  const sortedFilteredCards: CardWithVariant[] = useMemo(() => {
    let cards = [...currentCards];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      cards = cards.filter((c) =>
        c.name.toLowerCase().includes(query) ||
        c.collector_number.toLowerCase().includes(query)
      );
    }

    const getBoosterVariants = boosterFilter !== 'all' && boosterMap
      ? (c: ScryfallCard): Set<'foil' | 'nonfoil'> | null => {
          const entry = boosterMap.get(`${c.set}:${c.collector_number}`);
          if (!entry) return null;
          const bucket = boosterFilter === 'play' ? entry.play : entry.collector;
          return bucket.size > 0 ? bucket : null;
        }
      : null;

    if (getBoosterVariants) {
      cards = cards.filter((c) => getBoosterVariants(c) !== null);
    }

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

    if (sortOption === 'number-asc' || sortOption === 'number-desc') {
      cards.sort((a, b) => {
        if (activeSet === 'all' && groupBySet) {
          const setDiff = setOrder.indexOf(a.set) - setOrder.indexOf(b.set);
          if (setDiff !== 0) return setDiff;
        }
        const aNum = parseInt(a.collector_number, 10) || 0;
        const bNum = parseInt(b.collector_number, 10) || 0;
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
      return cards.map((card) => ({ card, variant: null, sortPrice: null }));
    }

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

  const visibleCards = useMemo(
    () => sortedFilteredCards.slice(0, renderLimit),
    [sortedFilteredCards, renderLimit]
  );

  const canExpandRender = renderLimit < sortedFilteredCards.length;
  const isNetworkFetching = useMemo(() => {
    if (activeSet === 'all') {
      return setOrder.some((id) => getStateForSet(setPages, id).isFetching);
    }
    return getStateForSet(setPages, activeSet).isFetching;
  }, [activeSet, setOrder, setPages]);

  const networkHasMore = useMemo(() => {
    if (activeSet === 'all') return allNetworkTargetSet !== null;
    return getStateForSet(setPages, activeSet).hasMore || !!getStateForSet(setPages, activeSet).error;
  }, [activeSet, allNetworkTargetSet, setPages]);

  const loadMoreError = useMemo(() => {
    if (activeSet === 'all') {
      return allNetworkTargetSet ? getStateForSet(setPages, allNetworkTargetSet).error : null;
    }
    return getStateForSet(setPages, activeSet).error;
  }, [activeSet, allNetworkTargetSet, setPages]);

  const isCompletingSearch = useMemo(() => {
    if (!isSearchActive || activeSet === 'all') return false;
    const state = getStateForSet(setPages, activeSet);
    return state.initialized && (state.hasMore || state.isFetching);
  }, [isSearchActive, activeSet, setPages]);

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
    inFlightRef.current.clear();
    setSetPages({});
    setRenderLimit(renderBatchSize);
  }, [renderBatchSize]);

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
