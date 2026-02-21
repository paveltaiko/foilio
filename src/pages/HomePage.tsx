import { useState, useCallback, useEffect } from 'react';
import { Share, Check, Layers, LayoutGrid, SlidersHorizontal, RotateCcw } from 'lucide-react';
import type { User } from 'firebase/auth';
import { useQueryClient } from '@tanstack/react-query';
import { isFirebaseConfigured } from '../config/firebase';
import { useOwnedCards } from '../hooks/useOwnedCards';
import { useCardCollection } from '../hooks/useCardCollection';
import { toggleCardOwnership, updateCardQuantity } from '../services/firestore';
import { getExistingShareToken, getOrCreateShareToken } from '../services/sharing';
import { SetTabs } from '../components/filters/SetTabs';
import { SortControl } from '../components/filters/SortControl';
import { OwnershipFilter } from '../components/filters/OwnershipFilter';
import { BoosterFilter } from '../components/filters/BoosterFilter';
import { FilterDrawer } from '../components/filters/FilterDrawer';
import { SearchInput } from '../components/filters/SearchInput';
import { CollectionSummary } from '../components/stats/CollectionSummary';
import { CardGrid, CardGridSkeleton } from '../components/cards/CardGrid';
import { CardDetail } from '../components/cards/CardDetail';
import { PullToRefresh } from '../components/ui/PullToRefresh';
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
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [shareToastMessage, setShareToastMessage] = useState<string | null>(null);
  const [shareToastType, setShareToastType] = useState<ShareToastType>('success');
  const [selectedVariant, setSelectedVariant] = useState<CardVariant>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
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

  const {
    activeSet, setActiveSet,
    sortOption, setSortOption,
    ownershipFilter, setOwnershipFilter,
    boosterFilter, setBoosterFilter,
    boosterMapLoading,
    selectedCard, setSelectedCard,
    groupBySet, setGroupBySet,
    currentCards, isCardsLoading,
    cardCounts, stats, sortedFilteredCards,
  } = useCardCollection({ ownedCards, searchQuery });

  const activeFilterCount = (boosterFilter !== 'all' ? 1 : 0) + (ownershipFilter !== 'all' ? 1 : 0);
  const hasActiveFilters = boosterFilter !== 'all' || ownershipFilter !== 'all' || sortOption !== 'number-asc';

  const handleResetFilters = useCallback(() => {
    setBoosterFilter('all');
    setOwnershipFilter('all');
    setSortOption('number-asc');
  }, [setBoosterFilter, setOwnershipFilter, setSortOption]);

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
    await queryClient.refetchQueries({
      queryKey: ['scryfall-cards'],
      type: 'active',
    });
  }, [queryClient]);

  return (
    <>
      <PullToRefresh onRefresh={handleRefresh} disabled={isSearchOpen || !!selectedCard || isFilterDrawerOpen}>
        <div className="app-container-padded safe-bottom touch-pan-y">
          {/* Set tabs */}
          <SetTabs activeSet={activeSet} onChange={setActiveSet} cardCounts={cardCounts} />

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
                {activeSet === 'all' && (
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
              <OwnershipFilter value={ownershipFilter} onChange={setOwnershipFilter} />
              <SortControl value={sortOption} onChange={setSortOption} />
              <BoosterFilter
                value={boosterFilter}
                onChange={setBoosterFilter}
                isLoading={boosterMapLoading}
              />
              {activeSet === 'all' && (
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
          ) : (
            <CardGrid
              cards={sortedFilteredCards}
              ownedCards={ownedCards}
              onToggle={handleToggle}
              onCardClick={(card, variant) => {
                setSelectedCard(card);
                setSelectedVariant(variant);
              }}
              groupBySet={activeSet === 'all' && groupBySet}
            />
          )}
        </div>
      </PullToRefresh>

      {/* Mobile filter drawer */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        boosterFilter={boosterFilter}
        onBoosterChange={setBoosterFilter}
        ownershipFilter={ownershipFilter}
        onOwnershipChange={setOwnershipFilter}
        sortOption={sortOption}
        onSortChange={setSortOption}
        boosterMapLoading={boosterMapLoading}
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
