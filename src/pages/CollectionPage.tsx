import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Settings } from 'lucide-react';
import { Link } from 'react-router';
import type { User } from 'firebase/auth';
import { useOwnedCards } from '../hooks/useOwnedCards';
import { useCardCollection } from '../hooks/useCardCollection';
import { useSecretLairCollection } from '../hooks/useSecretLairCollection';
import { useSecretLairDropSettings } from '../hooks/useSecretLairDropSettings';
import { useCollectionsSettings } from './lab/useCollectionsSettings';
import { getVisibleSets } from './lab/collectionsSettings';
import { collectionSets } from '../config/collections';
import { secretLairDrops } from '../config/secretLairDrops';
import { isFirebaseConfigured } from '../config/firebase';
import { toggleCardOwnership, updateCardQuantity } from '../services/firestore';
import { getExistingShareToken } from '../services/sharing';
import { FilterDrawer } from '../components/filters/FilterDrawer';
import { SearchInput } from '../components/filters/SearchInput';
import { CardGrid, CardGridSkeleton } from '../components/cards/CardGrid';
import { CardDetail } from '../components/cards/CardDetail';
import { PullToRefresh } from '../components/ui/PullToRefresh';
import { Tabs } from '../components/ui/Tabs';
import { CollectionToolbar } from '../components/collection/CollectionToolbar';
import { ShareFeedbackToast } from '../components/collection/ShareFeedbackToast';
import type { ShareToastType } from '../components/collection/ShareCollectionButton';
import type { CardVariant } from '../types/card';

interface CollectionPageProps {
  user: User;
  isSearchOpen: boolean;
  onSearchClose: () => void;
}

