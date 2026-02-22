import type { ScryfallCard, ScryfallCardsPage, ScryfallSearchResponse, SetCode } from '../types/card';
import {
  validateCacheVersion,
  getCachedCardById,
  setCachedCardById,
  getCachedSetCount,
  setCachedSetCount,
} from '../utils/scryfallCache';

const BASE_URL = 'https://api.scryfall.com';
const RATE_LIMIT_MS = 100; // Scryfall asks for 50-100ms between requests
const setCardCountCache = new Map<string, number>();
const setCardCountInFlight = new Map<string, Promise<number | null>>();
const cardByIdCache = new Map<string, ScryfallCard>();
const missingCardIds = new Set<string>();

validateCacheVersion();

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchCardsForSet(setCode: SetCode): Promise<ScryfallCard[]> {
  const allCards: ScryfallCard[] = [];
  let url: string | null = `${BASE_URL}/cards/search?q=set:${setCode}&order=set&unique=prints`;

  while (url) {
    const page = await fetchCardsPageForSet(setCode, url);
    allCards.push(...page.cards);

    if (page.hasMore && page.nextPage) {
      url = page.nextPage;
      await delay(RATE_LIMIT_MS);
    } else {
      url = null;
    }
  }

  return allCards;
}

export async function fetchCardsPageForSet(setCode: SetCode, pageUrl?: string | null): Promise<ScryfallCardsPage> {
  const url = pageUrl ?? `${BASE_URL}/cards/search?q=set:${setCode}&order=set&unique=prints`;
  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 404) {
      return {
        cards: [],
        hasMore: false,
        nextPage: null,
      };
    }
    throw new Error(`Scryfall API error: ${response.status}`);
  }

  const data: ScryfallSearchResponse = await response.json();
  return {
    cards: data.data,
    hasMore: data.has_more && !!data.next_page,
    nextPage: data.has_more && data.next_page ? data.next_page : null,
  };
}

export async function fetchSetCardCount(setCode: SetCode): Promise<number | null> {
  const key = setCode.toLowerCase();
  if (setCardCountCache.has(key)) {
    return setCardCountCache.get(key)!;
  }
  if (setCardCountInFlight.has(key)) {
    return setCardCountInFlight.get(key)!;
  }

  // L2 cache: localStorage
  const lsCached = getCachedSetCount(key);
  if (lsCached !== null) {
    setCardCountCache.set(key, lsCached);
    return lsCached;
  }

  const promise = (async () => {
    const response = await fetch(`${BASE_URL}/sets/${key}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Scryfall set API error: ${response.status}`);
    }

    const data: { card_count?: number } = await response.json();
    const count = typeof data.card_count === 'number' ? data.card_count : null;
    if (count !== null) {
      setCardCountCache.set(key, count);
      setCachedSetCount(key, count);
    }
    return count;
  })()
    .finally(() => {
      setCardCountInFlight.delete(key);
    });

  setCardCountInFlight.set(key, promise);
  return promise;
}

interface ScryfallCollectionResponse {
  object: 'list';
  data: ScryfallCard[];
  not_found?: Array<{ id?: string }>;
}

export async function fetchCardsByIds(cardIds: string[]): Promise<Record<string, ScryfallCard>> {
  const unique = Array.from(new Set(cardIds));

  // L2 cache: fill in-memory cache from localStorage for ids not yet loaded
  for (const id of unique) {
    if (!cardByIdCache.has(id) && !missingCardIds.has(id)) {
      const lsCached = getCachedCardById(id);
      if (lsCached) cardByIdCache.set(id, lsCached);
    }
  }

  const unresolved = unique.filter((id) => !cardByIdCache.has(id) && !missingCardIds.has(id));
  const chunks: string[][] = [];
  const CHUNK_SIZE = 75; // Scryfall collection endpoint limit

  for (let i = 0; i < unresolved.length; i += CHUNK_SIZE) {
    chunks.push(unresolved.slice(i, i + CHUNK_SIZE));
  }

  for (let i = 0; i < chunks.length; i += 1) {
    const identifiers = chunks[i].map((id) => ({ id }));
    const response = await fetch(`${BASE_URL}/cards/collection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifiers }),
    });

    if (!response.ok) {
      throw new Error(`Scryfall collection API error: ${response.status}`);
    }

    const data: ScryfallCollectionResponse = await response.json();
    for (const card of data.data ?? []) {
      cardByIdCache.set(card.id, card);
      setCachedCardById(card);
    }
    for (const notFound of data.not_found ?? []) {
      if (notFound.id) missingCardIds.add(notFound.id);
    }

    if (i < chunks.length - 1) {
      await delay(RATE_LIMIT_MS);
    }
  }

  const result: Record<string, ScryfallCard> = {};
  for (const id of unique) {
    const card = cardByIdCache.get(id);
    if (card) result[id] = card;
  }
  return result;
}

export async function fetchCardsByCollectorNumbers(
  identifiers: Array<{ set: string; collector_number: string }>
): Promise<ScryfallCard[]> {
  const response = await fetch(`${BASE_URL}/cards/collection`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifiers }),
  });

  if (!response.ok) {
    throw new Error(`Scryfall collection API error: ${response.status}`);
  }

  const data: ScryfallCollectionResponse = await response.json();
  return data.data ?? [];
}

export async function fetchAllSets(setCodes: string[]): Promise<Record<string, ScryfallCard[]>> {
  const results: Record<string, ScryfallCard[]> = {};

  for (const set of setCodes) {
    results[set] = await fetchCardsForSet(set);
    if (set !== setCodes[setCodes.length - 1]) {
      await delay(RATE_LIMIT_MS);
    }
  }

  return results;
}

export function getCardImage(card: ScryfallCard, size: 'small' | 'normal' | 'large' | 'png' = 'large'): string {
  if (card.image_uris) {
    return card.image_uris[size];
  }
  // Double-faced cards
  if (card.card_faces?.[0]?.image_uris) {
    return card.card_faces[0].image_uris[size];
  }
  return '';
}
