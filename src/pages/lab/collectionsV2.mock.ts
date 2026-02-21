export type FranchiseId = 'spider-man' | 'tmnt';

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
];

export const labSets: LabSet[] = [
  { id: 'spm-main', franchiseId: 'spider-man', code: 'SPM', name: "Marvel's Spider-Man", order: 1 },
  { id: 'spm-eternal', franchiseId: 'spider-man', code: 'SPE', name: "Marvel's Spider-Man Eternal", order: 2 },
  { id: 'spm-marvel', franchiseId: 'spider-man', code: 'MAR', name: 'Marvel Universe', order: 3 },
  { id: 'tmnt-main', franchiseId: 'tmnt', code: 'TMT', name: 'Turtle Origins', order: 4 },
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
];
