import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Share, Check, Layers, LayoutGrid, SlidersHorizontal, RotateCcw, Settings } from 'lucide-react';
import { Link } from 'react-router';
import type { User } from 'firebase/auth';
import { isFirebaseConfigured } from '../config/firebase';
import { useOwnedCards } from '../hooks/useOwnedCards';
import { useCardCollection } from '../hooks/useCardCollection';
import { useSecretLairCollection } from '../hooks/useSecretLairCollection';
import { useSecretLairDropSettings } from '../hooks/useSecretLairDropSettings';
import { useCollectionsSettings } from './lab/useCollectionsSettings';
import { getVisibleSets } from './lab/collectionsSettings';
import { collectionSets } from '../config/collections';
import { secretLairDrops } from '../config/secretLairDrops';
import { toggleCardOwnership, updateCardQuantity } from '../services/firestore';
import { getExistingShareToken, getOrCreateShareToken } from '../services/sharing';
import { SortControl } from '../components/filters/SortControl';
import { OwnershipFilter } from '../components/filters/OwnershipFilter';
import { BoosterFilter } from '../components/filters/BoosterFilter';
import { FilterDrawer } from '../components/filters/FilterDrawer';
import { SearchInput } from '../components/filters/SearchInput';
import { CollectionSummary } from '../components/stats/CollectionSummary';
import { CardGrid, CardGridSkeleton } from '../components/cards/CardGrid';
import { CardDetail } from '../components/cards/CardDetail';
import { PullToRefresh } from '../components/ui/PullToRefresh';
import { Tabs } from '../components/ui/Tabs';
import type { CardVariant } from '../types/card';

interface HomePageProps {
  user: User;
  isSearchOpen: boolean;
  onSearchClose: () => void;
}

type ShareToastType = 'success' | 'error';

interface ShareFeedbackToastProps {
  message: string | null;
  type: ShareToastType;
}

function ShareFeedbackToast({ message, type }: ShareFeedbackToastProps) {
  if (!message) return null;

  return (
    <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 px-2">
      <div
        className={`rounded-lg px-3 py-2 text-xs font-medium shadow-md ${
          type === 'success'
            ? 'bg-neutral-900 text-white'
            : 'bg-red-600 text-white'
        }`}
        role="status"
        aria-live="polite"
      >
        {message}
      </div>
    </div>
  );
}

function ShareIconButton({
  user,
  onTokenReady,
  onFeedback,
}: {
  user: User;
  onTokenReady: (token: string) => void;
  onFeedback: (message: string, type: ShareToastType) => void;
}) {
  const [succeeded, setSucceeded] = useState(false);
  const [loading, setLoading] = useState(false);

  const copyText = async (text: string): Promise<boolean> => {
    // Modern clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // fallback below
      }
    }

    // Legacy fallback
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  };

  const isMobileDevice = () => {
    const userAgent = navigator.userAgent ?? '';
    const looksMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);
    return looksMobile || navigator.maxTouchPoints > 1;
  };

  const handleShare = async () => {
    if (loading) return;
    try {
      setLoading(true);
      const token = await getOrCreateShareToken({
        uid: user.uid,
        displayName: user.displayName ?? null,
        photoURL: user.photoURL ?? null,
      });
      onTokenReady(token);
      const url = `${window.location.origin}/share/${token}`;

      const shouldUseNativeShare = isMobileDevice() && typeof navigator.share === 'function';
      if (shouldUseNativeShare) {
        await navigator.share({
          title: 'Foilio collection',
          text: 'Check out my MTG collection',
          url,
        });
        onFeedback('Shared', 'success');
      } else {
        const copiedOk = await copyText(url);
        if (!copiedOk) {
          window.prompt('Copy this link:', url);
        }
        onFeedback('Link copied', 'success');
      }
      setSucceeded(true);
      setTimeout(() => setSucceeded(false), 2000);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      setSucceeded(false);
      void err;
      onFeedback('Could not create share link. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={loading}
      aria-label="Share collection"
      title="Share collection"
      className="flex items-center justify-center h-[38px] w-[38px] cursor-pointer transition-colors duration-150 border rounded-lg bg-white text-neutral-500 border-surface-border hover:text-neutral-700 hover:bg-neutral-50 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-neutral-300 border-t-neutral-500 rounded-full animate-spin" aria-hidden="true" />
      ) : succeeded ? (
        <Check className="w-[18px] h-[18px] text-owned" />
      ) : (
        <Share className="w-[18px] h-[18px]" />
      )}
    </button>
  );
}

