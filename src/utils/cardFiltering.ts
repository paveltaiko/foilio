import type {
  ScryfallCard,
  SortOption,
  OwnershipFilter,
  BoosterFilter,
  OwnedCard,
  CardWithVariant,
} from '../types/card';
import type { BoosterMap } from '../services/mtgjson';
import { parsePrice } from './formatPrice';

/** Merge card arrays by id, avoiding duplicates. */
export function mergeCards(existing: ScryfallCard[], incoming: ScryfallCard[]) {
  if (incoming.length === 0) return existing;
  const seen = new Set(existing.map((card) => card.id));
  const merged = [...existing];
  for (const card of incoming) {
    if (seen.has(card.id)) continue;
    merged.push(card);
    seen.add(card.id);
  }
  return merged;
}

export interface FilterAndSortOptions {
  currentCards: ScryfallCard[];
  scopedOwnedCards: ScryfallCard[];
  ownedCards: Map<string, OwnedCard>;
  ownershipFilter: OwnershipFilter;
  boosterFilter: BoosterFilter;
  boosterMap: BoosterMap | undefined;
  sortOption: SortOption;
  searchQuery: string;
  shouldGroupBySet: boolean;
  setOrder: string[];
}

/**
 * Pure function that filters, searches, and sorts cards based on the provided options.
 * Returns an array of CardWithVariant ready for rendering.
 */
export function filterAndSortCards({
  currentCards,
  scopedOwnedCards,
  ownedCards,
  ownershipFilter,
  boosterFilter,
  boosterMap,
  sortOption,
  searchQuery,
  shouldGroupBySet,
  setOrder,
}: FilterAndSortOptions): CardWithVariant[] {
  let cards = ownershipFilter === 'owned'
    ? mergeCards(currentCards, scopedOwnedCards)
    : [...currentCards];

  // Search filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    const isExactNumber = /^\d+$/.test(query);
    cards = cards.filter((c) =>
      c.name.toLowerCase().includes(query) ||
      (isExactNumber
        ? c.collector_number.toLowerCase() === query
        : c.collector_number.toLowerCase().includes(query))
    );
  }

  // Booster variant resolver
  const getBoosterVariants = boosterFilter !== 'all' && boosterMap
    ? (c: ScryfallCard): Set<'foil' | 'nonfoil'> | null => {
        const entry = boosterMap.get(`${c.set}:${c.collector_number}`);
        if (!entry) return null;
        const bucket = boosterFilter === 'play' ? entry.play : entry.collector;
        return bucket.size > 0 ? bucket : null;
      }
    : null;

  if (getBoosterVariants) {
    cards = cards.filter((c) => getBoosterVariants(c) !== null);
  }

  // Number-based sorting
  const isPriceSorting = sortOption === 'price-asc' || sortOption === 'price-desc';
  if (!isPriceSorting) {
    // Ownership filter for number-based sorts
    if (ownershipFilter === 'owned') {
      cards = cards.filter((c) => {
        const o = ownedCards.get(c.id);
        return o && (o.ownedNonFoil || o.ownedFoil);
      });
    } else if (ownershipFilter === 'missing') {
      cards = cards.filter((c) => {
        const o = ownedCards.get(c.id);
        return !o || (!o.ownedNonFoil && !o.ownedFoil);
      });
    }
  }

  if (sortOption === 'number-asc' || sortOption === 'number-desc') {
    cards.sort((a, b) => {
      if (shouldGroupBySet) {
        const setDiff = setOrder.indexOf(a.set) - setOrder.indexOf(b.set);
        if (setDiff !== 0) return setDiff;
      }
      const aNum = parseInt(a.collector_number, 10) || 0;
      const bNum = parseInt(b.collector_number, 10) || 0;
      return sortOption === 'number-asc' ? aNum - bNum : bNum - aNum;
    });

    if (getBoosterVariants) {
      const result: CardWithVariant[] = [];
      for (const card of cards) {
        const variants = getBoosterVariants(card)!;
        if (variants.has('nonfoil') && card.finishes.includes('nonfoil')) {
          result.push({ card, variant: 'nonfoil', sortPrice: null });
        }
        if (variants.has('foil') && card.finishes.includes('foil')) {
          result.push({ card, variant: 'foil', sortPrice: null });
        }
      }
      return result;
    }
    return cards.map((card) => ({ card, variant: null, sortPrice: null }));
  }

  // Price-based sorting — expand into foil/non-foil variants
  const expanded: CardWithVariant[] = [];

  for (const card of cards) {
    const boosterVariants = getBoosterVariants ? getBoosterVariants(card) : null;
    const showNonFoil = card.finishes.includes('nonfoil') && (!boosterVariants || boosterVariants.has('nonfoil'));
    const showFoil = card.finishes.includes('foil') && (!boosterVariants || boosterVariants.has('foil'));

    if (showNonFoil) {
      expanded.push({ card, variant: 'nonfoil', sortPrice: parsePrice(card.prices.eur) });
    }
    if (showFoil) {
      expanded.push({ card, variant: 'foil', sortPrice: parsePrice(card.prices.eur_foil) });
    }
  }

  // Ownership filter for price sorts (applied per-variant)
  let filtered = expanded;
  if (ownershipFilter === 'owned') {
    filtered = expanded.filter(({ card, variant }) => {
      const o = ownedCards.get(card.id);
      return variant === 'nonfoil' ? o?.ownedNonFoil : o?.ownedFoil;
    });
  } else if (ownershipFilter === 'missing') {
    filtered = expanded.filter(({ card, variant }) => {
      const o = ownedCards.get(card.id);
      return variant === 'nonfoil' ? !o?.ownedNonFoil : !o?.ownedFoil;
    });
  }

  filtered.sort((a, b) => {
    const aPrice = a.sortPrice ?? 0;
    const bPrice = b.sortPrice ?? 0;
    return sortOption === 'price-asc' ? aPrice - bPrice : bPrice - aPrice;
  });

  return filtered;
}
