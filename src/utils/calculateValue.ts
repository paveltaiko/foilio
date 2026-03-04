import type { OwnedCard } from '../types/card';
import { parsePrice } from './formatPrice';

export interface OwnedCardValue {
  nonFoil: number;
  foil: number;
  total: number;
}

/**
 * Calculate the monetary value of an owned card based on its prices and quantities.
 * Handles the `qty || 1` fallback for legacy data where quantity may be 0
 * but the ownership flag is true.
 */
export function calculateOwnedCardValue(
  owned: OwnedCard,
  prices: { eur: string | null; eur_foil: string | null },
): OwnedCardValue {
  let nonFoil = 0;
  let foil = 0;

  if (owned.ownedNonFoil) {
    const price = parsePrice(prices.eur);
    const qty = owned.quantityNonFoil || 1;
    if (price !== null) nonFoil = price * qty;
  }

  if (owned.ownedFoil) {
    const price = parsePrice(prices.eur_foil);
    const qty = owned.quantityFoil || 1;
    if (price !== null) foil = price * qty;
  }

  return { nonFoil, foil, total: nonFoil + foil };
}
