import { describe, it, expect, beforeEach } from 'vitest';
import { mergeCards, filterAndSortCards } from '../cardFiltering';
import { mockCard, mockOwned, resetIdCounter } from './helpers';
import type { OwnedCard } from '../../types/card';
import type { BoosterMap } from '../../services/mtgjson';

beforeEach(() => resetIdCounter());

// ---------------------------------------------------------------------------
// mergeCards
// ---------------------------------------------------------------------------
describe('mergeCards', () => {
  it('returns existing array when incoming is empty', () => {
    const cards = [mockCard()];
    const result = mergeCards(cards, []);
    expect(result).toBe(cards); // same reference
  });

  it('appends new cards', () => {
    const a = mockCard({ id: 'a' });
    const b = mockCard({ id: 'b' });
    const result = mergeCards([a], [b]);
    expect(result).toHaveLength(2);
    expect(result.map((c) => c.id)).toEqual(['a', 'b']);
  });

  it('skips duplicate ids', () => {
    const a = mockCard({ id: 'a' });
    const aDup = mockCard({ id: 'a', name: 'Duplicate' });
    const b = mockCard({ id: 'b' });
    const result = mergeCards([a], [aDup, b]);
    expect(result).toHaveLength(2);
    expect(result[0].name).not.toBe('Duplicate');
  });
});

