# Konfigurace – Foilio

Konfigurace aplikace je ve složce [src/config/](../src/config/). Definuje dostupné franšízy, sady, Secret Lair drops a Firebase nastavení.

---

## Obsah

- [collections.ts – Franšízy a sady](#collectionsts--franšízy-a-sady)
- [secretLairDrops.ts – Secret Lair drops](#secretlairdropsts--secret-lair-drops)
- [firebase.ts – Firebase konfigurace](#firebasets--firebase-konfigurace)

---

## collections.ts – Franšízy a sady

**Soubor:** [src/config/collections.ts](../src/config/collections.ts)

Centrální definice všech podporovaných MTG Universe Beyond franšíz a jejich sad. Toto je **jedinou místem**, kde se přidávají nové sady.

### Typy

#### FranchiseId

Union type všech dostupných franšíz.

```typescript
type FranchiseId =
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
```

#### SetType

Typ sady určuje, jak je zpracována v aplikaci.

```typescript
type SetType =
  | 'main'        // Hlavní sada (booster karty)
  | 'commander'   // Commander deck sada
  | 'tokens'      // Token karty (bez MTGJSON dat)
  | 'promos'      // Promo karty (bez MTGJSON dat)
  | 'art-series'  // Art series karty (bez MTGJSON dat)
  | 'minigames'   // Minigame karty (bez MTGJSON dat)
  | 'eternal'     // "Eternal" alternativní sada (reprint/variant)
  | 'other';      // Ostatní (scene boxy, insert karty, apod.)
```

**MTGJSON a SetType:**
Typy `tokens`, `promos`, `art-series`, `minigames`, `other` nemají data v MTGJSON API. Pro tyto sady je booster filtrování vypnuto. Funkce `skipsMtgjson(set)` vrátí `true`.

#### Franchise

Metadata franšízy.

```typescript
interface Franchise {
  id: FranchiseId;
  name: string;        // Zobrazovaný název, např. "Warhammer 40,000"
}
```

#### CollectionSet

Metadata konkrétní sady v rámci franšízy.

```typescript
interface CollectionSet {
  id: string;              // Unikátní ID (= Scryfall set code, malá písmena), např. "40k"
  franchiseId: FranchiseId;// Ke které franšíze patří
  code: string;            // Scryfall set code, velká písmena, např. "40K"
  name: string;            // Zobrazovaný název sady
  order: number;           // Pořadí v rámci franšízy (1 = hlavní/master set)
  type: SetType;           // Typ sady
}
```

**Rozdíl `id` vs `code`:**
- `id`: malá písmena, používá se jako klíč v aplikaci a v URL parametrech
- `code`: velká písmena, odpovídá Scryfall search query (`set:40K`)
- Pro většinu sad `id === code.toLowerCase()`, ale vždy používej `id` pro logiku a `code` pro API

### Exportované konstanty

#### `franchises[]`

Seřazený seznam všech franšíz. Pořadí odpovídá chronologickému vydání.

```typescript
const franchises: Franchise[] = [
  { id: 'warhammer-40k',         name: 'Warhammer 40,000' },         // říjen 2022
  { id: 'transformers',          name: 'Transformers' },              // listopad 2022
  { id: 'lord-of-the-rings',     name: 'The Lord of the Rings' },    // červen 2023
  { id: 'doctor-who',            name: 'Doctor Who' },                // říjen 2023
  { id: 'fallout',               name: 'Fallout' },                   // březen 2024
  { id: 'assassins-creed',       name: "Assassin's Creed" },         // červenec 2024
  { id: 'spider-man',            name: 'Spider-Man' },                // září 2025
  { id: 'marvel-universe',       name: 'Marvel Universe' },           // září 2025
  { id: 'final-fantasy',         name: 'Final Fantasy' },             // červen 2025
  { id: 'avatar-last-airbender', name: 'Avatar: The Last Airbender' },// listopad 2025
  { id: 'tmnt',                  name: 'Teenage Mutant Ninja Turtles' },// březen 2026
  { id: 'marvel-super-heroes',   name: 'Marvel Super Heroes' },       // červen 2026
  { id: 'edge-of-eternities',    name: 'Edge of Eternities' },
];
```

#### `collectionSets[]`

Všechny sady s metadaty. Aktuálně obsahuje ~50+ sad.

```typescript
// Příklad struktury pro franšízu s více sadami
const collectionSets: CollectionSet[] = [
  // Warhammer 40,000
  { id: '40k',  franchiseId: 'warhammer-40k', code: '40K',  name: 'Warhammer 40,000',        order: 1, type: 'main'   },
  { id: 't40k', franchiseId: 'warhammer-40k', code: 'T40K', name: 'Warhammer 40,000 Tokens', order: 2, type: 'tokens' },

  // Lord of the Rings (komplexnější struktura)
  { id: 'ltr',  franchiseId: 'lord-of-the-rings', code: 'LTR',  name: 'Tales of Middle-earth',         order: 1, type: 'main'      },
  { id: 'ltc',  franchiseId: 'lord-of-the-rings', code: 'LTC',  name: 'Tales of Middle-earth Commander',order: 2, type: 'commander' },
  { id: 'pltr', franchiseId: 'lord-of-the-rings', code: 'PLTR', name: 'Tales of Middle-earth Promos',   order: 3, type: 'promos'    },
  { id: 'altr', franchiseId: 'lord-of-the-rings', code: 'ALTR', name: 'Tales of Middle-earth Art Series',order: 4, type: 'art-series'},
  { id: 'mltr', franchiseId: 'lord-of-the-rings', code: 'MLTR', name: 'Tales of Middle-earth Minigames',order: 5, type: 'minigames' },
  // ...
];
```

#### `skipsMtgjson(set)`

Utility funkce – vrátí `true` pokud sada nemá MTGJSON data.

```typescript
export const skipsMtgjson = (set: CollectionSet): boolean =>
  ['tokens', 'promos', 'art-series', 'minigames', 'other'].includes(set.type);
```

---

### Jak přidat novou franšízu

1. **Přidat `FranchiseId`** do union type:
   ```typescript
   | 'nova-franchise'
   ```

2. **Přidat do `franchises[]`:**
   ```typescript
   { id: 'nova-franchise', name: 'Nova Franchise' },
   ```

3. **Přidat sady do `collectionSets[]`:**
   ```typescript
   { id: 'nfm', franchiseId: 'nova-franchise', code: 'NFM', name: 'Nova Franchise Main', order: 1, type: 'main' },
   ```

4. **Ověřit, že sada existuje ve Scryfall** – navštivit `scryfall.com/sets/{code}`.

5. **Ověřit MTGJSON data** – navštivit `mtgjson.com/api/v5/{CODE}.json` (pokud `type !== 'tokens'` atd.).

---

### Jak přidat novou sadu k existující franšíze

Stačí přidat záznamu do `collectionSets[]` se správným `franchiseId` a `order` (vyšší číslo = nižší priorita).

---

## secretLairDrops.ts – Secret Lair drops

**Soubor:** [src/config/secretLairDrops.ts](../src/config/secretLairDrops.ts)

Konfigurace Secret Lair drops – časově omezených speciálních vydání. Uživatel si v nastavení vybere, které drops chce sledovat.

### Struktura

```typescript
interface SecretLairDrop {
  id: string;           // Unikátní ID dropu pro aplikaci
  name: string;         // Zobrazovaný název
  releasedAt: string;   // Datum vydání 'YYYY-MM-DD' – používáno pro Scryfall query
}

const secretLairDrops: SecretLairDrop[] = [
  // Příklad:
  { id: 'sld-2024-01', name: 'Secret Lair Drop January 2024', releasedAt: '2024-01-15' },
  // ...
];
```

Scryfall query pro drop: `set:sld+date={releasedAt}`

---

## firebase.ts – Firebase konfigurace

**Soubor:** [src/config/firebase.ts](../src/config/firebase.ts)

Inicializuje Firebase app, Auth a Firestore. Detekuje, zda jsou env proměnné nastaveny.

### Env proměnné

Firebase vyžaduje tyto proměnné v `.env` souboru:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### Offline mód

Pokud proměnné chybí, `isFirebaseConfigured` je `false`. Aplikace pak funguje v offline módu:
- Autentifikace: lokální uživatel (`uid: 'local-user'`)
- Data: ukládána do `localStorage` místo Firestore
- Sdílení: nedostupné

```typescript
export const isFirebaseConfigured: boolean;
export const auth: Auth | null;
export const db: Firestore | null;
export const googleProvider: GoogleAuthProvider | null;
```
