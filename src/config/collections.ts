export type FranchiseId =
  | 'warhammer-40k'
  | 'transformers'
  | 'lord-of-the-rings'
  | 'doctor-who'
  | 'fallout'
  | 'assassins-creed'
  | 'spider-man'
  | 'marvel-universe'
  | 'marvel-super-heroes'
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
  { id: 'lord-of-the-rings',     name: 'The Lord of the Rings' },                         // červen 2023
  { id: 'doctor-who',            name: 'Doctor Who' },                                     // říjen 2023
  { id: 'fallout',               name: 'Fallout' },                                         // březen 2024
  { id: 'assassins-creed',       name: "Assassin's Creed" },                               // červenec 2024
  { id: 'spider-man',            name: 'Spider-Man' },                                     // září 2025
  { id: 'marvel-universe',       name: 'Marvel Universe' },                                // září 2025
  { id: 'final-fantasy',         name: 'Final Fantasy' },                                  // červen 2025
  { id: 'avatar-last-airbender', name: 'Avatar: The Last Airbender' },                    // listopad 2025
  { id: 'tmnt',                  name: 'Teenage Mutant Ninja Turtles' },                  // březen 2026
  { id: 'marvel-super-heroes',   name: 'Marvel Super Heroes' },                           // červen 2026
  { id: 'edge-of-eternities',    name: 'Edge of Eternities' },
];

