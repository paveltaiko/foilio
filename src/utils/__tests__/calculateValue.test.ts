import { describe, it, expect } from 'vitest';
import { calculateOwnedCardValue } from '../calculateValue';
import type { OwnedCard } from '../../types/card';

function makeOwned(overrides: Partial<OwnedCard> = {}): OwnedCard {
  return {
    scryfallId: 'test',
    set: 'tst',
    collectorNumber: '1',
    name: 'Test',
    ownedNonFoil: false,
    ownedFoil: false,
    quantityNonFoil: 0,
    quantityFoil: 0,
    addedAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('calculateOwnedCardValue', () => {
  it('returns zero when nothing is owned', () => {
    const result = calculateOwnedCardValue(
      makeOwned(),
      { eur: '10.00', eur_foil: '20.00' },
    );
    expect(result).toEqual({ nonFoil: 0, foil: 0, total: 0 });
  });

  it('calculates non-foil value', () => {
    const result = calculateOwnedCardValue(
      makeOwned({ ownedNonFoil: true, quantityNonFoil: 3 }),
      { eur: '5.00', eur_foil: null },
    );
    expect(result.nonFoil).toBe(15);
    expect(result.foil).toBe(0);
    expect(result.total).toBe(15);
  });

  it('calculates foil value', () => {
    const result = calculateOwnedCardValue(
      makeOwned({ ownedFoil: true, quantityFoil: 2 }),
      { eur: null, eur_foil: '12.50' },
    );
    expect(result.nonFoil).toBe(0);
    expect(result.foil).toBe(25);
    expect(result.total).toBe(25);
  });

  it('calculates combined value', () => {
    const result = calculateOwnedCardValue(
      makeOwned({ ownedNonFoil: true, quantityNonFoil: 1, ownedFoil: true, quantityFoil: 1 }),
      { eur: '3.00', eur_foil: '7.00' },
    );
    expect(result.total).toBe(10);
  });

  it('falls back to qty=1 when quantity is 0 but owned flag is true (legacy data)', () => {
    const result = calculateOwnedCardValue(
      makeOwned({ ownedNonFoil: true, quantityNonFoil: 0 }),
      { eur: '8.00', eur_foil: null },
    );
    expect(result.nonFoil).toBe(8);
  });

  it('returns zero when price is null', () => {
    const result = calculateOwnedCardValue(
      makeOwned({ ownedNonFoil: true, quantityNonFoil: 1 }),
      { eur: null, eur_foil: null },
    );
    expect(result.total).toBe(0);
  });
});
