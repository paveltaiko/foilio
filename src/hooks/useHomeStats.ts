import { useMemo } from 'react';
import type { OwnedCard } from '../types/card';
import { isCardOwned } from '../utils/ownership';
import { getCachedCardById } from '../utils/scryfallCache';
import { calculateOwnedCardValue } from '../utils/calculateValue';
import { parsePrice } from '../utils/formatPrice';
import { franchises, collectionSets } from '../config/collections';
import type { CollectionSettings } from '../utils/collectionsSettings';
import { getVisibleSets } from '../utils/collectionsSettings';
import { getCachedSetCount } from '../utils/scryfallCache';

export interface FranchiseStat {
  franchiseId: string;
  name: string;
  owned: number;
  total: number;
  pct: number;
}

export interface SetProgressStat {
  setId: string;
  name: string;
  owned: number;
  total: number;
  pct: number;
}

export interface NearCompleteSet {
  setId: string;
  name: string;
  owned: number;
  total: number;
  remaining: number;
  pct: number;
}

export interface ValuableCard {
  scryfallId: string;
  name: string;
  priceEur: number;
  isFoil: boolean;
}

export interface HomeStats {
  totalUniqueOwned: number;
  totalQuantityOwned: number;
  totalCardsInCollection: number;
  totalValueEur: number;
  globalCompletionPct: number;
  nonFoilCount: number;
  foilCount: number;
  nonFoilValue: number;
  foilValue: number;
  rarityBreakdown: Record<string, number>;
  topFranchises: FranchiseStat[];
  nearCompleteSets: NearCompleteSet[];
  setProgress: SetProgressStat[];
  recentCards: OwnedCard[];
  mostValuableCards: ValuableCard[];
}

