import type { ScryfallCard } from '../types/card';

const CARD_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours - cards contain prices
const SET_COUNT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days - set metadata is stable
const SET_PAGE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days - card metadata is permanent

const LS_PREFIX_CARD = 'scryfall_card_';
const LS_PREFIX_SET_COUNT = 'scryfall_setcount_';
const LS_PREFIX_SET_PAGE = 'scryfall_setpage_';
const LS_KEY_VERSION = 'scryfall_cache_v';
const CACHE_SCHEMA_VERSION = '1';

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  ttl: number;
}

export interface CachedSetPage {
  cards: ScryfallCard[];
  nextPage: string | null;
  hasMore: boolean;
}

function isExpired<T>(entry: CacheEntry<T>): boolean {
  return Date.now() - entry.cachedAt > entry.ttl;
}

function lsGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (isExpired(entry)) {
      localStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

function lsSet<T>(key: string, data: T, ttl: number): void {
  const entry: CacheEntry<T> = { data, cachedAt: Date.now(), ttl };
  try {
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      evictOldEntries();
      try {
        localStorage.setItem(key, JSON.stringify(entry));
      } catch {
        // Silent fail - app works without cache
      }
    }
  }
}

function evictOldEntries(): void {
  const valid: Array<{ key: string; cachedAt: number }> = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (
      !key.startsWith(LS_PREFIX_CARD) &&
      !key.startsWith(LS_PREFIX_SET_COUNT) &&
      !key.startsWith(LS_PREFIX_SET_PAGE)
    ) continue;

    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const entry: CacheEntry<unknown> = JSON.parse(raw);
      if (isExpired(entry)) {
        localStorage.removeItem(key);
      } else {
        valid.push({ key, cachedAt: entry.cachedAt });
      }
    } catch {
      localStorage.removeItem(key);
    }
  }

  // Evict oldest 25% of valid entries if still needed
  valid.sort((a, b) => a.cachedAt - b.cachedAt);
  const evictCount = Math.ceil(valid.length * 0.25);
  for (let i = 0; i < evictCount; i++) {
    localStorage.removeItem(valid[i].key);
  }
}

export function validateCacheVersion(): void {
  try {
    const stored = localStorage.getItem(LS_KEY_VERSION);
    if (stored === CACHE_SCHEMA_VERSION) return;

    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (
        key.startsWith(LS_PREFIX_CARD) ||
        key.startsWith(LS_PREFIX_SET_COUNT) ||
        key.startsWith(LS_PREFIX_SET_PAGE)
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    localStorage.setItem(LS_KEY_VERSION, CACHE_SCHEMA_VERSION);
  } catch {
    // localStorage unavailable - no-op
  }
}

export function getCachedCardById(id: string): ScryfallCard | null {
  return lsGet<ScryfallCard>(`${LS_PREFIX_CARD}${id}`);
}

export function setCachedCardById(card: ScryfallCard): void {
  lsSet(`${LS_PREFIX_CARD}${card.id}`, card, CARD_TTL_MS);
}

export function getCachedSetCount(setCode: string): number | null {
  return lsGet<number>(`${LS_PREFIX_SET_COUNT}${setCode.toLowerCase()}`);
}

export function setCachedSetCount(setCode: string, count: number): void {
  lsSet(`${LS_PREFIX_SET_COUNT}${setCode.toLowerCase()}`, count, SET_COUNT_TTL_MS);
}

export function getCachedSetPage(setCode: string): CachedSetPage | null {
  return lsGet<CachedSetPage>(`${LS_PREFIX_SET_PAGE}${setCode.toLowerCase()}`);
}

export function setCachedSetPage(setCode: string, data: CachedSetPage): void {
  lsSet(`${LS_PREFIX_SET_PAGE}${setCode.toLowerCase()}`, data, SET_PAGE_TTL_MS);
}

export function invalidateCachedSetPage(setCode: string): void {
  try {
    localStorage.removeItem(`${LS_PREFIX_SET_PAGE}${setCode.toLowerCase()}`);
  } catch {
    // Silent fail
  }
}
