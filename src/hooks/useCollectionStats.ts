import { useMemo } from 'react';
import type { ScryfallCard, OwnedCard, SetCode } from '../types/card';
import { parsePrice } from '../utils/formatPrice';

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

      const isOwned = owned.ownedNonFoil || owned.ownedFoil;
      if (isOwned) ownedCount++;

      // Non-foil value (multiplied by quantity)
      if (owned.ownedNonFoil) {
        const price = owned.customPrice ?? parsePrice(card.prices.eur);
        const qty = owned.quantityNonFoil || 1;
        if (price !== null) totalValue += price * qty;
      }

      // Foil value (multiplied by quantity)
      if (owned.ownedFoil) {
        const price = owned.customPriceFoil ?? parsePrice(card.prices.eur_foil);
        const qty = owned.quantityFoil || 1;
        if (price !== null) totalValue += price * qty;
      }
    }

    return {
      totalCards,
      ownedCount,
      totalValue,
      percentage: totalCards > 0 ? Math.round((ownedCount / totalCards) * 100) : 0,
    };
  }, [cards, ownedCards, setCode]);
}
