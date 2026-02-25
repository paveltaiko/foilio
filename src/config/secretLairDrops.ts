export interface SecretLairDrop {
  id: string;
  name: string;
  ip: string;
  releasedAt: string; // 'YYYY-MM-DD' — used as Scryfall query filter
}

export const secretLairDrops: SecretLairDrop[] = [
  // 2020
  { id: 'walking-dead',         name: 'The Walking Dead',                    ip: 'AMC',           releasedAt: '2020-10-13' },

  // 2021
  { id: 'stranger-things',      name: 'Stranger Things',                     ip: 'Netflix',        releasedAt: '2021-10-15' },
  { id: 'arcane',               name: 'Arcane League of Legends',            ip: 'Riot Games',     releasedAt: '2021-11-29' },

  // 2022
  { id: 'street-fighter',       name: 'Street Fighter',                      ip: 'Capcom',         releasedAt: '2022-02-18' },
  { id: 'fortnite-v1',          name: 'Fortnite Vol. 1',                     ip: 'Epic Games',     releasedAt: '2022-07-07' },
  { id: 'warhammer-sl',         name: 'Warhammer 40,000',                    ip: 'Games Workshop', releasedAt: '2022-11-28' },
  { id: 'transformers-sl',      name: 'Transformers',                        ip: 'Hasbro',         releasedAt: '2022-12-02' },

  // 2023
  { id: 'dungeons-dragons',     name: "Dungeons & Dragons: Honor Among Thieves", ip: 'D&D / Paramount', releasedAt: '2023-03-26' },
  { id: 'lotr-sl',              name: 'The Lord of the Rings',               ip: 'Tolkien Estate', releasedAt: '2023-08-29' },
  { id: 'evil-dead',            name: 'Evil Dead',                           ip: 'Renaissance Pictures', releasedAt: '2023-10-02' },
  { id: 'tomb-raider',          name: 'Tomb Raider',                         ip: 'Crystal Dynamics', releasedAt: '2023-11-20' },
  { id: 'jurassic-world',       name: 'Jurassic World',                      ip: 'Universal',      releasedAt: '2023-12-06' },
  { id: 'doctor-who-sl',        name: 'Doctor Who',                          ip: 'BBC',            releasedAt: '2023-12-11' },

  // 2024
  { id: 'fallout-sl',           name: 'Fallout',                             ip: 'Bethesda',       releasedAt: '2024-04-08' },
  { id: 'hatsune-miku-sakura',  name: 'Hatsune Miku: Sakura Superstar',      ip: 'Crypton Future Media', releasedAt: '2024-05-13' },
  { id: 'assassins-creed-sl',   name: "Assassin's Creed",                    ip: 'Ubisoft',        releasedAt: '2024-06-24' },
  { id: 'hatsune-miku-digital', name: 'Hatsune Miku: Digital Sensation',     ip: 'Crypton Future Media', releasedAt: '2024-07-24' },
  { id: 'monty-python',         name: 'Monty Python and the Holy Grail',     ip: 'Python Pictures', releasedAt: '2024-07-29' },
  { id: 'ghostbusters',         name: 'Ghostbusters',                        ip: 'Sony Pictures',  releasedAt: '2024-09-30' },
  { id: 'marvel-sl',            name: 'Marvel',                              ip: 'Marvel Comics',  releasedAt: '2024-11-04' },

  // 2025
  { id: 'hatsune-miku-winter',  name: 'Hatsune Miku: Winter Diva',           ip: 'Crypton Future Media', releasedAt: '2025-02-10' },
  { id: 'spongebob',            name: 'SpongeBob SquarePants',               ip: 'Nickelodeon',    releasedAt: '2025-03-24' },
  { id: 'deadpool',             name: 'Deadpool',                            ip: 'Marvel Comics',  releasedAt: '2025-04-01' },
  { id: 'sonic',                name: 'Sonic the Hedgehog',                  ip: 'Sega',           releasedAt: '2025-07-14' },
  { id: 'iron-maiden',          name: 'Iron Maiden',                         ip: 'Iron Maiden Holdings', releasedAt: '2025-10-13' },
  { id: 'playstation',          name: 'PlayStation',                         ip: 'Sony Interactive', releasedAt: '2025-10-27' },
  { id: 'avatar-sl',            name: 'Avatar: The Last Airbender',          ip: 'Nickelodeon',    releasedAt: '2025-11-17' },
  { id: 'monster-hunter',       name: 'Monster Hunter',                      ip: 'Capcom',         releasedAt: '2025-12-01' },

  // 2026
  { id: 'fallout-sl-2026',      name: 'Fallout (2026)',                      ip: 'Bethesda',       releasedAt: '2026-01-26' },
  { id: 'usagi-yojimbo',        name: 'Usagi Yojimbo',                       ip: 'Stan Sakai',     releasedAt: '2026-03-02' },
  { id: 'tmnt-sl',              name: 'Teenage Mutant Ninja Turtles',        ip: 'Viacom',         releasedAt: '2026-03-02' },
];