export function CollectionPage({ user, isSearchOpen, onSearchClose }: CollectionPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [shareToastMessage, setShareToastMessage] = useState<string | null>(null);
  const [shareToastType, setShareToastType] = useState<ShareToastType>('success');
  const [selectedVariant, setSelectedVariant] = useState<CardVariant>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  // Unified active tab — buď UB set ID nebo SLD drop ID
  const [activeTab, setActiveTab] = useState<string>('all');
  const { ownedCards, updateLocal } = useOwnedCards(user.uid);

  useEffect(() => {
    if (!shareToastMessage) return;
    const timeoutId = window.setTimeout(() => {
      setShareToastMessage(null);
    }, 2200);
    return () => window.clearTimeout(timeoutId);
  }, [shareToastMessage]);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    let cancelled = false;
    getExistingShareToken(user.uid)
      .then((token) => {
        if (!cancelled) {
          setShareToken(token);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setShareToken(null);
        }
      });
    return () => { cancelled = true; };
  }, [user.uid]);

  // UB settings
  const { settings: collectionSettings, isLoading: isSettingsLoading } = useCollectionsSettings();
  const visibleCollectionSets = getVisibleSets(collectionSettings, collectionSets);
  const settingsInitialized = Object.keys(collectionSettings.collections).length > 0;
  const visibleSetIds: string[] | undefined = settingsInitialized
    ? visibleCollectionSets.map((s) => s.id)
    : undefined;

  // SL drop settings
  const { enabledDropIds } = useSecretLairDropSettings();
  const enabledDrops = useMemo(
    () => secretLairDrops.filter((d) => enabledDropIds.has(d.id)),
    [enabledDropIds]
  );
  const enabledDropIdSet = useMemo(() => new Set(enabledDrops.map((d) => d.id)), [enabledDrops]);

  // Aktivní mode — odvozeno z activeTab
  const isSLMode = activeTab !== 'all' && enabledDropIdSet.has(activeTab);

  // UB hook — vždy volaný, ale pro tab předáváme správnou hodnotu
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
    cardCounts: ubCardCounts, sortedFilteredCards: ubSortedFilteredCards, visibleCards: ubVisibleCards,
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

  // SL hook
  const {
    setActiveDrop,
    sortOption: slSortOption, setSortOption: slSetSortOption,
    ownershipFilter: slOwnershipFilter, setOwnershipFilter: slSetOwnershipFilter,
    selectedCard: slSelectedCard, setSelectedCard: slSetSelectedCard,
    currentCards: slCurrentCards, isCardsLoading: slIsCardsLoading,
    cardCounts: slCardCounts, sortedFilteredCards: slSortedFilteredCards, visibleCards: slVisibleCards,
    hasNextPage: slHasNextPage, loadNextPage: slLoadNextPage,
    refreshCards: slRefreshCards,
  } = useSecretLairCollection({
    ownedCards,
    searchQuery,
    drops: enabledDrops,
    active: enabledDrops.length > 0, // vždy aktivní pokud jsou povolené dropy — potřebné pro Full Collection
  });

  // Sync SL activeDrop
  useEffect(() => {
    if (isSLMode) {
      setActiveDrop(activeTab);
    }
  }, [isSLMode, activeTab, setActiveDrop]);

  // Aliases
  const isAllTab = activeTab === 'all';
  const selectedCard = isSLMode ? slSelectedCard : ubSelectedCard;
  const setSelectedCard = isSLMode ? slSetSelectedCard : ubSetSelectedCard;
  const isCardsLoading = isSettingsLoading || (isSLMode ? slIsCardsLoading : ubIsCardsLoading || (isAllTab && slIsCardsLoading));

  // Fade-in přechod: inkrementuje se pokaždé když loading přejde true → false
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

  // Pro Full Collection tab sloučíme UB + SL karty a stats
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

  //Sloučené card counts pro lištu tabů
  const mergedCardCounts = useMemo(() => {
    const merged: Record<string, number> = { ...ubCardCounts };
    for (const drop of enabledDrops) {
      merged[drop.id] = slCardCounts[drop.id] ?? 0;
    }
    // 'all' count = UB + SL celkem
    merged['all'] = (ubCardCounts['all'] ?? 0) + (slCardCounts['all'] ?? 0);
    return merged;
  }, [ubCardCounts, slCardCounts, enabledDrops]);

  // Sloučené taby
  const allTabs = useMemo(() => {
    const ubTabs = [
      { id: 'all', label: 'Full Collection', count: mergedCardCounts['all'] },
      ...(visibleSetIds ?? []).map((setId) => {
        const set = collectionSets.find((s) => s.id === setId);
        return { id: setId, label: set?.name ?? setId, count: mergedCardCounts[setId] };
      }),
    ];
    const slTabs = enabledDrops.map((drop) => ({
      id: drop.id,
      label: drop.name,
      count: mergedCardCounts[drop.id],
    }));
    return [...ubTabs, ...slTabs];
  }, [visibleSetIds, enabledDrops, mergedCardCounts]);

  // Reset booster filter when switching to a set that has no booster data
  useEffect(() => {
    if (!hasBoosterData && boosterFilter !== 'all') {
      setBoosterFilter('all');
    }
  }, [hasBoosterData, boosterFilter, setBoosterFilter]);

  const activeFilterCount = (boosterFilter !== 'all' && hasBoosterData && !isSLMode ? 1 : 0) + (activeOwnershipFilter !== 'all' ? 1 : 0);
  const hasActiveFilters = (boosterFilter !== 'all' && hasBoosterData && !isSLMode) || activeOwnershipFilter !== 'all' || activeSortOption !== 'number-asc';

  const handleResetFilters = useCallback(() => {
    if (!isSLMode) {
      setBoosterFilter('all');
      setOwnershipFilter('all');
      setSortOption('number-asc');
    } else {
      slSetOwnershipFilter('all');
      slSetSortOption('number-asc');
    }
  }, [isSLMode, setBoosterFilter, setOwnershipFilter, setSortOption, slSetOwnershipFilter, slSetSortOption]);

  // Handlers
  const handleToggle = useCallback(
    (cardId: string, variant: 'nonfoil' | 'foil') => {
      const card = currentCards.find((c) => c.id === cardId);
      if (!card) return;

      if (isFirebaseConfigured) {
        void toggleCardOwnership(user.uid, cardId, {
          set: card.set,
          collectorNumber: card.collector_number,
          name: card.name,
        }, variant, ownedCards.get(cardId), shareToken ?? undefined);
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
              addedAt: existing?.addedAt ?? new Date(),
              updatedAt: new Date(),
            });
          }
          return next;
        });
      }
    },
    [user.uid, currentCards, ownedCards, shareToken, updateLocal]
  );

  // Handler for quantity change
  const handleQuantityChange = useCallback(
    (cardId: string, variant: 'nonfoil' | 'foil', quantity: number) => {
      const card = currentCards.find((c) => c.id === cardId);
      const existing = ownedCards.get(cardId);
      if (!card || !existing) return;

      if (isFirebaseConfigured) {
        void updateCardQuantity(user.uid, cardId, variant, quantity, existing, shareToken ?? undefined);
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
    [user.uid, currentCards, ownedCards, shareToken, updateLocal]
  );

  const handleRefresh = useCallback(async () => {
    if (!isSLMode) refreshCards();
    else slRefreshCards();
  }, [isSLMode, refreshCards, slRefreshCards]);

  const noUBCollectionSelected = !isSLMode && !isSettingsLoading && settingsInitialized && visibleSetIds !== undefined && visibleSetIds.length === 0;

  return (
    <>
      <PullToRefresh onRefresh={handleRefresh} disabled={isSearchOpen || !!selectedCard || isFilterDrawerOpen}>
        <div className="app-container-padded safe-bottom touch-pan-y">
          {/* Unified tabs — UB sety + enabled SL dropy */}
          <Tabs
            tabs={allTabs}
            activeTab={activeTab}
            onChange={setActiveTab}
          />

          {/* Toolbar */}
          <CollectionToolbar
            user={user}
            isSLMode={isSLMode}
            activeTab={activeTab}
            sortOption={activeSortOption}
            onSortChange={setActiveSortOption}
            ownershipFilter={activeOwnershipFilter}
            onOwnershipChange={setActiveOwnershipFilter}
            boosterFilter={boosterFilter}
            onBoosterChange={setBoosterFilter}
            boosterMapLoading={boosterMapLoading}
            hasBoosterData={hasBoosterData}
            groupBySet={groupBySet}
            onGroupBySetToggle={() => setGroupBySet(!groupBySet)}
            activeFilterCount={activeFilterCount}
            hasActiveFilters={hasActiveFilters}
            onReset={handleResetFilters}
            onFilterDrawerOpen={() => setIsFilterDrawerOpen(true)}
            onTokenReady={setShareToken}
            onShareFeedback={(message, type) => {
              setShareToastType(type);
              setShareToastMessage(message);
            }}
          />

          {/* Card grid */}
          {isCardsLoading ? (
            <CardGridSkeleton />
          ) : noUBCollectionSelected ? (
            <div key={gridKey} className="animate-fade-in flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-neutral-100 mb-4">
                <Settings className="w-7 h-7 text-neutral-400" />
              </div>
              <h2 className="text-base font-semibold text-neutral-800 mb-1">No collection selected</h2>
              <p className="text-sm text-neutral-500 max-w-xs mb-5">
                Enable a collection in Settings to start tracking your cards.
              </p>
              <Link
                to="/settings"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Open Settings
              </Link>
            </div>
          ) : (
            <div key={gridKey} className="animate-fade-in space-y-3">
              {!isSLMode && (isCompletingSearch || isFetchingNextPage || isComputingTotalValue) && (
                <p className="text-xs text-neutral-500">
                  {isComputingTotalValue
                    ? 'Calculating total collection value…'
                    : isCompletingSearch
                      ? 'Searching through remaining cards…'
                      : 'Loading more cards…'}
                </p>
              )}
              <CardGrid
                cards={visibleCards}
                ownedCards={ownedCards}
                onToggle={handleToggle}
                onCardClick={(card, variant) => {
                  setSelectedCard(card);
                  setSelectedVariant(variant);
                }}
                groupBySet={!isSLMode && activeTab === 'all' && groupBySet && searchQuery.trim().length === 0}
                sets={collectionSets}
                onLoadMore={!isSLMode ? loadNextPage : slLoadNextPage}
                hasMore={!isSLMode ? hasNextPage : slHasNextPage}
                isLoadingMore={!isSLMode ? isFetchingNextPage : false}
                loadMoreError={!isSLMode ? loadMoreError : null}
              />
            </div>
          )}
        </div>
      </PullToRefresh>

      {/* Mobile filter drawer */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        boosterFilter={boosterFilter}
        onBoosterChange={setBoosterFilter}
        ownershipFilter={activeOwnershipFilter}
        onOwnershipChange={setActiveOwnershipFilter}
        sortOption={activeSortOption}
        onSortChange={setActiveSortOption}
        boosterMapLoading={boosterMapLoading}
        showBoosterFilter={!isSLMode && hasBoosterData}
        hasActiveFilters={hasActiveFilters}
        onReset={handleResetFilters}
      />

      {/* Card detail modal */}
      <CardDetail
        card={selectedCard}
        selectedVariant={selectedVariant}
        owned={selectedCard ? ownedCards.get(selectedCard.id) : undefined}
        onClose={() => {
          setSelectedCard(null);
          setSelectedVariant(null);
        }}
        onToggle={handleToggle}
        onQuantityChange={handleQuantityChange}
        cards={sortedFilteredCards}
        onNavigate={(card, variant) => {
          setSelectedCard(card);
          setSelectedVariant(variant);
        }}
      />

      {/* Search overlay */}
      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        isOpen={isSearchOpen}
        onClose={onSearchClose}
      />

      <ShareFeedbackToast message={shareToastMessage} type={shareToastType} />
    </>
  );
}