export const collectionSets: CollectionSet[] = [
  // Warhammer 40,000
  { id: '40k',  franchiseId: 'warhammer-40k', code: '40K',  name: 'Warhammer 40,000',        order: 1 },
  { id: 't40k', franchiseId: 'warhammer-40k', code: 'T40K', name: 'Warhammer 40,000 Tokens', order: 2 },

  // Transformers
  { id: 'bot',  franchiseId: 'transformers', code: 'BOT',  name: 'Transformers',        order: 1 },
  { id: 'tbot', franchiseId: 'transformers', code: 'TBOT', name: 'Transformers Tokens', order: 2 },

  // The Lord of the Rings
  { id: 'ltr',  franchiseId: 'lord-of-the-rings', code: 'LTR',  name: 'The Lord of the Rings: Tales of Middle-earth',          order: 1 },
  { id: 'ltc',  franchiseId: 'lord-of-the-rings', code: 'LTC',  name: 'Tales of Middle-earth Commander',                       order: 2 },
  { id: 'pltr', franchiseId: 'lord-of-the-rings', code: 'PLTR', name: 'Tales of Middle-earth Promos',                          order: 3 },
  { id: 'altr', franchiseId: 'lord-of-the-rings', code: 'ALTR', name: 'Tales of Middle-earth Art Series',                      order: 4 },
  { id: 'mltr', franchiseId: 'lord-of-the-rings', code: 'MLTR', name: 'Tales of Middle-earth Minigames',                       order: 5 },

  // Doctor Who
  { id: 'who',  franchiseId: 'doctor-who', code: 'WHO',  name: 'Doctor Who',        order: 1 },
  { id: 'twho', franchiseId: 'doctor-who', code: 'TWHO', name: 'Doctor Who Tokens', order: 2 },

  // Fallout
  { id: 'pip',  franchiseId: 'fallout', code: 'PIP',  name: 'Fallout',        order: 1 },
  { id: 'tpip', franchiseId: 'fallout', code: 'TPIP', name: 'Fallout Tokens', order: 2 },

  // Assassin's Creed
  { id: 'acr',  franchiseId: 'assassins-creed', code: 'ACR',  name: "Assassin's Creed",            order: 1 },
  { id: 'tacr', franchiseId: 'assassins-creed', code: 'TACR', name: "Assassin's Creed Tokens",     order: 2 },
  { id: 'aacr', franchiseId: 'assassins-creed', code: 'AACR', name: "Assassin's Creed Art Series", order: 3 },
  { id: 'macr', franchiseId: 'assassins-creed', code: 'MACR', name: "Assassin's Creed Minigames",  order: 4 },

  // Spider-Man
  { id: 'spm',  franchiseId: 'spider-man', code: 'SPM',  name: "Marvel's Spider-Man",              order: 1 },
  { id: 'aspm', franchiseId: 'spider-man', code: 'ASPM', name: "Marvel's Spider-Man Art Series",   order: 2 },
  { id: 'tspm', franchiseId: 'spider-man', code: 'TSPM', name: "Marvel's Spider-Man Tokens",       order: 3 },
  { id: 'spe',  franchiseId: 'spider-man', code: 'SPE',  name: "Marvel's Spider-Man Eternal",      order: 4 },
  { id: 'pspm', franchiseId: 'spider-man', code: 'PSPM', name: "Marvel's Spider-Man Promos",       order: 5 },
  { id: 'lmar', franchiseId: 'spider-man', code: 'LMAR', name: 'Marvel Legends Series Inserts',    order: 6 },

  // Marvel Universe
  { id: 'mar', franchiseId: 'marvel-universe', code: 'MAR', name: 'Marvel Universe', order: 1 },

  // Final Fantasy
  { id: 'fin',  franchiseId: 'final-fantasy', code: 'FIN',  name: 'Final Fantasy',                    order: 1 },
  { id: 'pfin', franchiseId: 'final-fantasy', code: 'PFIN', name: 'Final Fantasy Promos',              order: 2 },
  { id: 'tfin', franchiseId: 'final-fantasy', code: 'TFIN', name: 'Final Fantasy Tokens',              order: 3 },
  { id: 'rfin', franchiseId: 'final-fantasy', code: 'RFIN', name: 'Final Fantasy Regional Promos',     order: 4 },
  { id: 'afin', franchiseId: 'final-fantasy', code: 'AFIN', name: 'Final Fantasy Art Series',          order: 5 },
  { id: 'fca',  franchiseId: 'final-fantasy', code: 'FCA',  name: 'Final Fantasy: Through the Ages',   order: 6 },
  { id: 'fic',  franchiseId: 'final-fantasy', code: 'FIC',  name: 'Final Fantasy Commander',           order: 7 },
  { id: 'tfic', franchiseId: 'final-fantasy', code: 'TFIC', name: 'Final Fantasy Commander Tokens',    order: 8 },
  { id: 'afic', franchiseId: 'final-fantasy', code: 'AFIC', name: 'Final Fantasy Scene Box',           order: 9 },

  // Avatar: The Last Airbender
  { id: 'tla',  franchiseId: 'avatar-last-airbender', code: 'TLA',  name: 'Avatar: The Last Airbender',                        order: 1 },
  { id: 'ptla', franchiseId: 'avatar-last-airbender', code: 'PTLA', name: 'Avatar: The Last Airbender Promos',                 order: 2 },
  { id: 'atla', franchiseId: 'avatar-last-airbender', code: 'ATLA', name: 'Avatar: The Last Airbender Art Series',             order: 3 },
  { id: 'ttla', franchiseId: 'avatar-last-airbender', code: 'TTLA', name: 'Avatar: The Last Airbender Tokens',                 order: 4 },
  { id: 'ftla', franchiseId: 'avatar-last-airbender', code: 'FTLA', name: 'Avatar: The Last Airbender Beginner Box',           order: 5 },
  { id: 'jtla', franchiseId: 'avatar-last-airbender', code: 'JTLA', name: 'Avatar: The Last Airbender Jumpstart',              order: 6 },
  { id: 'tle',  franchiseId: 'avatar-last-airbender', code: 'TLE',  name: 'Avatar: The Last Airbender Eternal',                order: 7 },
  { id: 'atle', franchiseId: 'avatar-last-airbender', code: 'ATLE', name: 'Avatar: The Last Airbender Eternal Art Series',     order: 8 },
  { id: 'ttle', franchiseId: 'avatar-last-airbender', code: 'TTLE', name: 'Avatar: The Last Airbender Eternal Tokens',         order: 9 },

  // Teenage Mutant Ninja Turtles
  { id: 'tmt',  franchiseId: 'tmnt', code: 'TMT',  name: 'Teenage Mutant Ninja Turtles',                        order: 1 },
  { id: 'pza',  franchiseId: 'tmnt', code: 'PZA',  name: 'Teenage Mutant Ninja Turtles Source Material',        order: 2 },
  { id: 'ttmt', franchiseId: 'tmnt', code: 'TTMT', name: 'Teenage Mutant Ninja Turtles Tokens',                 order: 3 },
  { id: 'tmc',  franchiseId: 'tmnt', code: 'TMC',  name: 'Teenage Mutant Ninja Turtles Eternal',                order: 4 },
  { id: 'ftmc', franchiseId: 'tmnt', code: 'FTMC', name: 'Teenage Mutant Ninja Turtles Eternal Front Cards',    order: 5 },
  { id: 'ttmc', franchiseId: 'tmnt', code: 'TTMC', name: 'Teenage Mutant Ninja Turtles Eternal Tokens',         order: 6 },

  // Marvel Super Heroes
  { id: 'msh',  franchiseId: 'marvel-super-heroes', code: 'MSH',  name: 'Marvel Super Heroes',           order: 1 },
  { id: 'msc',  franchiseId: 'marvel-super-heroes', code: 'MSC',  name: 'Marvel Super Heroes Commander', order: 2 },
  { id: 'tmsh', franchiseId: 'marvel-super-heroes', code: 'TMSH', name: 'Marvel Super Heroes Tokens',    order: 3 },

  // Edge of Eternities
  { id: 'eoe', franchiseId: 'edge-of-eternities', code: 'EOE', name: 'Edge of Eternities', order: 1 },
];
