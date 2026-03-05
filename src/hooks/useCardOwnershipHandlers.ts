import { useCallback } from 'react';
import { isFirebaseConfigured } from '../config/firebase';
import { toggleCardOwnership, updateCardQuantity } from '../services/firestore';
import type { ScryfallCard, OwnedCard } from '../types/card';

interface UseCardOwnershipHandlersOptions {
  userId: string;
  ownedCards: Map<string, OwnedCard>;
  shareToken: string | null;
  updateLocal: (updater: (prev: Map<string, OwnedCard>) => Map<string, OwnedCard>) => void;
}

export function useCardOwnershipHandlers({
  userId,
  ownedCards,
  shareToken,
  updateLocal,
}: UseCardOwnershipHandlersOptions) {
  const handleToggle = useCallback(
    (card: ScryfallCard, variant: 'nonfoil' | 'foil') => {
      const cardId = card.id;

      if (isFirebaseConfigured) {
        void toggleCardOwnership(userId, cardId, {
          set: card.set,
          collectorNumber: card.collector_number,
          name: card.name,
        }, variant, ownedCards.get(cardId), shareToken ?? undefined);
      } else {
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
    [userId, ownedCards, shareToken, updateLocal]
  );

  const handleQuantityChange = useCallback(
    (card: ScryfallCard, variant: 'nonfoil' | 'foil', quantity: number) => {
      const cardId = card.id;
      const existing = ownedCards.get(cardId);
      if (!existing) return;

      if (isFirebaseConfigured) {
        void updateCardQuantity(userId, cardId, variant, quantity, existing, shareToken ?? undefined);
      } else {
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
    [userId, ownedCards, shareToken, updateLocal]
  );

  return { handleToggle, handleQuantityChange };
}
