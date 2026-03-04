import { useMemo } from 'react';
import type { ScryfallCard, OwnedCard, SetCode } from '../types/card';
import { calculateOwnedCardValue } from '../utils/calculateValue';
import { isCardOwned } from '../utils/ownership';

interface CollectionStats {
  totalCards: number;
  ownedCount: number;
  totalValue: number;
  percentage: number;
}

export function useCollectionStats(
  cards: ScryfallCard[],
  ownedCards: Map<string, OwnedCard>,
  setCode: SetCode
): CollectionStats {
  return useMemo(() => {
    const setCards = setCode === 'all' ? cards : cards.filter((c) => c.set === setCode);
    const totalCards = setCards.length;
    let ownedCount = 0;
    let totalValue = 0;

    for (const card of setCards) {
      const owned = ownedCards.get(card.id);
      if (!owned) continue;

      if (isCardOwned(owned)) ownedCount++;

      totalValue += calculateOwnedCardValue(owned, card.prices).total;
    }

    return {
      totalCards,
      ownedCount,
      totalValue,
      percentage: totalCards > 0 ? Math.round((ownedCount / totalCards) * 100) : 0,
    };
  }, [cards, ownedCards, setCode]);
}
