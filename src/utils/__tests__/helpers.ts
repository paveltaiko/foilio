import type { ScryfallCard, OwnedCard } from '../../types/card';

let idCounter = 0;

/** Create a minimal ScryfallCard for testing. */
export function mockCard(overrides: Partial<ScryfallCard> = {}): ScryfallCard {
  idCounter++;
  return {
    id: `card-${idCounter}`,
    name: `Test Card ${idCounter}`,
    set: 'tst',
    set_name: 'Test Set',
    collector_number: String(idCounter),
    rarity: 'common',
    finishes: ['nonfoil', 'foil'],
    prices: { eur: null, eur_foil: null },
    ...overrides,
  };
}

/** Create a minimal OwnedCard for testing. */
export function mockOwned(
  card: ScryfallCard,
  overrides: Partial<OwnedCard> = {},
): OwnedCard {
  return {
    scryfallId: card.id,
    set: card.set,
    collectorNumber: card.collector_number,
    name: card.name,
    ownedNonFoil: true,
    ownedFoil: false,
    quantityNonFoil: 1,
    quantityFoil: 0,
    addedAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/** Reset the id counter between tests. */
export function resetIdCounter() {
  idCounter = 0;
}
