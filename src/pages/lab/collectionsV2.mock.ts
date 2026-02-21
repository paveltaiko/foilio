export type FranchiseId = 'spider-man' | 'tmnt' | 'final-fantasy' | 'avatar-last-airbender' | 'edge-of-eternities';

export interface LabFranchise {
  id: FranchiseId;
  name: string;
  shortName: string;
  accentClass: string;
}

export interface LabSet {
  id: string;
  franchiseId: FranchiseId;
  code: string;
  name: string;
  order: number;
}

export interface LabCard {
  id: string;
  setId: string;
  franchiseId: FranchiseId;
  name: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'mythic';
  owned: boolean;
}

export const labFranchises: LabFranchise[] = [
  {
    id: 'spider-man',
    name: 'Spider-Man',
    shortName: 'SPM',
    accentClass: 'bg-red-100 text-red-700 border-red-200',
  },
  {
    id: 'tmnt',
    name: 'Ninja Turtles',
    shortName: 'TMNT',
    accentClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  {
    id: 'final-fantasy',
    name: 'The Entire Final Fantasy Saga',
    shortName: 'FF',
    accentClass: 'bg-sky-100 text-sky-700 border-sky-200',
  },
  {
    id: 'avatar-last-airbender',
    name: 'Avatar: The Last Airbender',
    shortName: 'ATLA',
    accentClass: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  {
    id: 'edge-of-eternities',
    name: 'Edge of Eternities',
    shortName: 'EOE',
    accentClass: 'bg-violet-100 text-violet-700 border-violet-200',
  },
];

export const labSets: LabSet[] = [
  { id: 'spm-main', franchiseId: 'spider-man', code: 'SPM', name: "Marvel's Spider-Man", order: 1 },
  { id: 'spm-eternal', franchiseId: 'spider-man', code: 'SPE', name: "Marvel's Spider-Man Eternal", order: 2 },
  { id: 'spm-marvel', franchiseId: 'spider-man', code: 'MAR', name: 'Marvel Universe', order: 3 },
  { id: 'tmnt-main', franchiseId: 'tmnt', code: 'TMT', name: 'Turtle Origins', order: 4 },
  { id: 'ff-main', franchiseId: 'final-fantasy', code: 'FIN', name: 'The Entire Final Fantasy Saga', order: 5 },
  { id: 'atla-main', franchiseId: 'avatar-last-airbender', code: 'TLA', name: 'Avatar: The Last Airbender', order: 6 },
  { id: 'eoe-main', franchiseId: 'edge-of-eternities', code: 'EOE', name: 'Edge of Eternities', order: 7 },
];

export const labCards: LabCard[] = [
  { id: 'c-001', setId: 'spm-main', franchiseId: 'spider-man', name: 'Peter Parker, Friendly Hero', rarity: 'mythic', owned: true },
  { id: 'c-002', setId: 'spm-main', franchiseId: 'spider-man', name: 'Daily Bugle Reporter', rarity: 'common', owned: false },
  { id: 'c-003', setId: 'spm-main', franchiseId: 'spider-man', name: 'Queens Rooftop Swing', rarity: 'uncommon', owned: true },
  { id: 'c-004', setId: 'spm-eternal', franchiseId: 'spider-man', name: 'Miles Morales, Quantum Dash', rarity: 'rare', owned: true },
  { id: 'c-005', setId: 'spm-eternal', franchiseId: 'spider-man', name: 'Spider-Verse Echo', rarity: 'uncommon', owned: false },
  { id: 'c-006', setId: 'spm-marvel', franchiseId: 'spider-man', name: 'Ghost-Spider Ambush', rarity: 'rare', owned: true },
  { id: 'c-007', setId: 'spm-marvel', franchiseId: 'spider-man', name: 'Symbiote Breakout', rarity: 'mythic', owned: false },
  { id: 'c-008', setId: 'tmnt-main', franchiseId: 'tmnt', name: 'Leonardo, Sewer Tactician', rarity: 'rare', owned: true },
  { id: 'c-009', setId: 'tmnt-main', franchiseId: 'tmnt', name: 'Pizza Time Rally', rarity: 'common', owned: false },
  { id: 'c-010', setId: 'ff-main', franchiseId: 'final-fantasy', name: 'Cloud, Midgar Mercenary', rarity: 'mythic', owned: true },
  { id: 'c-011', setId: 'ff-main', franchiseId: 'final-fantasy', name: 'Tifa, Seventh Heaven Fighter', rarity: 'rare', owned: false },
  { id: 'c-012', setId: 'atla-main', franchiseId: 'avatar-last-airbender', name: 'Aang, Last Airbender', rarity: 'mythic', owned: true },
  { id: 'c-013', setId: 'atla-main', franchiseId: 'avatar-last-airbender', name: 'Katara, Waterbending Master', rarity: 'rare', owned: false },
  { id: 'c-014', setId: 'eoe-main', franchiseId: 'edge-of-eternities', name: 'Edgewalker of Eternity', rarity: 'mythic', owned: false },
  { id: 'c-015', setId: 'eoe-main', franchiseId: 'edge-of-eternities', name: 'Chronicle of Infinite Worlds', rarity: 'rare', owned: true },
];
