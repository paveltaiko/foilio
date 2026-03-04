import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatRelativeTime } from '../formatTime';

describe('formatRelativeTime', () => {
  afterEach(() => vi.useRealTimers());

  function setNow(isoDate: string) {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(isoDate));
  }

  it('returns "now" for less than 1 minute ago', () => {
    setNow('2026-03-04T12:00:00Z');
    const thirtySecsAgo = new Date('2026-03-04T11:59:35Z');
    expect(formatRelativeTime(thirtySecsAgo)).toBe('now');
  });

  it('returns minutes for < 60 min', () => {
    setNow('2026-03-04T12:00:00Z');
    const fiveMinAgo = new Date('2026-03-04T11:55:00Z');
    expect(formatRelativeTime(fiveMinAgo)).toBe('5m');
  });

  it('returns hours for < 24 hours', () => {
    setNow('2026-03-04T12:00:00Z');
    const threeHoursAgo = new Date('2026-03-04T09:00:00Z');
    expect(formatRelativeTime(threeHoursAgo)).toBe('3h');
  });

  it('returns days for < 7 days', () => {
    setNow('2026-03-04T12:00:00Z');
    const twoDaysAgo = new Date('2026-03-02T12:00:00Z');
    expect(formatRelativeTime(twoDaysAgo)).toBe('2d');
  });

  it('returns formatted date for >= 7 days', () => {
    setNow('2026-03-14T12:00:00Z');
    const oldDate = new Date('2026-03-01T12:00:00Z');
    const result = formatRelativeTime(oldDate);
    // "Mar 1" in en-US locale
    expect(result).toMatch(/Mar\s+1/);
  });
});
