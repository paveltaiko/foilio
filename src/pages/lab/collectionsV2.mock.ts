export type FranchiseId =
  | 'warhammer-40k'
  | 'transformers'
  | 'lord-of-the-rings'
  | 'doctor-who'
  | 'fallout'
  | 'assassins-creed'
  | 'spider-man'
  | 'marvel-universe'
  | 'final-fantasy'
  | 'avatar-last-airbender'
  | 'tmnt'
  | 'edge-of-eternities';

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
    id: 'warhammer-40k',
    name: 'Warhammer 40,000',
    shortName: '40K',
    accentClass: 'bg-red-100 text-red-800 border-red-200',
  },
  {
    id: 'transformers',
    name: 'Transformers',
    shortName: 'TF',
    accentClass: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  {
    id: 'lord-of-the-rings',
    name: 'The Lord of the Rings: Tales of Middle-earth',
    shortName: 'LTR',
    accentClass: 'bg-stone-100 text-stone-700 border-stone-200',
  },
  {
    id: 'doctor-who',
    name: 'Doctor Who',
    shortName: 'WHO',
    accentClass: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  },
  {
    id: 'fallout',
    name: 'Fallout',
    shortName: 'PIP',
    accentClass: 'bg-lime-100 text-lime-700 border-lime-200',
  },
  {
    id: 'assassins-creed',
    name: "Assassin's Creed",
    shortName: 'ACR',
    accentClass: 'bg-neutral-100 text-neutral-700 border-neutral-200',
  },
  {
    id: 'spider-man',
    name: 'Spider-Man',
    shortName: 'SPM',
    accentClass: 'bg-red-100 text-red-700 border-red-200',
  },
  {
    id: 'marvel-universe',
    name: 'Marvel Universe',
    shortName: 'MAR',
    accentClass: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  },
  {
    id: 'final-fantasy',
    name: 'Final Fantasy',
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
    id: 'tmnt',
    name: 'Ninja Turtles',
    shortName: 'TMNT',
    accentClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  {
    id: 'edge-of-eternities',
    name: 'Edge of Eternities',
    shortName: 'EOE',
    accentClass: 'bg-violet-100 text-violet-700 border-violet-200',
  },
];

export const labSets: LabSet[] = [
  { id: '40k-main',    franchiseId: 'warhammer-40k',       code: '40K', name: 'Warhammer 40,000',                              order: 1 },
  { id: 'bot-main',    franchiseId: 'transformers',         code: 'BOT', name: 'Transformers',                                  order: 2 },
  { id: 'ltr-main',    franchiseId: 'lord-of-the-rings',    code: 'LTR', name: 'The Lord of the Rings: Tales of Middle-earth',  order: 3 },
  { id: 'who-main',    franchiseId: 'doctor-who',            code: 'WHO', name: 'Doctor Who',                                   order: 4 },
  { id: 'pip-main',    franchiseId: 'fallout',               code: 'PIP', name: 'Fallout',                                        order: 5 },
  { id: 'acr-main',    franchiseId: 'assassins-creed',       code: 'ACR', name: "Assassin's Creed",                               order: 6 },
  { id: 'spm-main',    franchiseId: 'spider-man',            code: 'SPM', name: "Marvel's Spider-Man",                          order: 7 },
  { id: 'spm-eternal', franchiseId: 'spider-man',            code: 'SPE', name: "Marvel's Spider-Man Eternal",                  order: 8 },
  { id: 'mar-main',    franchiseId: 'marvel-universe',       code: 'MAR', name: 'Marvel Universe',                              order: 9 },
  { id: 'ff-main',     franchiseId: 'final-fantasy',         code: 'FIN', name: 'Final Fantasy',                                order: 10 },
  { id: 'ff-cmd',      franchiseId: 'final-fantasy',         code: 'FIC', name: 'Final Fantasy Commander',                      order: 11 },
  { id: 'atla-main',   franchiseId: 'avatar-last-airbender', code: 'TLA', name: 'Avatar: The Last Airbender',                   order: 12 },
  { id: 'atla-eternal',franchiseId: 'avatar-last-airbender', code: 'TLE', name: 'Avatar: The Last Airbender Eternal',           order: 13 },
  { id: 'tmnt-main',   franchiseId: 'tmnt',                  code: 'TMT', name: 'Turtle Origins',                               order: 14 },
  { id: 'eoe-main',    franchiseId: 'edge-of-eternities',    code: 'EOE', name: 'Edge of Eternities',                           order: 15 },
];

export const labCards: LabCard[] = [
  { id: 'c-001', setId: 'spm-main', franchiseId: 'spider-man', name: 'Peter Parker, Friendly Hero', rarity: 'mythic', owned: true },
  { id: 'c-002', setId: 'spm-main', franchiseId: 'spider-man', name: 'Daily Bugle Reporter', rarity: 'common', owned: false },
  { id: 'c-003', setId: 'spm-main', franchiseId: 'spider-man', name: 'Queens Rooftop Swing', rarity: 'uncommon', owned: true },
  { id: 'c-004', setId: 'spm-eternal', franchiseId: 'spider-man', name: 'Miles Morales, Quantum Dash', rarity: 'rare', owned: true },
  { id: 'c-005', setId: 'spm-eternal', franchiseId: 'spider-man', name: 'Spider-Verse Echo', rarity: 'uncommon', owned: false },
  { id: 'c-006', setId: 'mar-main', franchiseId: 'marvel-universe', name: 'Ghost-Spider Ambush', rarity: 'rare', owned: true },
  { id: 'c-007', setId: 'mar-main', franchiseId: 'marvel-universe', name: 'Symbiote Breakout', rarity: 'mythic', owned: false },
  { id: 'c-008', setId: 'tmnt-main', franchiseId: 'tmnt', name: 'Leonardo, Sewer Tactician', rarity: 'rare', owned: true },
  { id: 'c-009', setId: 'tmnt-main', franchiseId: 'tmnt', name: 'Pizza Time Rally', rarity: 'common', owned: false },
  { id: 'c-010', setId: 'ff-main', franchiseId: 'final-fantasy', name: 'Cloud, Midgar Mercenary', rarity: 'mythic', owned: true },
  { id: 'c-011', setId: 'ff-main', franchiseId: 'final-fantasy', name: 'Tifa, Seventh Heaven Fighter', rarity: 'rare', owned: false },
  { id: 'c-012', setId: 'atla-main', franchiseId: 'avatar-last-airbender', name: 'Aang, Last Airbender', rarity: 'mythic', owned: true },
  { id: 'c-013', setId: 'atla-main', franchiseId: 'avatar-last-airbender', name: 'Katara, Waterbending Master', rarity: 'rare', owned: false },
  { id: 'c-014', setId: 'eoe-main', franchiseId: 'edge-of-eternities', name: 'Edgewalker of Eternity', rarity: 'mythic', owned: false },
  { id: 'c-015', setId: 'eoe-main', franchiseId: 'edge-of-eternities', name: 'Chronicle of Infinite Worlds', rarity: 'rare', owned: true },
];
