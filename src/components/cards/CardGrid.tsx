import { useEffect, useMemo, useRef } from 'react';
import type { RefObject } from 'react';
import type { ScryfallCard, OwnedCard, CardWithVariant, CardVariant } from '../../types/card';
import type { CollectionSet } from '../../config/collections';
import { CardItem } from './CardItem';

interface CardGridProps {
  cards: CardWithVariant[];
  ownedCards: Map<string, OwnedCard>;
  onToggle: (cardId: string, variant: 'nonfoil' | 'foil') => void;
  onCardClick: (card: ScryfallCard, variant: CardVariant) => void;
  readOnly?: boolean;
  groupBySet?: boolean;
  sets?: CollectionSet[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  loadMoreError?: string | null;
}

function CardGridInner({ cards, ownedCards, onToggle, onCardClick, readOnly }: Omit<CardGridProps, 'groupBySet' | 'sets'>) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
      {cards.map((item) => (
        <CardItem
          key={item.variant ? `${item.card.id}-${item.variant}` : item.card.id}
          card={item.card}
          owned={ownedCards.get(item.card.id)}
          displayVariant={item.variant}
          onToggle={onToggle}
          onClick={onCardClick}
          readOnly={readOnly}
        />
      ))}
    </div>
  );
}

export function CardGrid({
  cards,
  ownedCards,
  onToggle,
  onCardClick,
  readOnly,
  groupBySet,
  sets,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  loadMoreError = null,
}: CardGridProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const lastTriggerRef = useRef(0);

  const groupedCards = useMemo(() => {
    if (!groupBySet) return null;
    const groups = new Map<string, CardWithVariant[]>();
    for (const item of cards) {
      const set = item.card.set;
      if (!groups.has(set)) groups.set(set, []);
      groups.get(set)!.push(item);
    }
    return groups;
  }, [cards, groupBySet]);

  // Set order and names derived from sets prop (fallback to order of appearance)
  const setOrder = useMemo(() => sets?.map((s) => s.id) ?? [], [sets]);
  const setNameById = useMemo(() => {
    const map: Record<string, string> = {};
    sets?.forEach((s) => { map[s.id] = s.name; });
    return map;
  }, [sets]);

  useEffect(() => {
    if (!onLoadMore || !hasMore || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (isLoadingMore) return;
        const now = Date.now();
        if (now - lastTriggerRef.current < 300) return;
        lastTriggerRef.current = now;
        onLoadMore();
      },
      { rootMargin: '0px 0px 900px 0px' }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [onLoadMore, hasMore, isLoadingMore]);

  if (cards.length === 0) {
    return (
      <div className="text-center py-16 text-neutral-400 text-sm">
        No cards to display
      </div>
    );
  }

  if (groupBySet && groupedCards) {
    // Render sets in config order, then any unknown sets at the end
    const orderedSets = [
      ...setOrder.filter((id) => groupedCards.has(id)),
      ...[...groupedCards.keys()].filter((id) => !setOrder.includes(id)),
    ];
    return (
      <div className="space-y-6">
        {orderedSets.map((set) => (
          <section key={set}>
            <h2 className="text-sm font-semibold text-neutral-700 mb-3">
              {setNameById[set] ?? set}
              <span className="ml-2 text-xs font-normal text-neutral-400">
                {groupedCards.get(set)!.length}
              </span>
            </h2>
            <CardGridInner
              cards={groupedCards.get(set)!}
              ownedCards={ownedCards}
              onToggle={onToggle}
              onCardClick={onCardClick}
              readOnly={readOnly}
            />
          </section>
        ))}
        {(hasMore || isLoadingMore || loadMoreError) && (
          <LoadMoreFooter
            sentinelRef={sentinelRef}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            loadMoreError={loadMoreError}
            onLoadMore={onLoadMore}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CardGridInner
        cards={cards}
        ownedCards={ownedCards}
        onToggle={onToggle}
        onCardClick={onCardClick}
        readOnly={readOnly}
      />
      {(hasMore || isLoadingMore || loadMoreError) && (
        <LoadMoreFooter
          sentinelRef={sentinelRef}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          loadMoreError={loadMoreError}
          onLoadMore={onLoadMore}
        />
      )}
    </div>
  );
}

export function CardGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} className="rounded-lg sm:rounded-card-sm border border-neutral-200 overflow-hidden">
          <div className="aspect-[488/680] skeleton rounded-md sm:rounded-lg" />
          <div className="p-1.5 sm:p-2.5 space-y-1.5 sm:space-y-2">
            <div className="h-3 skeleton w-3/4" />
            <div className="h-3 skeleton w-1/2" />
            <div className="flex gap-1 sm:gap-1.5">
              <div className="h-7 sm:h-6 skeleton flex-1" />
              <div className="h-7 sm:h-6 skeleton flex-1" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function LoadMoreFooter({
  sentinelRef,
  hasMore,
  isLoadingMore,
  loadMoreError,
  onLoadMore,
}: {
  sentinelRef: RefObject<HTMLDivElement | null>;
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMoreError: string | null;
  onLoadMore?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 pt-2">
      <div ref={sentinelRef} className="h-1 w-full" aria-hidden="true" />

      {isLoadingMore && (
        <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg sm:rounded-card-sm border border-neutral-200 overflow-hidden">
              <div className="aspect-[488/680] skeleton rounded-md sm:rounded-lg" />
              <div className="p-1.5 sm:p-2.5 space-y-1.5 sm:space-y-2">
                <div className="h-3 skeleton w-3/4" />
                <div className="h-3 skeleton w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {(hasMore || loadMoreError) && onLoadMore && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={isLoadingMore}
          className="inline-flex items-center justify-center rounded-lg border border-surface-border bg-white px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loadMoreError ? 'Retry loading cards' : 'Load more cards'}
        </button>
      )}
      {loadMoreError && (
        <p className="text-center text-xs text-red-500">{loadMoreError}</p>
      )}
    </div>
  );
}
