# TypeScript Typy – Foilio

Centrální typy jsou v [src/types/](../src/types/). Jsou importovány napříč celou aplikací.

---

## Obsah

- [card.ts – Karty a kolekce](#cardts--karty-a-kolekce)
- [user.ts – Uživatelský profil](#userts--uživatelský-profil)

---

## card.ts – Karty a kolekce

**Soubor:** [src/types/card.ts](../src/types/card.ts)

### ScryfallImageUris

Sada URL obrázků jedné karty v různých velikostech.

```typescript
interface ScryfallImageUris {
  small: string;        // ~146×204px – pro thumbnaily
  normal: string;       // ~488×680px – standardní zobrazení v gridu
  large: string;        // ~672×936px – pro CardDetail modal
  png: string;          // Full resolution PNG
  art_crop: string;     // Oříznutý artwork
  border_crop: string;  // Karta bez borderu
}
```

### ScryfallCard

Reprezentace karty z Scryfall API. Toto je primární datový objekt pro informace o kartě.

```typescript
interface ScryfallCard {
  id: string;                  // Unikátní Scryfall UUID
  name: string;                // Název karty, např. "Primaris Ultramarine"
  set: string;                 // Kód sady, malá písmena, např. "40k"
  set_name: string;            // Plný název sady, např. "Warhammer 40,000"
  collector_number: string;    // Číslo karty v sadě, např. "042" nebo "42★"
  rarity: 'common' | 'uncommon' | 'rare' | 'mythic' | 'special' | 'bonus';
  finishes: Array<'foil' | 'nonfoil' | 'etched'>;  // Dostupné varianty tisku
  image_uris?: ScryfallImageUris;        // Obrázky (pro single-faced karty)
  card_faces?: Array<{                   // Pro double-faced karty (DFC)
    image_uris?: ScryfallImageUris;
  }>;
  prices: {
    eur: string | null;        // Non-foil cena v EUR (string nebo null)
    eur_foil: string | null;   // Foil cena v EUR
  };
  purchase_uris?: {
    cardmarket?: string;       // Přímý odkaz na Cardmarket
  };
  cardmarket_id?: number;      // Cardmarket numerické ID
}
```

**Důležité poznámky:**
- `prices.eur` je `string`, ne `number` – je třeba parsovat přes `parsePrice()` z `utils/formatPrice.ts`
- `image_uris` může chybět u DFC karet – pak použij `card_faces[0].image_uris`
- `finishes` určuje, jaká tlačítka ownership se zobrazí: pokud karta nemá `'foil'` v `finishes`, foil tlačítko se neskryje v UI
- `collector_number` může obsahovat hvězdičky (`★`), písmena (`42a`, `42b`) pro varianty

### ScryfallSearchResponse

Raw response ze Scryfall Search API.

```typescript
interface ScryfallSearchResponse {
  object: 'list';
  total_cards: number;     // Celkový počet výsledků (napříč stránkami)
  has_more: boolean;       // Existuje další stránka?
  next_page?: string;      // URL další stránky (pokud has_more)
  data: ScryfallCard[];    // Karty na aktuální stránce (max 175)
}
```

### ScryfallCardsPage

Normalizovaná verze stránky výsledků pro aplikaci.

```typescript
interface ScryfallCardsPage {
  cards: ScryfallCard[];
  hasMore: boolean;
  nextPage: string | null;
}
```

### OwnedCard

Záznam vlastněné karty uložený v Firestore. Klíčový typ pro tracking kolekce.

```typescript
interface OwnedCard {
  scryfallId: string;        // Scryfall UUID – primární klíč
  set: string;               // Kód sady (denormalizovaný pro offline mode)
  collectorNumber: string;   // Číslo karty (denormalizovaný pro offline mode)
  name: string;              // Název karty (denormalizovaný pro sdílení)
  ownedNonFoil: boolean;     // Vlastní non-foil variantu?
  ownedFoil: boolean;        // Vlastní foil variantu?
  quantityNonFoil: number;   // Počet non-foil kopií (min 0)
  quantityFoil: number;      // Počet foil kopií (min 0)
  addedAt: Date;             // Kdy byla karta poprvé přidána
  updatedAt: Date;           // Poslední změna
}
```

**Invarianty:**
- Pokud `ownedNonFoil === false`, pak `quantityNonFoil === 0`
- Pokud `ownedNonFoil === true`, pak `quantityNonFoil >= 1`
- Záznam v Firestore existuje pouze pokud `ownedNonFoil || ownedFoil`
  (Při toggle na `false && false` je dokument smazán)

### CardWithOwnership

Rozšíření `ScryfallCard` o ownership data. Interní typ pro zpracování.

```typescript
interface CardWithOwnership extends ScryfallCard {
  ownedNonFoil: boolean;
  ownedFoil: boolean;
  quantityNonFoil: number;
  quantityFoil: number;
}
```

### CardWithVariant

Typ pro karty zobrazované v gridu. Určuje, jaká varianta je aktivní.

```typescript
interface CardWithVariant {
  card: ScryfallCard;
  variant: CardVariant;       // null = zobrazit obě varianty, 'nonfoil'/'foil' = jen jedna
  sortPrice: number | null;   // Předvypočítaná cena pro řazení
}
```

**Logika `variant`:**
- `null` – karta nemá preferenci, zobrazí se obě ownership tlačítka
- `'nonfoil'` – zobrazí pouze non-foil tlačítko (filtr nebo sada má jen non-foil)
- `'foil'` – zobrazí pouze foil tlačítko

### SetInfo

Metadata o sadě s agregovanými statistikami.

```typescript
interface SetInfo {
  code: SetCode;
  name: string;
  totalCards: number;
  ownedCards: number;
  totalValue: number;
}
```

### CardProduct

Produkt (booster, box, deck) obsahující danou kartu. Data z MTGJSON.

```typescript
interface CardProduct {
  uuid: string;              // MTGJSON UUID produktu
  name: string;              // Název produktu (zkrácený)
  category: string;          // 'booster_pack', 'booster_box', 'bundle', 'deck', ...
  subtype: string | null;    // 'play', 'collector', nebo null
  availableNonFoil: boolean; // Dostupná non-foil verze v tomto produktu
  availableFoil: boolean;    // Dostupná foil verze v tomto produktu
}
```

### Type aliasy

```typescript
// Kód sady (např. '40k', 'ltr', 'spm')
export type SetCode = string;

// Možnosti řazení karet v gridu
export type SortOption = 'number-asc' | 'number-desc' | 'price-asc' | 'price-desc';

// Filtr zobrazení dle vlastnictví
export type OwnershipFilter = 'all' | 'owned' | 'missing';

// Filtr dle typu boosteru
export type BoosterFilter = 'all' | 'play' | 'collector';

// Varianta karty pro zobrazení
// null = nespecifikovaná (zobrazit obě)
// 'nonfoil' nebo 'foil' = jen daná varianta
export type CardVariant = 'nonfoil' | 'foil' | null;
```

---

## user.ts – Uživatelský profil

**Soubor:** [src/types/user.ts](../src/types/user.ts)

### UserProfile

Profil uživatele uložený v Firestore. Vytváří se automaticky při prvním přihlášení.

```typescript
interface UserProfile {
  userId: string;           // Firebase UID
  displayName: string;      // Zobrazované jméno (z Google účtu)
  photoURL: string | null;  // URL profilového obrázku (z Google), nebo null
  createdAt: Date;          // Datum vytvoření profilu
}
```

Profil je zobrazován ve sdílených kolekcích (`SharedCollectionPage`) jako identifikátor vlastníka.
