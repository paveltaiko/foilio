import type { OwnedCard } from '../types/card';

/** Whether any variant (non-foil or foil) of the card is owned. Null-safe. */
export function isCardOwned(owned: OwnedCard | undefined | null): boolean {
  return !!owned && (owned.ownedNonFoil || owned.ownedFoil);
}
