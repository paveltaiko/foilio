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
import { isCardOwned } from './ownership';

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
  ownedCards: Map<string, OwnedCard>;
  ownershipFilter: OwnershipFilter;
  sortOption: SortOption;
  searchQuery: string;
  // UB-specific (optional, unused in singleVariant mode)
  scopedOwnedCards?: ScryfallCard[];
  boosterFilter?: BoosterFilter;
  boosterMap?: BoosterMap | undefined;
  shouldGroupBySet?: boolean;
  setOrder?: string[];
  /** When true, each card produces a single CardWithVariant entry (SLD mode). */
  singleVariant?: boolean;
}

/**
 * Pure function that filters, searches, and sorts cards based on the provided options.
 * Returns an array of CardWithVariant ready for rendering.
 */
export function filterAndSortCards(options: FilterAndSortOptions): CardWithVariant[] {
  const {
    currentCards,
    ownedCards,
    ownershipFilter,
    sortOption,
    searchQuery,
    scopedOwnedCards = [],
    boosterFilter = 'all',
    boosterMap,
    shouldGroupBySet = false,
    setOrder = [],
    singleVariant = false,
  } = options;

  let cards = ownershipFilter === 'owned' && !singleVariant
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

  // SLD single-variant path — one CardWithVariant entry per card
  if (singleVariant) {
    return filterAndSortSingleVariant(cards, ownedCards, ownershipFilter, sortOption);
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
      cards = cards.filter((c) => isCardOwned(ownedCards.get(c.id)));
    } else if (ownershipFilter === 'missing') {
      cards = cards.filter((c) => !isCardOwned(ownedCards.get(c.id)));
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

/**
 * SLD-style single-variant mode: one CardWithVariant entry per card
 * with variant determined by available finishes.
 */
function filterAndSortSingleVariant(
  cards: ScryfallCard[],
  ownedCards: Map<string, OwnedCard>,
  ownershipFilter: OwnershipFilter,
  sortOption: SortOption,
): CardWithVariant[] {
  // Ownership filter
  if (ownershipFilter === 'owned') {
    cards = cards.filter((c) => isCardOwned(ownedCards.get(c.id)));
  } else if (ownershipFilter === 'missing') {
    cards = cards.filter((c) => !isCardOwned(ownedCards.get(c.id)));
  }

  // Expand into single variants based on available finishes
  const withVariants: CardWithVariant[] = [];
  for (const card of cards) {
    const hasNonFoil = card.finishes.includes('nonfoil');
    const hasFoil = card.finishes.includes('foil') || card.finishes.includes('etched');

    if (hasNonFoil && hasFoil) {
      withVariants.push({ card, variant: null, sortPrice: parsePrice(card.prices.eur) });
    } else if (hasNonFoil) {
      withVariants.push({ card, variant: 'nonfoil', sortPrice: parsePrice(card.prices.eur) });
    } else if (hasFoil) {
      withVariants.push({ card, variant: 'foil', sortPrice: parsePrice(card.prices.eur_foil) });
    } else {
      withVariants.push({ card, variant: null, sortPrice: null });
    }
  }

  // Sort
  withVariants.sort((a, b) => {
    if (sortOption === 'price-asc' || sortOption === 'price-desc') {
      const aPrice = a.sortPrice ?? -1;
      const bPrice = b.sortPrice ?? -1;
      return sortOption === 'price-asc' ? aPrice - bPrice : bPrice - aPrice;
    }
    const aNum = parseInt(a.card.collector_number, 10) || 0;
    const bNum = parseInt(b.card.collector_number, 10) || 0;
    return sortOption === 'number-asc' ? aNum - bNum : bNum - aNum;
  });

  return withVariants;
}
