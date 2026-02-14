export interface ScryfallImageUris {
  small: string;
  normal: string;
  large: string;
  png: string;
  art_crop: string;
  border_crop: string;
}

export interface ScryfallCard {
  id: string;
  name: string;
  set: string;
  set_name: string;
  collector_number: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'mythic' | 'special' | 'bonus';
  finishes: Array<'foil' | 'nonfoil' | 'etched'>;
  image_uris?: ScryfallImageUris;
  card_faces?: Array<{
    image_uris?: ScryfallImageUris;
  }>;
  prices: {
    eur: string | null;
    eur_foil: string | null;
  };
  purchase_uris?: {
    cardmarket?: string;
  };
  cardmarket_id?: number;
}

export interface ScryfallSearchResponse {
  object: 'list';
  total_cards: number;
  has_more: boolean;
  next_page?: string;
  data: ScryfallCard[];
}

export interface OwnedCard {
  scryfallId: string;
  set: string;
  collectorNumber: string;
  name: string;
  ownedNonFoil: boolean;
  ownedFoil: boolean;
  quantityNonFoil: number;
  quantityFoil: number;
  customPrice: number | null;
  customPriceFoil: number | null;
  addedAt: Date;
  updatedAt: Date;
}

export interface CardWithOwnership extends ScryfallCard {
  ownedNonFoil: boolean;
  ownedFoil: boolean;
  quantityNonFoil: number;
  quantityFoil: number;
  customPrice: number | null;
  customPriceFoil: number | null;
}

export type SetCode = 'spm' | 'spe' | 'mar';

export interface SetInfo {
  code: SetCode;
  name: string;
  totalCards: number;
  ownedCards: number;
  totalValue: number;
}

export type SortOption = 'number-asc' | 'number-desc' | 'price-asc' | 'price-desc';
export type OwnershipFilter = 'all' | 'owned' | 'missing';

export type CardVariant = 'nonfoil' | 'foil' | null;

export interface CardWithVariant {
  card: ScryfallCard;
  variant: CardVariant; // null = zobrazit obě varianty, 'nonfoil'/'foil' = zobrazit jen jednu
  sortPrice: number | null; // cena použitá pro řazení
}
