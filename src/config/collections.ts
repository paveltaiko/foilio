export type FranchiseId = 'spider-man';

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
];

export const collectionSets: CollectionSet[] = [
  { id: 'spm', franchiseId: 'spider-man', code: 'SPM', name: "Marvel's Spider-Man", order: 1 },
  { id: 'spe', franchiseId: 'spider-man', code: 'SPE', name: "Marvel's Spider-Man Eternal", order: 2 },
  { id: 'mar', franchiseId: 'spider-man', code: 'MAR', name: 'Marvel Universe', order: 3 },
];
