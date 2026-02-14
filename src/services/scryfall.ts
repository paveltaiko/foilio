import type { ScryfallCard, ScryfallSearchResponse, SetCode } from '../types/card';

const BASE_URL = 'https://api.scryfall.com';
const RATE_LIMIT_MS = 100; // Scryfall asks for 50-100ms between requests

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchCardsForSet(setCode: SetCode): Promise<ScryfallCard[]> {
  const allCards: ScryfallCard[] = [];
  let url: string | null = `${BASE_URL}/cards/search?q=set:${setCode}&order=set&unique=prints`;

  while (url) {
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) return [];
      throw new Error(`Scryfall API error: ${response.status}`);
    }

    const data: ScryfallSearchResponse = await response.json();
    allCards.push(...data.data);

    if (data.has_more && data.next_page) {
      url = data.next_page;
      await delay(RATE_LIMIT_MS);
    } else {
      url = null;
    }
  }

  return allCards;
}

export async function fetchAllSets(): Promise<Record<SetCode, ScryfallCard[]>> {
  const sets: SetCode[] = ['spm', 'spe', 'mar'];
  const results: Record<string, ScryfallCard[]> = {};

  for (const set of sets) {
    results[set] = await fetchCardsForSet(set);
    if (set !== sets[sets.length - 1]) {
      await delay(RATE_LIMIT_MS);
    }
  }

  return results as Record<SetCode, ScryfallCard[]>;
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
