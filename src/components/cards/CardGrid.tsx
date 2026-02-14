import type { ScryfallCard, OwnedCard, CardWithVariant } from '../../types/card';
import { CardItem } from './CardItem';

interface CardGridProps {
  cards: CardWithVariant[];
  ownedCards: Map<string, OwnedCard>;
  onToggle: (cardId: string, variant: 'nonfoil' | 'foil') => void;
  onCardClick: (card: ScryfallCard) => void;
  readOnly?: boolean;
}

export function CardGrid({ cards, ownedCards, onToggle, onCardClick, readOnly }: CardGridProps) {
  if (cards.length === 0) {
    return (
      <div className="text-center py-16 text-neutral-400 text-sm">
        Žádné karty k zobrazení
      </div>
    );
  }

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
