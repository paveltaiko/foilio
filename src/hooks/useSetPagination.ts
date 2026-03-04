import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import type { ScryfallCard, SetCode } from '../types/card';
import type { CollectionSet } from '../config/collections';
import { fetchCardsPageForSet, fetchSetCardCount } from '../services/scryfall';
import { getCachedSetPage, setCachedSetPage, invalidateCachedSetPage } from '../utils/scryfallCache';
import { mergeCards } from '../utils/cardFiltering';

const FETCH_DELAY_MS = 100;

export interface SetPaginationState {
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

function getStateForSet(map: Record<string, SetPaginationState>, setId: string): SetPaginationState {
  return map[setId] ?? EMPTY_STATE;
}

interface UseSetPaginationOptions {
  sets: CollectionSet[];
  visibleSetIds?: string[];
  activeSet: SetCode;
  searchQuery: string;
}

export function useSetPagination({ sets, visibleSetIds, activeSet, searchQuery }: UseSetPaginationOptions) {
  const [setPages, setSetPages] = useState<Record<string, SetPaginationState>>({});
  const [setTotals, setSetTotals] = useState<Record<string, number>>({});

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

  // Hydrate setPages from localStorage on first load
  useEffect(() => {
    if (setOrder.length === 0) return;
    setSetPages((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const setId of setOrder) {
        if (next[setId]?.initialized) continue;
        const cached = getCachedSetPage(setId);
        if (!cached) continue;
        next[setId] = {
          cards: cached.cards,
          nextPage: cached.nextPage,
          hasMore: cached.hasMore,
          isFetching: false,
          initialized: true,
          error: null,
        };
        changed = true;
      }
      return changed ? next : prev;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setOrder]);

  // Cleanup in-flight tracking on unmount
  useEffect(() => {
    return () => {
      inFlightRef.current.clear();
    };
  }, []);

  // Load totals for each set
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
        const mergedCards = mergeCards(current.cards, page.cards);
        // Persist to localStorage after each successful fetch
        setCachedSetPage(setId, {
          cards: mergedCards,
          nextPage: page.nextPage,
          hasMore: page.hasMore,
        });
        return {
          ...prev,
          [setId]: {
            ...current,
            cards: mergedCards,
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

  // Load initial page for active set
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

  // Complete search data for single set
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

  // Complete search data for all sets
  useEffect(() => {
    if (!isSearchActive || activeSet !== 'all') return;
    let cancelled = false;

    const completeSearchDataForAll = async () => {
      while (!cancelled) {
        let foundTarget: string | null = null;
        for (const setId of setOrder) {
          const state = getStateForSet(setPagesRef.current, setId);
          if (!state.initialized || state.hasMore || state.error) {
            foundTarget = setId;
            break;
          }
        }
        if (!foundTarget) break;
        const state = getStateForSet(setPagesRef.current, foundTarget);
        if (state.isFetching) {
          await new Promise((resolve) => setTimeout(resolve, FETCH_DELAY_MS));
          continue;
        }
        const loaded = await fetchNextPageForSet(foundTarget);
        if (!loaded) break;
        await new Promise((resolve) => setTimeout(resolve, FETCH_DELAY_MS));
      }
    };

    void completeSearchDataForAll();
    return () => {
      cancelled = true;
    };
  }, [isSearchActive, activeSet, setOrder, fetchNextPageForSet, setPages]);

  // Derived card maps
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
      return !first.initialized;
    }
    const state = getStateForSet(setPages, activeSet);
    return !state.initialized;
  }, [activeSet, setOrder, setPages]);

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
    if (!isSearchActive) return false;
    if (activeSet === 'all') {
      return setOrder.some((setId) => {
        const state = getStateForSet(setPages, setId);
        return state.initialized && (state.hasMore || state.isFetching);
      });
    }
    const state = getStateForSet(setPages, activeSet);
    return state.initialized && (state.hasMore || state.isFetching);
  }, [isSearchActive, activeSet, setPages, setOrder]);

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

  const refreshCards = useCallback(() => {
    inFlightRef.current.clear();
    setSetPages({});
    for (const setId of setOrder) {
      invalidateCachedSetPage(setId);
    }
  }, [setOrder]);

  return {
    setOrder,
    allSetIds,
    cardsBySet,
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
    refreshCards,
  };
}