// ---------------------------------------------------------------------------
// filterAndSortCards — search
// ---------------------------------------------------------------------------
describe('filterAndSortCards — search filter', () => {
  const baseOpts = () => ({
    scopedOwnedCards: [] as ReturnType<typeof mockCard>[],
    ownedCards: new Map<string, OwnedCard>(),
    ownershipFilter: 'all' as const,
    boosterFilter: 'all' as const,
    boosterMap: undefined,
    sortOption: 'number-asc' as const,
    searchQuery: '',
    shouldGroupBySet: false,
    setOrder: [] as string[],
  });

  it('filters cards by name (case-insensitive)', () => {
    const lightning = mockCard({ name: 'Lightning Bolt' });
    const giant = mockCard({ name: 'Giant Growth' });
    const result = filterAndSortCards({
      ...baseOpts(),
      currentCards: [lightning, giant],
      searchQuery: 'lightning',
    });
    expect(result).toHaveLength(1);
    expect(result[0].card.name).toBe('Lightning Bolt');
  });

  it('filters by exact collector number', () => {
    const c1 = mockCard({ collector_number: '42' });
    const c2 = mockCard({ collector_number: '142' });
    const c3 = mockCard({ collector_number: '7' });
    const result = filterAndSortCards({
      ...baseOpts(),
      currentCards: [c1, c2, c3],
      searchQuery: '42',
    });
    // exact number match: only '42' (not '142')
    expect(result).toHaveLength(1);
    expect(result[0].card.collector_number).toBe('42');
  });

  it('returns all cards when search query is empty', () => {
    const cards = [mockCard(), mockCard(), mockCard()];
    const result = filterAndSortCards({
      ...baseOpts(),
      currentCards: cards,
      searchQuery: '  ',
    });
    expect(result).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// filterAndSortCards — ownership filter
// ---------------------------------------------------------------------------
describe('filterAndSortCards — ownership filter', () => {
  const makeSetup = () => {
    const owned = mockCard({ id: 'owned-1' });
    const missing = mockCard({ id: 'missing-1' });
    const ownedMap = new Map<string, OwnedCard>([
      ['owned-1', mockOwned(owned, { ownedNonFoil: true })],
    ]);
    return { owned, missing, ownedMap };
  };

  it('shows only owned cards with filter "owned"', () => {
    const { owned, missing, ownedMap } = makeSetup();
    const result = filterAndSortCards({
      currentCards: [owned, missing],
      scopedOwnedCards: [],
      ownedCards: ownedMap,
      ownershipFilter: 'owned',
      boosterFilter: 'all',
      boosterMap: undefined,
      sortOption: 'number-asc',
      searchQuery: '',
      shouldGroupBySet: false,
      setOrder: [],
    });
    expect(result).toHaveLength(1);
    expect(result[0].card.id).toBe('owned-1');
  });

  it('shows only missing cards with filter "missing"', () => {
    const { owned, missing, ownedMap } = makeSetup();
    const result = filterAndSortCards({
      currentCards: [owned, missing],
      scopedOwnedCards: [],
      ownedCards: ownedMap,
      ownershipFilter: 'missing',
      boosterFilter: 'all',
      boosterMap: undefined,
      sortOption: 'number-asc',
      searchQuery: '',
      shouldGroupBySet: false,
      setOrder: [],
    });
    expect(result).toHaveLength(1);
    expect(result[0].card.id).toBe('missing-1');
  });
});

// ---------------------------------------------------------------------------
// filterAndSortCards — sorting
// ---------------------------------------------------------------------------
describe('filterAndSortCards — sorting', () => {
  const baseOpts = () => ({
    scopedOwnedCards: [] as ReturnType<typeof mockCard>[],
    ownedCards: new Map<string, OwnedCard>(),
    ownershipFilter: 'all' as const,
    boosterFilter: 'all' as const,
    boosterMap: undefined,
    searchQuery: '',
    shouldGroupBySet: false,
    setOrder: [] as string[],
  });

  it('sorts by collector number ascending', () => {
    const c10 = mockCard({ collector_number: '10' });
    const c2 = mockCard({ collector_number: '2' });
    const c30 = mockCard({ collector_number: '30' });
    const result = filterAndSortCards({
      ...baseOpts(),
      currentCards: [c30, c2, c10],
      sortOption: 'number-asc',
    });
    expect(result.map((r) => r.card.collector_number)).toEqual(['2', '10', '30']);
  });

  it('sorts by collector number descending', () => {
    const c1 = mockCard({ collector_number: '1' });
    const c5 = mockCard({ collector_number: '5' });
    const c3 = mockCard({ collector_number: '3' });
    const result = filterAndSortCards({
      ...baseOpts(),
      currentCards: [c1, c5, c3],
      sortOption: 'number-desc',
    });
    expect(result.map((r) => r.card.collector_number)).toEqual(['5', '3', '1']);
  });

  it('sorts by price ascending (expands to variants)', () => {
    const cheap = mockCard({ prices: { eur: '1.00', eur_foil: null } });
    const expensive = mockCard({ prices: { eur: '10.00', eur_foil: null } });
    const result = filterAndSortCards({
      ...baseOpts(),
      currentCards: [expensive, cheap],
      sortOption: 'price-asc',
    });
    // nonfoil variants only (foil price is null → still included but price 0)
    const nonfoils = result.filter((r) => r.variant === 'nonfoil');
    expect(nonfoils[0].sortPrice).toBe(1);
    expect(nonfoils[1].sortPrice).toBe(10);
  });

  it('sorts by price descending', () => {
    const a = mockCard({ prices: { eur: '5.00', eur_foil: null }, finishes: ['nonfoil'] });
    const b = mockCard({ prices: { eur: '20.00', eur_foil: null }, finishes: ['nonfoil'] });
    const result = filterAndSortCards({
      ...baseOpts(),
      currentCards: [a, b],
      sortOption: 'price-desc',
    });
    expect(result[0].sortPrice).toBe(20);
    expect(result[1].sortPrice).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// filterAndSortCards — booster filter
// ---------------------------------------------------------------------------
describe('filterAndSortCards — booster filter', () => {
  it('filters cards by play booster availability', () => {
    const inPlay = mockCard({ set: 'tst', collector_number: '1' });
    const notInPlay = mockCard({ set: 'tst', collector_number: '2' });

    const boosterMap: BoosterMap = new Map([
      ['tst:1', { play: new Set(['nonfoil']), collector: new Set() }],
      // tst:2 not in map → filtered out
    ]);

    const result = filterAndSortCards({
      currentCards: [inPlay, notInPlay],
      scopedOwnedCards: [],
      ownedCards: new Map(),
      ownershipFilter: 'all',
      boosterFilter: 'play',
      boosterMap,
      sortOption: 'number-asc',
      searchQuery: '',
      shouldGroupBySet: false,
      setOrder: [],
    });

    expect(result).toHaveLength(1);
    expect(result[0].card.collector_number).toBe('1');
  });
});

// ---------------------------------------------------------------------------
// filterAndSortCards — singleVariant (SLD mode)
// ---------------------------------------------------------------------------
describe('filterAndSortCards — singleVariant mode', () => {
  const singleOpts = () => ({
    ownedCards: new Map<string, OwnedCard>(),
    ownershipFilter: 'all' as const,
    sortOption: 'number-asc' as const,
    searchQuery: '',
    singleVariant: true,
  });

  it('produces one entry per card with variant based on finishes', () => {
    const both = mockCard({ finishes: ['nonfoil', 'foil'] });
    const nonfoilOnly = mockCard({ finishes: ['nonfoil'] });
    const foilOnly = mockCard({ finishes: ['foil'] });
    const etched = mockCard({ finishes: ['etched'] });

    const result = filterAndSortCards({
      ...singleOpts(),
      currentCards: [both, nonfoilOnly, foilOnly, etched],
    });

    expect(result).toHaveLength(4);
    expect(result[0].variant).toBeNull();       // both finishes → null
    expect(result[1].variant).toBe('nonfoil');
    expect(result[2].variant).toBe('foil');
    expect(result[3].variant).toBe('foil');      // etched treated as foil
  });

  it('filters by ownership', () => {
    const owned = mockCard({ id: 'sv-owned' });
    const missing = mockCard({ id: 'sv-missing' });
    const ownedMap = new Map<string, OwnedCard>([
      ['sv-owned', mockOwned(owned, { ownedNonFoil: true })],
    ]);

    const result = filterAndSortCards({
      ...singleOpts(),
      currentCards: [owned, missing],
      ownedCards: ownedMap,
      ownershipFilter: 'owned',
    });

    expect(result).toHaveLength(1);
    expect(result[0].card.id).toBe('sv-owned');
  });

  it('sorts by price descending', () => {
    const cheap = mockCard({ prices: { eur: '2.00', eur_foil: null }, finishes: ['nonfoil'] });
    const expensive = mockCard({ prices: { eur: '15.00', eur_foil: null }, finishes: ['nonfoil'] });

    const result = filterAndSortCards({
      ...singleOpts(),
      currentCards: [cheap, expensive],
      sortOption: 'price-desc',
    });

    expect(result[0].sortPrice).toBe(15);
    expect(result[1].sortPrice).toBe(2);
  });

  it('searches by name and collector number', () => {
    const bolt = mockCard({ name: 'Lightning Bolt', collector_number: '99' });
    const giant = mockCard({ name: 'Giant Growth', collector_number: '42' });

    const byName = filterAndSortCards({
      ...singleOpts(),
      currentCards: [bolt, giant],
      searchQuery: 'bolt',
    });
    expect(byName).toHaveLength(1);
    expect(byName[0].card.name).toBe('Lightning Bolt');

    const byNum = filterAndSortCards({
      ...singleOpts(),
      currentCards: [bolt, giant],
      searchQuery: '42',
    });
    expect(byNum).toHaveLength(1);
    expect(byNum[0].card.collector_number).toBe('42');
  });
});
