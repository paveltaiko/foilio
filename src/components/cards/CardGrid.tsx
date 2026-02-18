import { useMemo } from 'react';
import type { ScryfallCard, OwnedCard, CardWithVariant, CardVariant } from '../../types/card';
import { CardItem } from './CardItem';

const SET_DISPLAY_NAMES: Record<string, string> = {
  spm: "Marvel's Spider-Man",
  spe: "Marvel's Spider-Man Eternal",
  mar: 'Marvel Universe',
};

// Ordered set codes for consistent grouping
const SET_ORDER = ['spm', 'spe', 'mar'];

interface CardGridProps {
  cards: CardWithVariant[];
  ownedCards: Map<string, OwnedCard>;
  onToggle: (cardId: string, variant: 'nonfoil' | 'foil') => void;
  onCardClick: (card: ScryfallCard, variant: CardVariant) => void;
  readOnly?: boolean;
  groupBySet?: boolean;
}

function CardGridInner({ cards, ownedCards, onToggle, onCardClick, readOnly }: Omit<CardGridProps, 'groupBySet'>) {
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

export function CardGrid({ cards, ownedCards, onToggle, onCardClick, readOnly, groupBySet }: CardGridProps) {
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

  if (cards.length === 0) {
    return (
      <div className="text-center py-16 text-neutral-400 text-sm">
        No cards to display
      </div>
    );
  }

  if (groupBySet && groupedCards) {
    return (
      <div className="space-y-6">
        {SET_ORDER.filter((set) => groupedCards.has(set)).map((set) => (
          <section key={set}>
            <h2 className="text-sm font-semibold text-neutral-700 mb-3">
              {SET_DISPLAY_NAMES[set] ?? set}
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
      </div>
    );
  }

  return (
    <CardGridInner
      cards={cards}
      ownedCards={ownedCards}
      onToggle={onToggle}
      onCardClick={onCardClick}
      readOnly={readOnly}
    />
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
