import type { ScryfallCard } from '../types/card';

type Rarity = ScryfallCard['rarity'];

interface RarityInfo {
  label: string;
  short: string;
  colorClass: string;
  badgeClass: string;
}

const rarityMap: Record<Rarity, RarityInfo> = {
  common: {
    label: 'Common',
    short: 'C',
    colorClass: 'text-neutral-400',
    badgeClass: 'bg-neutral-400 text-white',
  },
  uncommon: {
    label: 'Uncommon',
    short: 'U',
    colorClass: 'text-slate-500',
    badgeClass: 'bg-slate-500 text-white',
  },
  rare: {
    label: 'Rare',
    short: 'R',
    colorClass: 'text-amber-500',
    badgeClass: 'bg-amber-500 text-white',
  },
  mythic: {
    label: 'Mythic',
    short: 'M',
    colorClass: 'text-red-500',
    badgeClass: 'bg-red-500 text-white',
  },
  special: {
    label: 'Special',
    short: 'S',
    colorClass: 'text-purple-500',
    badgeClass: 'bg-purple-500 text-white',
  },
  bonus: {
    label: 'Bonus',
    short: 'B',
    colorClass: 'text-purple-500',
    badgeClass: 'bg-purple-500 text-white',
  },
};

export function getRarityInfo(rarity: Rarity): RarityInfo {
  return rarityMap[rarity] ?? rarityMap.common;
}
