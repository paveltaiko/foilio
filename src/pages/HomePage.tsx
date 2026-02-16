import { useState, useCallback, useEffect } from 'react';
import { Share2, Check, Layers, LayoutGrid } from 'lucide-react';
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
import { SearchInput } from '../components/filters/SearchInput';
import { CollectionSummary } from '../components/stats/CollectionSummary';
import { CardGrid, CardGridSkeleton } from '../components/cards/CardGrid';
import { CardDetail } from '../components/cards/CardDetail';
import { PullToRefresh } from '../components/ui/PullToRefresh';

interface HomePageProps {
  user: User;
  isSearchOpen: boolean;
  onSearchClose: () => void;
}

function ShareButton({ user, onTokenReady }: { user: User; onTokenReady: (token: string) => void }) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleShare = async () => {
    if (loading) return;
    try {
      setLoading(true);
      setError(null);
      const token = await getOrCreateShareToken({
        uid: user.uid,
        displayName: user.displayName ?? null,
        photoURL: user.photoURL ?? null,
      });
      onTokenReady(token);
      const url = `${window.location.origin}/share/${token}`;
      const copiedOk = await copyText(url);
      if (!copiedOk) {
        window.prompt('Copy this link:', url);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setCopied(false);
      void err;
      setError('Could not create share link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleShare}
        className="flex items-center justify-center gap-2 w-full py-2 text-sm font-medium text-neutral-500 bg-surface-primary border border-surface-border rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer"
      >
        {loading ? (
          <span>Preparing link...</span>
        ) : copied ? (
          <>
            <Check className="w-4 h-4 text-owned" />
            <span className="text-owned">Link copied!</span>
          </>
        ) : (
          <>
            <Share2 className="w-4 h-4" />
            <span>Share collection</span>
          </>
        )}
      </button>
      {error && (
        <p className="text-xs text-red-500 text-center mt-1">{error}</p>
      )}
    </>
  );
}

export function HomePage({ user, isSearchOpen, onSearchClose }: HomePageProps) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [shareToken, setShareToken] = useState<string | null>(null);
  const { ownedCards, updateLocal } = useOwnedCards(user.uid);

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
    selectedCard, setSelectedCard,
    groupBySet, setGroupBySet,
    currentCards, isCardsLoading,
    cardCounts, stats, sortedFilteredCards,
  } = useCardCollection({ ownedCards, searchQuery });

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
      <PullToRefresh onRefresh={handleRefresh} disabled={isSearchOpen || !!selectedCard}>
        <div className="max-w-6xl mx-auto safe-bottom touch-pan-y">
          {/* Set tabs */}
          <SetTabs activeSet={activeSet} onChange={setActiveSet} cardCounts={cardCounts} />

          {/* Stats + Share */}
          <div className="py-2 space-y-2">
            <CollectionSummary
              totalCards={stats.totalCards}
              ownedCount={stats.ownedCount}
              totalValue={stats.totalValue}
              percentage={stats.percentage}
            />
            {isFirebaseConfigured && (
              <ShareButton user={user} onTokenReady={setShareToken} />
            )}
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between gap-2 sm:gap-3 pb-4">
            <OwnershipFilter value={ownershipFilter} onChange={setOwnershipFilter} />
            <div className="flex items-center gap-4">
              {activeSet === 'all' && (
                <button
                  onClick={() => setGroupBySet(!groupBySet)}
                  className={`cursor-pointer transition-colors duration-150 ${
                    groupBySet ? 'text-primary-500' : 'text-neutral-400 hover:text-neutral-600'
                  }`}
                  title={groupBySet ? 'Show all at once' : 'Group by set'}
                >
                  {groupBySet ? <Layers className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
                </button>
              )}
              <SortControl value={sortOption} onChange={setSortOption} />
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
              onCardClick={setSelectedCard}
              groupBySet={activeSet === 'all' && groupBySet}
            />
          )}
        </div>
      </PullToRefresh>

      {/* Card detail modal */}
      <CardDetail
        card={selectedCard}
        owned={selectedCard ? ownedCards.get(selectedCard.id) : undefined}
        onClose={() => setSelectedCard(null)}
        onToggle={handleToggle}
        onQuantityChange={handleQuantityChange}
        cards={sortedFilteredCards}
        onNavigate={setSelectedCard}
      />

      {/* Search overlay */}
      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        isOpen={isSearchOpen}
        onClose={onSearchClose}
      />
    </>
  );
}
