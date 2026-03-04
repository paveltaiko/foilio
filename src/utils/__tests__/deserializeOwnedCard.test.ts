import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deserializeOwnedCard } from '../deserializeOwnedCard';

describe('deserializeOwnedCard', () => {
  it('deserializes basic fields', () => {
    const result = deserializeOwnedCard('card-123', {
      set: 'neo',
      collectorNumber: '42',
      name: 'Test Card',
      ownedNonFoil: true,
      ownedFoil: false,
      quantityNonFoil: 2,
      quantityFoil: 0,
      addedAt: { toDate: () => new Date('2026-01-01') },
      updatedAt: { toDate: () => new Date('2026-02-01') },
    });

    expect(result.scryfallId).toBe('card-123');
    expect(result.set).toBe('neo');
    expect(result.collectorNumber).toBe('42');
    expect(result.name).toBe('Test Card');
    expect(result.ownedNonFoil).toBe(true);
    expect(result.ownedFoil).toBe(false);
    expect(result.quantityNonFoil).toBe(2);
    expect(result.quantityFoil).toBe(0);
    expect(result.addedAt).toEqual(new Date('2026-01-01'));
    expect(result.updatedAt).toEqual(new Date('2026-02-01'));
  });

  it('defaults missing boolean fields to false', () => {
    const result = deserializeOwnedCard('id', {
      set: 'tst',
      collectorNumber: '1',
      name: 'Card',
    });

    expect(result.ownedNonFoil).toBe(false);
    expect(result.ownedFoil).toBe(false);
  });

  it('falls back quantity to 1 when owned but quantity missing', () => {
    const result = deserializeOwnedCard('id', {
      set: 'tst',
      collectorNumber: '1',
      name: 'Card',
      ownedNonFoil: true,
      ownedFoil: true,
    });

    expect(result.quantityNonFoil).toBe(1);
    expect(result.quantityFoil).toBe(1);
  });

  it('falls back timestamps to current date', () => {
    const before = Date.now();
    const result = deserializeOwnedCard('id', {
      set: 'tst',
      collectorNumber: '1',
      name: 'Card',
    });
    const after = Date.now();

    expect(result.addedAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(result.addedAt.getTime()).toBeLessThanOrEqual(after);
  });
});
