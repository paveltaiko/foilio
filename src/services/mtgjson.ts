import type { CardProduct } from '../types/card';

const MTGJSON_BASE = 'https://mtgjson.com/api/v5';

// Categories to show — skip "case" and "subset" products (those are just boxes of boxes)
const RELEVANT_CATEGORIES = new Set([
  'booster_pack',
  'booster_box',
  'bundle',
  'box_set',
  'deck',
  'limited_aid_tool',
  'unknown',
]);

interface MtgjsonSealedProduct {
  uuid: string;
  name: string;
  category?: string;
  subtype?: string | null;
}

interface MtgjsonCard {
  number: string;
  sourceProducts?: {
    foil?: string[];
    nonfoil?: string[];
  };
}

interface MtgjsonSetData {
  cards: MtgjsonCard[];
  sealedProduct?: MtgjsonSealedProduct[];
}

interface MtgjsonResponse {
  data: MtgjsonSetData;
}

// Module-level cache to avoid redundant fetches within the same session
// (React Query handles longer-term caching)
const setCache = new Map<string, MtgjsonSetData>();

async function fetchMtgjsonSet(setCode: string): Promise<MtgjsonSetData> {
  const key = setCode.toUpperCase();
  if (setCache.has(key)) return setCache.get(key)!;

  const response = await fetch(`${MTGJSON_BASE}/${key}.json`);
  if (!response.ok) throw new Error(`MTGJSON fetch failed for ${key}: ${response.status}`);

  const json: MtgjsonResponse = await response.json();
  setCache.set(key, json.data);
  return json.data;
}

function formatProductName(raw: string): string {
  // Remove common prefixes to keep names short in UI
  return raw
    .replace(/^Marvels Spider-?Man\s*/i, '')
    .replace(/^Marvel Universe\s*/i, '')
    .trim();
}

export interface BoosterEntry {
  play: Set<'foil' | 'nonfoil'>;
  collector: Set<'foil' | 'nonfoil'>;
}
export type BoosterMap = Map<string, BoosterEntry>;

export async function fetchBoosterMap(): Promise<BoosterMap> {
  const [spmData, speData, marData] = await Promise.all([
    fetchMtgjsonSet('spm'),
    fetchMtgjsonSet('spe'),
    fetchMtgjsonSet('mar'),
  ]);

  // SPM.json holds all sealedProduct definitions for the whole set family
  const sealedProducts = spmData.sealedProduct ?? [];
  const productMap = new Map(sealedProducts.map((p) => [p.uuid, p]));

  const boosterMap: BoosterMap = new Map();

  const processCards = (cards: MtgjsonCard[], setCode: string) => {
    for (const card of cards) {
      if (!card.sourceProducts) continue;

      const foilUuids = card.sourceProducts.foil ?? [];
      const nonfoilUuids = card.sourceProducts.nonfoil ?? [];

      const entry: BoosterEntry = {
        play: new Set(),
        collector: new Set(),
      };

      for (const uuid of foilUuids) {
        const product = productMap.get(uuid);
        if (!product || product.category !== 'booster_pack') continue;
        if (product.subtype === 'play') entry.play.add('foil');
        if (product.subtype === 'collector') entry.collector.add('foil');
      }
      for (const uuid of nonfoilUuids) {
        const product = productMap.get(uuid);
        if (!product || product.category !== 'booster_pack') continue;
        if (product.subtype === 'play') entry.play.add('nonfoil');
        if (product.subtype === 'collector') entry.collector.add('nonfoil');
      }

      if (entry.play.size > 0 || entry.collector.size > 0) {
        boosterMap.set(`${setCode}:${card.number}`, entry);
      }
    }
  };

  processCards(spmData.cards, 'spm');
  processCards(speData.cards, 'spe');
  processCards(marData.cards, 'mar');

  return boosterMap;
}

export async function fetchCardProducts(
  setCode: string,
  collectorNumber: string
): Promise<CardProduct[]> {
  // SPM.json is the master — it holds all sealedProduct definitions
  const [spmData, cardSetData] = await Promise.all([
    fetchMtgjsonSet('spm'),
    setCode.toLowerCase() !== 'spm' ? fetchMtgjsonSet(setCode) : Promise.resolve(null),
  ]);

  const setData = cardSetData ?? spmData;
  const card = setData.cards.find((c) => c.number === collectorNumber);
  if (!card || !card.sourceProducts) return [];

  const foilUuids = new Set(card.sourceProducts.foil ?? []);
  const nonfoilUuids = new Set(card.sourceProducts.nonfoil ?? []);
  const allUuids = new Set([...foilUuids, ...nonfoilUuids]);

  const sealedProducts = spmData.sealedProduct ?? [];
  const productMap = new Map(sealedProducts.map((p) => [p.uuid, p]));

  const results = new Map<string, CardProduct>();

  for (const uuid of allUuids) {
    const product = productMap.get(uuid);
    if (!product) continue;

    const category = product.category ?? 'unknown';
    if (!RELEVANT_CATEGORIES.has(category)) continue;

    const existing = results.get(uuid);
    if (existing) {
      if (foilUuids.has(uuid)) existing.availableFoil = true;
      if (nonfoilUuids.has(uuid)) existing.availableNonFoil = true;
    } else {
      results.set(uuid, {
        uuid,
        name: formatProductName(product.name),
        category,
        subtype: product.subtype ?? null,
        availableNonFoil: nonfoilUuids.has(uuid),
        availableFoil: foilUuids.has(uuid),
      });
    }
  }

  return Array.from(results.values());
}
