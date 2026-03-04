import { describe, it, expect } from 'vitest';
import { formatPrice, parsePrice } from '../formatPrice';

describe('formatPrice', () => {
  it('formats number to euro string', () => {
    expect(formatPrice(12.5)).toBe('€12.50');
  });

  it('formats string price', () => {
    expect(formatPrice('3.99')).toBe('€3.99');
  });

  it('returns dash for null/undefined/empty', () => {
    expect(formatPrice(null)).toBe('—');
    expect(formatPrice(undefined)).toBe('—');
    expect(formatPrice('')).toBe('—');
  });

  it('returns dash for NaN', () => {
    expect(formatPrice('abc')).toBe('—');
  });
});

describe('parsePrice', () => {
  it('parses valid string to number', () => {
    expect(parsePrice('12.50')).toBe(12.5);
  });

  it('returns null for null/undefined/empty', () => {
    expect(parsePrice(null)).toBeNull();
    expect(parsePrice(undefined)).toBeNull();
    expect(parsePrice('')).toBeNull();
  });

  it('returns null for NaN string', () => {
    expect(parsePrice('abc')).toBeNull();
  });
});