export function HomePage({ user, isSearchOpen, onSearchClose }: HomePageProps) {
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
    cardCounts: ubCardCounts, stats: ubStats, sortedFilteredCards: ubSortedFilteredCards, visibleCards: ubVisibleCards,
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
    cardCounts: slCardCounts, stats: slStats, sortedFilteredCards: slSortedFilteredCards, visibleCards: slVisibleCards,
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

  const stats = useMemo(() => {
    if (isSLMode) return slStats;
    if (isAllTab) return {
      totalCards: ubStats.totalCards + slStats.totalCards,
      ownedCount: ubStats.ownedCount + slStats.ownedCount,
      totalValue: ubStats.totalValue + slStats.totalValue,
      percentage: ubStats.totalCards + slStats.totalCards > 0
        ? Math.round(((ubStats.ownedCount + slStats.ownedCount) / (ubStats.totalCards + slStats.totalCards)) * 100)
        : 0,
    };
    return ubStats;
  }, [isSLMode, isAllTab, ubStats, slStats]);

  // Sloučené card counts pro lištu tabů
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

          {/* Stats */}
          <div className="py-2">
            <CollectionSummary
              totalCards={stats.totalCards}
              ownedCount={stats.ownedCount}
              totalValue={stats.totalValue}
              percentage={stats.percentage}
            />
          </div>

          {/* Toolbar */}
          <div className="pb-4 space-y-2">
            {/* Mobile toolbar: filter button + sort */}
            <div className="flex items-center justify-between gap-2 md:hidden">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsFilterDrawerOpen(true)}
                  title="Open filters"
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-600 bg-white border border-surface-border rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="flex items-center justify-center w-5 h-5 text-[11px] font-bold bg-primary-500 text-white rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    title="Reset filters"
                    className="flex items-center justify-center h-[38px] w-[38px] cursor-pointer transition-colors duration-150 border rounded-lg bg-white text-neutral-500 border-surface-border hover:text-neutral-700 hover:bg-neutral-50"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!isSLMode && activeTab === 'all' && (
                  <button
                    onClick={() => setGroupBySet(!groupBySet)}
                    title={groupBySet ? 'Show all at once' : 'Group by set'}
                    className={`
                      flex items-center justify-center h-[38px] w-[38px] cursor-pointer transition-colors duration-150
                      border rounded-lg
                      ${groupBySet
                        ? 'bg-primary-500 text-white border-primary-500'
                        : 'bg-white text-neutral-500 border-neutral-200 hover:text-neutral-700 hover:bg-neutral-50'
                      }
                    `}
                  >
                    {groupBySet ? <Layers className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
                  </button>
                )}
                {isFirebaseConfigured && (
                  <ShareIconButton
                    user={user}
                    onTokenReady={setShareToken}
                    onFeedback={(message, type) => {
                      setShareToastType(type);
                      setShareToastMessage(message);
                    }}
                  />
                )}
              </div>
            </div>

            {/* Desktop toolbar: ownership + sort + booster + groupby + reset */}
            <div className="hidden md:flex items-center gap-4">
              <OwnershipFilter value={activeOwnershipFilter} onChange={setActiveOwnershipFilter} />
              <SortControl value={activeSortOption} onChange={setActiveSortOption} />
              {!isSLMode && hasBoosterData && (
                <BoosterFilter
                  value={boosterFilter}
                  onChange={setBoosterFilter}
                  isLoading={boosterMapLoading}
                />
              )}
              {!isSLMode && activeTab === 'all' && (
                <button
                  onClick={() => setGroupBySet(!groupBySet)}
                  title={groupBySet ? 'Show all at once' : 'Group by set'}
                  className={`
                    p-2 cursor-pointer transition-colors duration-150 relative
                    border rounded-lg text-sm font-medium
                    ${groupBySet
                      ? 'bg-primary-500 text-white border-primary-500 z-10'
                      : 'bg-white text-neutral-500 border-neutral-200 hover:text-neutral-700 hover:bg-neutral-50 z-0'
                    }
                  `}
                >
                  {groupBySet ? <Layers className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
                </button>
              )}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  title="Reset filters"
                  className="p-2 cursor-pointer transition-colors duration-150 border rounded-lg text-sm font-medium bg-white text-neutral-500 border-neutral-200 hover:text-neutral-700 hover:bg-neutral-50"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
              {isFirebaseConfigured && (
                <ShareIconButton
                  user={user}
                  onTokenReady={setShareToken}
                  onFeedback={(message, type) => {
                    setShareToastType(type);
                    setShareToastMessage(message);
                  }}
                />
              )}
            </div>
          </div>

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
