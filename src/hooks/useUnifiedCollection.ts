import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useCardCollection } from './useCardCollection';
import { useSecretLairCollection } from './useSecretLairCollection';
import { useSecretLairDropSettings } from './useSecretLairDropSettings';
import { useCollectionsSettings } from './useCollectionsSettings';
import { getVisibleSets } from '../utils/collectionsSettings';
import { collectionSets } from '../config/collections';
import { secretLairDrops } from '../config/secretLairDrops';
import type { OwnedCard, ScryfallCard, CardVariant, CardWithVariant, SortOption, OwnershipFilter, BoosterFilter } from '../types/card';

interface UseUnifiedCollectionOptions {
  ownedCards: Map<string, OwnedCard>;
  searchQuery: string;
}

export function useUnifiedCollection({ ownedCards, searchQuery }: UseUnifiedCollectionOptions) {
  // ── Tab state ─────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedVariant, setSelectedVariant] = useState<CardVariant>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // ── UB settings ───────────────────────────────────────────────────────
  const { settings: collectionSettings, isLoading: isSettingsLoading } = useCollectionsSettings();
  const visibleCollectionSets = getVisibleSets(collectionSettings, collectionSets);
  const settingsInitialized = Object.keys(collectionSettings.collections).length > 0;
  const visibleSetIds: string[] | undefined = settingsInitialized
    ? visibleCollectionSets.map((s) => s.id)
    : undefined;

  // ── SL drop settings ─────────────────────────────────────────────────
  const { enabledDropIds } = useSecretLairDropSettings();
  const enabledDrops = useMemo(
    () => secretLairDrops.filter((d) => enabledDropIds.has(d.id)),
    [enabledDropIds]
  );
  const enabledDropIdSet = useMemo(() => new Set(enabledDrops.map((d) => d.id)), [enabledDrops]);

  // ── Mode derivation ───────────────────────────────────────────────────
  const isSLMode = activeTab !== 'all' && enabledDropIdSet.has(activeTab);
  const isAllTab = activeTab === 'all';

  // ── UB hook ───────────────────────────────────────────────────────────
  const ubActiveSet = isSLMode ? 'all' : activeTab;
  const {
    setActiveSet: ubSetActiveSet,
    sortOption, setSortOption,
    ownershipFilter, setOwnershipFilter,
    boosterFilter, setBoosterFilter,
    boosterMapLoading,
    selectedCard: ubSelectedCard, setSelectedCard: ubSetSelectedCard,
    groupBySet, setGroupBySet,
    currentCards: ubCurrentCards, isCardsLoading: ubIsCardsLoading,
    cardCounts: ubCardCounts, ownedCountBySet: ubOwnedCountBySet, sortedFilteredCards: ubSortedFilteredCards, visibleCards: ubVisibleCards,
    hasBoosterData,
    isFetchingNextPage,
    hasNextPage,
    loadNextPage,
    loadMoreError,
    isCompletingSearch,
    isComputingTotalValue,
    refreshCards,
  } = useCardCollection({ ownedCards, searchQuery, visibleSetIds, sets: collectionSets });

  // Sync ubActiveSet do hooku
  useEffect(() => {
    ubSetActiveSet(ubActiveSet);
  }, [ubActiveSet, ubSetActiveSet]);

  // ── SL hook ───────────────────────────────────────────────────────────
  const {
    setActiveDrop,
    sortOption: slSortOption, setSortOption: slSetSortOption,
    ownershipFilter: slOwnershipFilter, setOwnershipFilter: slSetOwnershipFilter,
    selectedCard: slSelectedCard, setSelectedCard: slSetSelectedCard,
    currentCards: slCurrentCards, isCardsLoading: slIsCardsLoading,
    cardCounts: slCardCounts, ownedCountByDrop: slOwnedCountByDrop, sortedFilteredCards: slSortedFilteredCards, visibleCards: slVisibleCards,
    hasNextPage: slHasNextPage, loadNextPage: slLoadNextPage,
    refreshCards: slRefreshCards,
  } = useSecretLairCollection({
    ownedCards,
    searchQuery,
    drops: enabledDrops,
    active: enabledDrops.length > 0,
  });

  // Sync SL activeDrop
  useEffect(() => {
    if (isSLMode) {
      setActiveDrop(activeTab);
    }
  }, [isSLMode, activeTab, setActiveDrop]);

  // ── Unified aliases ───────────────────────────────────────────────────
  const selectedCard = isSLMode ? slSelectedCard : ubSelectedCard;
  const setSelectedCard = isSLMode ? slSetSelectedCard : ubSetSelectedCard;
  const isCardsLoading = isSettingsLoading || (isSLMode ? slIsCardsLoading : ubIsCardsLoading || (isAllTab && slIsCardsLoading));

  // Fade-in přechod
  const prevLoadingRef = useRef(isCardsLoading);
  const [gridKey, setGridKey] = useState(0);
  useEffect(() => {
    if (prevLoadingRef.current && !isCardsLoading) {
      setGridKey((k) => k + 1);
    }
    prevLoadingRef.current = isCardsLoading;
  }, [isCardsLoading]);

  const activeSortOption = isSLMode ? slSortOption : sortOption;
  const setActiveSortOption = isSLMode ? slSetSortOption : setSortOption;
  const activeOwnershipFilter = isSLMode ? slOwnershipFilter : ownershipFilter;
  const setActiveOwnershipFilter = isSLMode ? slSetOwnershipFilter : setOwnershipFilter;

  // ── Merged cards ──────────────────────────────────────────────────────
  const currentCards = useMemo(() => {
    if (isSLMode) return slCurrentCards;
    if (isAllTab) return [...ubCurrentCards, ...slSortedFilteredCards.map((c) => c.card)];
    return ubCurrentCards;
  }, [isSLMode, isAllTab, ubCurrentCards, slCurrentCards, slSortedFilteredCards]);

  const sortedFilteredCards = useMemo(() => {
    if (isSLMode) return slSortedFilteredCards;
    if (isAllTab) return [...ubSortedFilteredCards, ...slSortedFilteredCards];
    return ubSortedFilteredCards;
  }, [isSLMode, isAllTab, ubSortedFilteredCards, slSortedFilteredCards]);

  const visibleCards = useMemo(() => {
    if (isSLMode) return slVisibleCards;
    if (isAllTab) return [...ubVisibleCards, ...slVisibleCards];
    return ubVisibleCards;
  }, [isSLMode, isAllTab, ubVisibleCards, slVisibleCards]);

  // ── Merged counts & tabs ──────────────────────────────────────────────
  const mergedCardCounts = useMemo(() => {
    const merged: Record<string, number> = { ...ubCardCounts };
    for (const drop of enabledDrops) {
      merged[drop.id] = slCardCounts[drop.id] ?? 0;
    }
    merged['all'] = (ubCardCounts['all'] ?? 0) + (slCardCounts['all'] ?? 0);
    return merged;
  }, [ubCardCounts, slCardCounts, enabledDrops]);

  const mergedOwnedCounts = useMemo(() => {
    const merged: Record<string, number> = { ...ubOwnedCountBySet };
    for (const drop of enabledDrops) {
      merged[drop.id] = slOwnedCountByDrop[drop.id] ?? 0;
    }
    const ubAll = Object.values(ubOwnedCountBySet).reduce((s, v) => s + v, 0);
    const slAll = slOwnedCountByDrop['all'] ?? 0;
    merged['all'] = ubAll + slAll;
    return merged;
  }, [ubOwnedCountBySet, slOwnedCountByDrop, enabledDrops]);

  const allTabs = useMemo(() => {
    const ubTabs = [
      { id: 'all', label: 'Full Collection', count: mergedCardCounts['all'], ownedCount: mergedOwnedCounts['all'] },
      ...(visibleSetIds ?? []).map((setId) => {
        const set = collectionSets.find((s) => s.id === setId);
        return { id: setId, label: set?.name ?? setId, count: mergedCardCounts[setId], ownedCount: mergedOwnedCounts[setId] };
      }),
    ];
    const slTabs = enabledDrops.map((drop) => ({
      id: drop.id,
      label: drop.name,
      count: mergedCardCounts[drop.id],
      ownedCount: mergedOwnedCounts[drop.id],
    }));
    return [...ubTabs, ...slTabs];
  }, [visibleSetIds, enabledDrops, mergedCardCounts, mergedOwnedCounts]);

  // ── Filter logic ──────────────────────────────────────────────────────
  // Reset booster filter when switching to a set that has no booster data
  useEffect(() => {
    if (!hasBoosterData && boosterFilter !== 'all') {
      setBoosterFilter('all');
    }
  }, [hasBoosterData, boosterFilter, setBoosterFilter]);

  const activeFilterCount = (boosterFilter !== 'all' && hasBoosterData && !isSLMode ? 1 : 0) + (activeOwnershipFilter !== 'all' ? 1 : 0);
  const hasActiveFilters = (boosterFilter !== 'all' && hasBoosterData && !isSLMode) || activeOwnershipFilter !== 'all' || activeSortOption !== 'number-asc' || (!isSLMode && !groupBySet);

  const handleResetFilters = useCallback(() => {
    if (!isSLMode) {
      setBoosterFilter('all');
      setOwnershipFilter('all');
      setSortOption('number-asc');
      setGroupBySet(true);
    } else {
      slSetOwnershipFilter('all');
      slSetSortOption('number-asc');
    }
  }, [isSLMode, setBoosterFilter, setOwnershipFilter, setSortOption, setGroupBySet, slSetOwnershipFilter, slSetSortOption]);

  const handleRefresh = useCallback(async () => {
    if (!isSLMode) refreshCards();
    else slRefreshCards();
  }, [isSLMode, refreshCards, slRefreshCards]);

  // ── Computed flags ────────────────────────────────────────────────────
  const noCollectionSelected = !isSLMode && !isSettingsLoading && settingsInitialized && visibleSetIds !== undefined && visibleSetIds.length === 0;

  return {
    // Tab
    activeTab,
    setActiveTab,
    isSLMode,
    isAllTab,

    // Card selection
    selectedCard,
    setSelectedCard,
    selectedVariant,
    setSelectedVariant,

    // Filter drawer
    isFilterDrawerOpen,
    setIsFilterDrawerOpen,

    // Filter & sort
    activeSortOption,
    setActiveSortOption,
    activeOwnershipFilter,
    setActiveOwnershipFilter,
    boosterFilter,
    setBoosterFilter,
    boosterMapLoading,
    hasBoosterData,
    groupBySet,
    setGroupBySet: () => setGroupBySet(!groupBySet),
    activeFilterCount,
    hasActiveFilters,
    handleResetFilters,

    // Cards data
    currentCards,
    sortedFilteredCards,
    visibleCards,
    isCardsLoading,
    gridKey,

    // Tabs
    allTabs,

    // Pagination
    hasNextPage: !isSLMode ? hasNextPage : slHasNextPage,
    loadNextPage: !isSLMode ? loadNextPage : slLoadNextPage,
    isFetchingNextPage: !isSLMode ? isFetchingNextPage : false,
    loadMoreError: !isSLMode ? loadMoreError : null,
    isCompletingSearch: !isSLMode ? isCompletingSearch : false,
    isComputingTotalValue: !isSLMode ? isComputingTotalValue : false,

    // Refresh
    handleRefresh,

    // Flags
    noCollectionSelected,

    // Settings (needed for share sync)
    visibleSetIds,
  };
}
