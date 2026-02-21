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
  { id: 'warhammer-40k',         name: 'Warhammer 40,000' },                              // říjen 2022
  { id: 'transformers',          name: 'Transformers' },                                   // listopad 2022
  { id: 'lord-of-the-rings',     name: 'The Lord of the Rings: Tales of Middle-earth' },  // červen 2023
  { id: 'doctor-who',            name: 'Doctor Who' },                                     // říjen 2023
  { id: 'fallout',               name: 'Fallout' },                                         // březen 2024
  { id: 'assassins-creed',       name: "Assassin's Creed" },                               // červenec 2024
  { id: 'spider-man',            name: 'Spider-Man' },                                     // září 2025
  { id: 'marvel-universe',       name: 'Marvel Universe' },                                // září 2025
  { id: 'final-fantasy',         name: 'Final Fantasy' },                                  // červen 2025
  { id: 'avatar-last-airbender', name: 'Avatar: The Last Airbender' },                    // listopad 2025
  { id: 'tmnt',                  name: 'Teenage Mutant Ninja Turtles' },                  // březen 2026
  { id: 'edge-of-eternities',    name: 'Edge of Eternities' },
];

export const collectionSets: CollectionSet[] = [
  { id: '40k', franchiseId: 'warhammer-40k',         code: '40K', name: 'Warhammer 40,000',                              order: 1 },
  { id: 'bot', franchiseId: 'transformers',           code: 'BOT', name: 'Transformers',                                  order: 1 },
  { id: 'ltr', franchiseId: 'lord-of-the-rings',      code: 'LTR', name: 'The Lord of the Rings: Tales of Middle-earth',  order: 1 },
  { id: 'who', franchiseId: 'doctor-who',              code: 'WHO', name: 'Doctor Who',                                   order: 1 },
  { id: 'pip', franchiseId: 'fallout',                 code: 'PIP', name: 'Fallout',                                        order: 1 },
  { id: 'acr', franchiseId: 'assassins-creed',         code: 'ACR', name: "Assassin's Creed",                               order: 1 },
  { id: 'spm', franchiseId: 'spider-man',              code: 'SPM', name: "Marvel's Spider-Man",                          order: 1 },
  { id: 'spe', franchiseId: 'spider-man',              code: 'SPE', name: "Marvel's Spider-Man Eternal",                  order: 2 },
  { id: 'mar', franchiseId: 'marvel-universe',         code: 'MAR', name: 'Marvel Universe',                              order: 1 },
  { id: 'fin', franchiseId: 'final-fantasy',           code: 'FIN', name: 'Final Fantasy',                                order: 1 },
  { id: 'fic', franchiseId: 'final-fantasy',           code: 'FIC', name: 'Final Fantasy Commander',                      order: 2 },
  { id: 'tla', franchiseId: 'avatar-last-airbender',  code: 'TLA', name: 'Avatar: The Last Airbender',                   order: 1 },
  { id: 'tle', franchiseId: 'avatar-last-airbender',  code: 'TLE', name: 'Avatar: The Last Airbender Eternal',           order: 2 },
  { id: 'tmt', franchiseId: 'tmnt',                   code: 'TMT', name: 'Teenage Mutant Ninja Turtles',                  order: 1 },
  { id: 'tmc', franchiseId: 'tmnt',                   code: 'TMC', name: 'Teenage Mutant Ninja Turtles Eternal',          order: 2 },
  { id: 'eoe', franchiseId: 'edge-of-eternities',     code: 'EOE', name: 'Edge of Eternities',                            order: 1 },
];
