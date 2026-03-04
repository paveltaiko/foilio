import type { OwnedCard } from '../types/card';

interface TimestampLike {
  toDate?: () => Date;
}

/**
 * Deserialize raw Firestore document data into an OwnedCard.
 * Works for both `users/{uid}/ownedCards` and `sharedCollections/{token}/ownedCards`.
 */
export function deserializeOwnedCard(docId: string, data: Record<string, unknown>): OwnedCard {
  const ownedNonFoil = (data.ownedNonFoil ?? false) as boolean;
  const ownedFoil = (data.ownedFoil ?? false) as boolean;

  return {
    scryfallId: docId,
    set: data.set as string,
    collectorNumber: data.collectorNumber as string,
    name: data.name as string,
    ownedNonFoil,
    ownedFoil,
    quantityNonFoil: (data.quantityNonFoil as number | undefined) ?? (ownedNonFoil ? 1 : 0),
    quantityFoil: (data.quantityFoil as number | undefined) ?? (ownedFoil ? 1 : 0),
    addedAt: (data.addedAt as TimestampLike | undefined)?.toDate?.() ?? new Date(),
    updatedAt: (data.updatedAt as TimestampLike | undefined)?.toDate?.() ?? new Date(),
  };
}
