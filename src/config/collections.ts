export type FranchiseId = 'spider-man' | 'tmnt' | 'final-fantasy' | 'avatar-last-airbender' | 'edge-of-eternities';

export interface Franchise {
  id: FranchiseId;
  name: string;
}

export interface CollectionSet {
  id: string;
  franchiseId: FranchiseId;
  code: string;
  name: string;
  order: number;
}

export const franchises: Franchise[] = [
  { id: 'spider-man', name: 'Spider-Man' },
  { id: 'tmnt', name: 'Teenage Mutant Ninja Turtles' },
  { id: 'final-fantasy', name: 'The Entire Final Fantasy Saga' },
  { id: 'avatar-last-airbender', name: 'Avatar: The Last Airbender' },
  { id: 'edge-of-eternities', name: 'Edge of Eternities' },
];

export const collectionSets: CollectionSet[] = [
  { id: 'spm', franchiseId: 'spider-man', code: 'SPM', name: "Marvel's Spider-Man", order: 1 },
  { id: 'spe', franchiseId: 'spider-man', code: 'SPE', name: "Marvel's Spider-Man Eternal", order: 2 },
  { id: 'mar', franchiseId: 'spider-man', code: 'MAR', name: 'Marvel Universe', order: 3 },
  { id: 'tmt', franchiseId: 'tmnt', code: 'TMT', name: 'Teenage Mutant Ninja Turtles', order: 1 },
  { id: 'tmc', franchiseId: 'tmnt', code: 'TMC', name: 'Teenage Mutant Ninja Turtles Eternal', order: 2 },
  { id: 'fin', franchiseId: 'final-fantasy', code: 'FIN', name: 'The Entire Final Fantasy Saga', order: 1 },
  { id: 'tla', franchiseId: 'avatar-last-airbender', code: 'TLA', name: 'Avatar: The Last Airbender', order: 1 },
  { id: 'eoe', franchiseId: 'edge-of-eternities', code: 'EOE', name: 'Edge of Eternities', order: 1 },
];
