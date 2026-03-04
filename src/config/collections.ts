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

export type SetType =
  | 'main'
  | 'commander'
  | 'tokens'
  | 'promos'
  | 'art-series'
  | 'minigames'
  | 'eternal'
  | 'other';

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
  type: SetType;
}

// Set types that don't have MTGJSON data (tokens, promos, art inserts, etc.)
const SKIP_MTGJSON_TYPES = new Set<SetType>(['tokens', 'promos', 'art-series', 'minigames', 'other']);
export const skipsMtgjson = (set: CollectionSet): boolean => SKIP_MTGJSON_TYPES.has(set.type);

export const franchises: Franchise[] = [
  { id: 'warhammer-40k',         name: 'Warhammer 40,000' },                              // Oct 2022
  { id: 'transformers',          name: 'Transformers' },                                   // Nov 2022
  { id: 'lord-of-the-rings',     name: 'The Lord of the Rings' },                         // Jun 2023
  { id: 'doctor-who',            name: 'Doctor Who' },                                     // Oct 2023
  { id: 'fallout',               name: 'Fallout' },                                         // Mar 2024
  { id: 'assassins-creed',       name: "Assassin's Creed" },                               // Jul 2024
  { id: 'spider-man',            name: 'Spider-Man' },                                     // Sep 2025
  { id: 'marvel-universe',       name: 'Marvel Universe' },                                // Sep 2025
  { id: 'final-fantasy',         name: 'Final Fantasy' },                                  // Jun 2025
  { id: 'avatar-last-airbender', name: 'Avatar: The Last Airbender' },                    // Nov 2025
  { id: 'tmnt',                  name: 'Teenage Mutant Ninja Turtles' },                  // Mar 2026
  { id: 'marvel-super-heroes',   name: 'Marvel Super Heroes' },                           // Jun 2026
  { id: 'edge-of-eternities',    name: 'Edge of Eternities' },
];