export function useHomeStats(
  ownedCards: Map<string, OwnedCard>,
  settings: CollectionSettings,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _cacheVersion = 0
): HomeStats {
  return useMemo(() => {
    const cards = Array.from(ownedCards.values());

    // Basic counts
    const totalUniqueOwned = cards.filter(isCardOwned).length;
    let totalQuantityOwned = 0;
    let nonFoilCount = 0;
    let foilCount = 0;
    let totalValueEur = 0;
    let nonFoilValue = 0;
    let foilValue = 0;
    const rarityBreakdown: Record<string, number> = {};

    // Sets & franchises — owned per setCode (merged with main loop)
    const ownedBySetCode: Record<string, number> = {};

    for (const card of cards) {
      const qty = card.quantityNonFoil + card.quantityFoil;
      totalQuantityOwned += qty;
      nonFoilCount += card.quantityNonFoil;
      foilCount += card.quantityFoil;

      // Load prices and rarity from Scryfall cache
      const cached = getCachedCardById(card.scryfallId);
      if (cached) {
        const val = calculateOwnedCardValue(card, cached.prices);
        totalValueEur += val.total;
        nonFoilValue += val.nonFoil;
        foilValue += val.foil;

        // Rarita
        const rarity = cached.rarity;
        if (rarity) {
          rarityBreakdown[rarity] = (rarityBreakdown[rarity] ?? 0) + 1;
        }
      }

      // Owned per setCode
      if (isCardOwned(card)) {
        const code = card.set.toLowerCase();
        ownedBySetCode[code] = (ownedBySetCode[code] ?? 0) + 1;
      }
    }

    // Visible sets from settings
    const visibleSets = getVisibleSets(settings, collectionSets);

    // Owned per franchise (visible only, main/commander/eternal only)
    const COUNTED_TYPES = new Set(['main', 'commander', 'eternal']);
    const franchiseOwned: Record<string, number> = {};
    const franchiseTotal: Record<string, number> = {};

    for (const set of visibleSets) {
      if (!COUNTED_TYPES.has(set.type)) continue;
      const code = set.code.toLowerCase();
      const owned = ownedBySetCode[code] ?? 0;
      const total = getCachedSetCount(set.code) ?? 0;
      if (total === 0) continue;

      franchiseOwned[set.franchiseId] = (franchiseOwned[set.franchiseId] ?? 0) + owned;
      franchiseTotal[set.franchiseId] = (franchiseTotal[set.franchiseId] ?? 0) + total;
    }

    const topFranchises: FranchiseStat[] = franchises
      .filter((f) => franchiseTotal[f.id] > 0)
      .map((f) => {
        const owned = franchiseOwned[f.id] ?? 0;
        const total = franchiseTotal[f.id];
        return {
          franchiseId: f.id,
          name: f.name,
          owned,
          total,
          pct: Math.round((owned / total) * 100),
        };
      })
      .sort((a, b) => b.pct - a.pct);

    // Overall completion % across all visible sets
    const totalOwned = Object.values(franchiseOwned).reduce((a, b) => a + b, 0);
    const grandTotal = Object.values(franchiseTotal).reduce((a, b) => a + b, 0);
    const globalCompletionPct = grandTotal > 0 ? Math.round((totalOwned / grandTotal) * 100) : 0;

    // Progress of all visible sets (everything except tokens)
    const setProgress: SetProgressStat[] = visibleSets
      .filter((set) => set.type !== 'tokens')
      .map((set) => {
        const code = set.code.toLowerCase();
        const owned = ownedBySetCode[code] ?? 0;
        const total = getCachedSetCount(set.code) ?? 0;
        if (total === 0 || owned === 0) return null;
        const pct = Math.round((owned / total) * 100);
        return { setId: set.id, name: set.name, owned, total, pct };
      })
      .filter((s): s is SetProgressStat => s !== null)
      .sort((a, b) => b.pct - a.pct);

    // Sets near completion (≥70% but not 100%)
    const nearCompleteSets: NearCompleteSet[] = visibleSets
      .filter((set) => COUNTED_TYPES.has(set.type))
      .map((set) => {
        const code = set.code.toLowerCase();
        const owned = ownedBySetCode[code] ?? 0;
        const total = getCachedSetCount(set.code) ?? 0;
        if (total === 0) return null;
        const pct = Math.round((owned / total) * 100);
        if (pct < 60 || pct >= 100) return null;
        return { setId: set.id, name: set.name, owned, total, remaining: total - owned, pct };
      })
      .filter((s): s is NearCompleteSet => s !== null)
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 5);

    // Recent activity — top 5 by updatedAt
    const recentCards = [...cards]
      .filter(isCardOwned)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);

    // Most valuable cards
    const valuableCards: ValuableCard[] = [];
    for (const card of cards) {
      const cached = getCachedCardById(card.scryfallId);
      if (!cached) continue;

      const nfPrice = card.ownedNonFoil ? parsePrice(cached.prices.eur) : null;
      const foilPrice = card.ownedFoil ? parsePrice(cached.prices.eur_foil) : null;

      if (nfPrice && nfPrice > 0) {
        valuableCards.push({ scryfallId: card.scryfallId, name: card.name, priceEur: nfPrice, isFoil: false });
      }
      if (foilPrice && foilPrice > 0) {
        valuableCards.push({ scryfallId: card.scryfallId, name: card.name, priceEur: foilPrice, isFoil: true });
      }
    }
    const mostValuableCards = valuableCards
      .sort((a, b) => b.priceEur - a.priceEur)
      .slice(0, 5);

    return {
      totalUniqueOwned,
      totalQuantityOwned,
      totalCardsInCollection: grandTotal,
      totalValueEur,
      globalCompletionPct,
      nonFoilCount,
      foilCount,
      nonFoilValue,
      foilValue,
      rarityBreakdown,
      topFranchises,
      nearCompleteSets,
      setProgress,
      recentCards,
      mostValuableCards,
    };
  }, [ownedCards, settings, _cacheVersion]);
}
