import type { CardProduct } from '../types/card';
import type { CollectionSet } from '../config/collections';

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

// Master set = first set (lowest order) within a franchise
// It holds sealedProduct definitions for the whole franchise family
function getMasterSetId(franchiseId: string, sets: CollectionSet[]): string {
  const franchiseSets = sets
    .filter((s) => s.franchiseId === franchiseId)
    .sort((a, b) => a.order - b.order);
  if (franchiseSets.length === 0) throw new Error(`No sets found for franchise: ${franchiseId}`);
  return franchiseSets[0].id;
}

export interface BoosterEntry {
  play: Set<'foil' | 'nonfoil'>;
  collector: Set<'foil' | 'nonfoil'>;
}
export type BoosterMap = Map<string, BoosterEntry>;

export async function fetchBoosterMap(sets: CollectionSet[]): Promise<BoosterMap> {
  // Fetch all set data in parallel
  const setDataList = await Promise.all(sets.map((s) => fetchMtgjsonSet(s.id)));
  const setDataById: Record<string, MtgjsonSetData> = {};
  sets.forEach((s, i) => { setDataById[s.id] = setDataList[i]; });

  // Build a product map per franchise (from the master set of each franchise)
  const franchiseIds = [...new Set(sets.map((s) => s.franchiseId))];
  const productMapByFranchise: Record<string, Map<string, MtgjsonSealedProduct>> = {};
  for (const franchiseId of franchiseIds) {
    const masterId = getMasterSetId(franchiseId, sets);
    const masterData = setDataById[masterId];
    const sealedProducts = masterData?.sealedProduct ?? [];
    productMapByFranchise[franchiseId] = new Map(sealedProducts.map((p) => [p.uuid, p]));
  }

  const boosterMap: BoosterMap = new Map();

  const processCards = (cards: MtgjsonCard[], setCode: string, franchiseId: string) => {
    const productMap = productMapByFranchise[franchiseId];
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

  for (const set of sets) {
    const data = setDataById[set.id];
    if (data) processCards(data.cards, set.id, set.franchiseId);
  }

  return boosterMap;
}

export async function fetchCardProducts(
  setCode: string,
  collectorNumber: string,
  sets: CollectionSet[]
): Promise<CardProduct[]> {
  // Find which franchise this set belongs to, then get its master set
  const matchedSet = sets.find((s) => s.id === setCode.toLowerCase());
  const franchiseId = matchedSet?.franchiseId;
  const masterId = franchiseId ? getMasterSetId(franchiseId, sets) : setCode.toLowerCase();

  const [masterData, cardSetData] = await Promise.all([
    fetchMtgjsonSet(masterId),
    setCode.toLowerCase() !== masterId ? fetchMtgjsonSet(setCode) : Promise.resolve(null),
  ]);

  const setData = cardSetData ?? masterData;
  const card = setData.cards.find((c) => c.number === collectorNumber);
  if (!card || !card.sourceProducts) return [];

  const foilUuids = new Set(card.sourceProducts.foil ?? []);
  const nonfoilUuids = new Set(card.sourceProducts.nonfoil ?? []);
  const allUuids = new Set([...foilUuids, ...nonfoilUuids]);

  const sealedProducts = masterData.sealedProduct ?? [];
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