export const collectionSets: CollectionSet[] = [
  // Warhammer 40,000
  { id: '40k',  franchiseId: 'warhammer-40k', code: '40K',  name: 'Warhammer 40,000',        order: 1, type: 'main'   },
  { id: 't40k', franchiseId: 'warhammer-40k', code: 'T40K', name: 'Warhammer 40,000 Tokens', order: 2, type: 'tokens' },

  // Transformers
  { id: 'bot',  franchiseId: 'transformers', code: 'BOT',  name: 'Transformers',        order: 1, type: 'main'   },
  { id: 'tbot', franchiseId: 'transformers', code: 'TBOT', name: 'Transformers Tokens', order: 2, type: 'tokens' },

  // The Lord of the Rings
  { id: 'ltr',  franchiseId: 'lord-of-the-rings', code: 'LTR',  name: 'The Lord of the Rings: Tales of Middle-earth',          order: 1, type: 'main'       },
  { id: 'ltc',  franchiseId: 'lord-of-the-rings', code: 'LTC',  name: 'Tales of Middle-earth Commander',                       order: 2, type: 'commander'  },
  { id: 'pltr', franchiseId: 'lord-of-the-rings', code: 'PLTR', name: 'Tales of Middle-earth Promos',                          order: 3, type: 'promos'     },
  { id: 'altr', franchiseId: 'lord-of-the-rings', code: 'ALTR', name: 'Tales of Middle-earth Art Series',                      order: 4, type: 'art-series' },
  { id: 'mltr', franchiseId: 'lord-of-the-rings', code: 'MLTR', name: 'Tales of Middle-earth Minigames',                       order: 5, type: 'minigames'  },

  // Doctor Who
  { id: 'who',  franchiseId: 'doctor-who', code: 'WHO',  name: 'Doctor Who',        order: 1, type: 'main'   },
  { id: 'twho', franchiseId: 'doctor-who', code: 'TWHO', name: 'Doctor Who Tokens', order: 2, type: 'tokens' },

  // Fallout
  { id: 'pip',  franchiseId: 'fallout', code: 'PIP',  name: 'Fallout',        order: 1, type: 'main'   },
  { id: 'tpip', franchiseId: 'fallout', code: 'TPIP', name: 'Fallout Tokens', order: 2, type: 'tokens' },

  // Assassin's Creed
  { id: 'acr',  franchiseId: 'assassins-creed', code: 'ACR',  name: "Assassin's Creed",            order: 1, type: 'main'       },
  { id: 'tacr', franchiseId: 'assassins-creed', code: 'TACR', name: "Assassin's Creed Tokens",     order: 2, type: 'tokens'     },
  { id: 'aacr', franchiseId: 'assassins-creed', code: 'AACR', name: "Assassin's Creed Art Series", order: 3, type: 'art-series' },
  { id: 'macr', franchiseId: 'assassins-creed', code: 'MACR', name: "Assassin's Creed Minigames",  order: 4, type: 'minigames'  },

  // Spider-Man
  { id: 'spm',  franchiseId: 'spider-man', code: 'SPM',  name: "Marvel's Spider-Man",              order: 1, type: 'main'       },
  { id: 'aspm', franchiseId: 'spider-man', code: 'ASPM', name: "Marvel's Spider-Man Art Series",   order: 2, type: 'art-series' },
  { id: 'tspm', franchiseId: 'spider-man', code: 'TSPM', name: "Marvel's Spider-Man Tokens",       order: 3, type: 'tokens'     },
  { id: 'spe',  franchiseId: 'spider-man', code: 'SPE',  name: "Marvel's Spider-Man Eternal",      order: 4, type: 'eternal'    },
  { id: 'pspm', franchiseId: 'spider-man', code: 'PSPM', name: "Marvel's Spider-Man Promos",       order: 5, type: 'promos'     },
  { id: 'lmar', franchiseId: 'spider-man', code: 'LMAR', name: 'Marvel Legends Series Inserts',    order: 6, type: 'other'      },

  // Marvel Universe
  { id: 'mar', franchiseId: 'marvel-universe', code: 'MAR', name: 'Marvel Universe', order: 1, type: 'main' },

  // Final Fantasy
  { id: 'fin',  franchiseId: 'final-fantasy', code: 'FIN',  name: 'Final Fantasy',                    order: 1, type: 'main'       },
  { id: 'pfin', franchiseId: 'final-fantasy', code: 'PFIN', name: 'Final Fantasy Promos',              order: 2, type: 'promos'     },
  { id: 'tfin', franchiseId: 'final-fantasy', code: 'TFIN', name: 'Final Fantasy Tokens',              order: 3, type: 'tokens'     },
  { id: 'rfin', franchiseId: 'final-fantasy', code: 'RFIN', name: 'Final Fantasy Regional Promos',     order: 4, type: 'promos'     },
  { id: 'afin', franchiseId: 'final-fantasy', code: 'AFIN', name: 'Final Fantasy Art Series',          order: 5, type: 'art-series' },
  { id: 'fca',  franchiseId: 'final-fantasy', code: 'FCA',  name: 'Final Fantasy: Through the Ages',   order: 6, type: 'other'      },
  { id: 'fic',  franchiseId: 'final-fantasy', code: 'FIC',  name: 'Final Fantasy Commander',           order: 7, type: 'commander'  },
  { id: 'tfic', franchiseId: 'final-fantasy', code: 'TFIC', name: 'Final Fantasy Commander Tokens',    order: 8, type: 'tokens'     },
  { id: 'afic', franchiseId: 'final-fantasy', code: 'AFIC', name: 'Final Fantasy Scene Box',           order: 9, type: 'other'      },

  // Avatar: The Last Airbender
  { id: 'tla',  franchiseId: 'avatar-last-airbender', code: 'TLA',  name: 'Avatar: The Last Airbender',                        order: 1, type: 'main'       },
  { id: 'ptla', franchiseId: 'avatar-last-airbender', code: 'PTLA', name: 'Avatar: The Last Airbender Promos',                 order: 2, type: 'promos'     },
  { id: 'atla', franchiseId: 'avatar-last-airbender', code: 'ATLA', name: 'Avatar: The Last Airbender Art Series',             order: 3, type: 'art-series' },
  { id: 'ttla', franchiseId: 'avatar-last-airbender', code: 'TTLA', name: 'Avatar: The Last Airbender Tokens',                 order: 4, type: 'tokens'     },
  { id: 'ftla', franchiseId: 'avatar-last-airbender', code: 'FTLA', name: 'Avatar: The Last Airbender Beginner Box',           order: 5, type: 'other'      },
  { id: 'jtla', franchiseId: 'avatar-last-airbender', code: 'JTLA', name: 'Avatar: The Last Airbender Jumpstart',              order: 6, type: 'other'      },
  { id: 'tle',  franchiseId: 'avatar-last-airbender', code: 'TLE',  name: 'Avatar: The Last Airbender Eternal',                order: 7, type: 'eternal'    },
  { id: 'atle', franchiseId: 'avatar-last-airbender', code: 'ATLE', name: 'Avatar: The Last Airbender Eternal Art Series',     order: 8, type: 'art-series' },
  { id: 'ttle', franchiseId: 'avatar-last-airbender', code: 'TTLE', name: 'Avatar: The Last Airbender Eternal Tokens',         order: 9, type: 'tokens'     },

  // Teenage Mutant Ninja Turtles
  { id: 'tmt',  franchiseId: 'tmnt', code: 'TMT',  name: 'Teenage Mutant Ninja Turtles',                        order: 1, type: 'main'  },
  { id: 'pza',  franchiseId: 'tmnt', code: 'PZA',  name: 'Teenage Mutant Ninja Turtles Source Material',        order: 2, type: 'other' },
  { id: 'ttmt', franchiseId: 'tmnt', code: 'TTMT', name: 'Teenage Mutant Ninja Turtles Tokens',                 order: 3, type: 'tokens' },
  { id: 'tmc',  franchiseId: 'tmnt', code: 'TMC',  name: 'Teenage Mutant Ninja Turtles Eternal',                order: 4, type: 'eternal' },
  { id: 'ftmc', franchiseId: 'tmnt', code: 'FTMC', name: 'Teenage Mutant Ninja Turtles Eternal Front Cards',    order: 5, type: 'other'  },
  { id: 'ttmc', franchiseId: 'tmnt', code: 'TTMC', name: 'Teenage Mutant Ninja Turtles Eternal Tokens',         order: 6, type: 'tokens' },

  // Marvel Super Heroes
  { id: 'msh',  franchiseId: 'marvel-super-heroes', code: 'MSH',  name: 'Marvel Super Heroes',           order: 1, type: 'main'      },
  { id: 'msc',  franchiseId: 'marvel-super-heroes', code: 'MSC',  name: 'Marvel Super Heroes Commander', order: 2, type: 'commander' },
  { id: 'tmsh', franchiseId: 'marvel-super-heroes', code: 'TMSH', name: 'Marvel Super Heroes Tokens',    order: 3, type: 'tokens'    },

  // Edge of Eternities
  { id: 'eoe', franchiseId: 'edge-of-eternities', code: 'EOE', name: 'Edge of Eternities', order: 1, type: 'main' },
];
