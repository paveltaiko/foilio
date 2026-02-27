# API Služby – Foilio

Datová vrstva aplikace je rozdělena do specializovaných service modulů v [src/services/](../src/services/). Každý modul zodpovídá za komunikaci s jedním externím systémem.

---

## Obsah

- [scryfall.ts – Scryfall API](#scryfallts--scryfall-api)
- [firestore.ts – Firebase Firestore](#firestorets--firebase-firestore)
- [sharing.ts – Sdílení kolekcí](#sharingts--sdílení-kolekcí)
- [mtgjson.ts – MTGJSON API](#mtgjsónts--mtgjson-api)
- [userProfile.ts – Uživatelský profil](#userprofilets--uživatelský-profil)

---

## scryfall.ts – Scryfall API

**Soubor:** [src/services/scryfall.ts](../src/services/scryfall.ts)

Komunikace se [Scryfall API](https://scryfall.com/docs/api) pro načítání dat o MTG kartách. Implementuje dvouvrstvé cachování a rate limiting.

### Caching strategie

```
Request přijde
     │
     ▼
L1: In-memory Map (cardByIdCache, setCardCountCache)
     │ cache miss
     ▼
L2: localStorage (scryfallCache utility)
     │ cache miss
     ▼
Scryfall API fetch
     │
     ▼
Uložit do L1 + L2 cache
```

| Cache | Typ | Limit | TTL |
|-------|-----|-------|-----|
| `cardByIdCache` | In-memory Map | 500 karet | session |
| `setCardCountCache` | In-memory Map | 200 sad | session |
| L2 localStorage | `scryfallCache` utility | – | 24h karty, 7d sady |

### Rate limiting

Scryfall požaduje 50–100ms mezi requesty. Aplikace používá `RATE_LIMIT_MS = 100ms` delay mezi stránkami a sériemi requestů.

---

### Funkce

#### `fetchCardsForSet(setCode)`

Načte **všechny karty** pro danou sadu (iteruje přes všechny stránky).

```typescript
async function fetchCardsForSet(setCode: SetCode): Promise<ScryfallCard[]>
```

```typescript
// Příklad
const cards = await fetchCardsForSet('40k');
// Vrátí všechny Warhammer 40K karty (120+ karet, 2 stránky API)
```

#### `fetchCardsPageForSet(setCode, pageUrl?)`

Načte **jednu stránku** výsledků. Používáno pro postupné načítání v `useCardCollection`.

```typescript
async function fetchCardsPageForSet(
  setCode: SetCode,
  pageUrl?: string | null
): Promise<ScryfallCardsPage>

interface ScryfallCardsPage {
  cards: ScryfallCard[];
  hasMore: boolean;
  nextPage: string | null;  // URL další stránky, pokud existuje
}
```

#### `fetchSetCardCount(setCode)`

Vrátí celkový počet karet v sadě. Výsledek je agresivně cachován (L1 + L2).

```typescript
async function fetchSetCardCount(setCode: SetCode): Promise<number | null>
```

Deduplikuje in-flight requesty – při souběžných volání pro stejný set vrátí stejnou Promise.

#### `fetchCardsByIds(cardIds[])`

Batch fetch karet podle Scryfall ID. Používá Scryfall `/cards/collection` endpoint (POST).

```typescript
async function fetchCardsByIds(cardIds: string[]): Promise<Record<string, ScryfallCard>>
```

- Chunk size: max **75 ID na request** (limit Scryfall API)
- Automaticky dotahuje z L2 cache před fetch
- Nenalezené karty zaznamenává do `missingCardIds` setu (přeskočí při dalším volání)

#### `fetchCardsByCollectorNumbers(identifiers[])`

Batch fetch karet dle kombinace sada + collector number.

```typescript
async function fetchCardsByCollectorNumbers(
  identifiers: Array<{ set: string; collector_number: string }>
): Promise<ScryfallCard[]>
```

#### `fetchCardsForSLDDrop(releasedAt)`

Načte karty pro Secret Lair drop dle data vydání.

```typescript
async function fetchCardsForSLDDrop(releasedAt: string): Promise<ScryfallCard[]>
// releasedAt: '2024-03-08' (datum vydání dropu)
```

Používá Scryfall search: `set:sld+date={releasedAt}`.

#### `fetchAllSets(setCodes[])`

Sekvenčně načte karty pro více sad (s rate limiting delay mezi nimi).

```typescript
async function fetchAllSets(setCodes: string[]): Promise<Record<string, ScryfallCard[]>>
```

#### `getCardImage(card, size?)`

Extrahuje URL obrázku karty. Zvládá single-faced i double-faced karty.

```typescript
function getCardImage(
  card: ScryfallCard,
  size: 'small' | 'normal' | 'large' | 'png' = 'large'
): string
```

Pro double-faced karty vrátí obrázek **první strany** (`card_faces[0]`).

---

## firestore.ts – Firebase Firestore

**Soubor:** [src/services/firestore.ts](../src/services/firestore.ts)

CRUD operace nad Firestore databází. Všechny funkce předpokládají, že Firebase je nakonfigurováno (`getDb()` hodí chybu jinak).

### Struktura Firestore databáze

```
users/{userId}/
  ownedCards/{scryfallId}      ← vlastněné karty
  settings/collections         ← nastavení povolených sad
  settings/secretLair          ← povolené Secret Lair drops

userShares/{userId}            ← share tokeny uživatelů
  token: string

sharedCollections/{token}/     ← sdílené kolekce (veřejné)
  userId, displayName, photoURL, enabled
  ownedCards/{scryfallId}      ← zrcadlo owned cards
```

### Funkce

#### `subscribeToOwnedCards(userId, callback)`

Real-time listener na vlastněné karty. Volá `callback` při každé změně v Firestore.

```typescript
function subscribeToOwnedCards(
  userId: string,
  callback: (cards: Map<string, OwnedCard>) => void
): Unsubscribe   // Zavolat pro zrušení listeneru
```

```typescript
// Použití
const unsubscribe = subscribeToOwnedCards(userId, (cards) => {
  setOwnedCards(cards);
});
// Při unmount:
unsubscribe();
```

#### `toggleCardOwnership(userId, cardId, cardData, variant, currentOwned, shareToken?)`

Toggle vlastnictví karty (non-foil nebo foil). Pokud karta přestane být vlastněna v jakékoliv variantě, je smazána z Firestore.

```typescript
async function toggleCardOwnership(
  userId: string,
  cardId: string,
  cardData: { set: string; collectorNumber: string; name: string },
  variant: 'nonfoil' | 'foil',
  currentOwned: OwnedCard | undefined,
  shareToken?: string            // Pokud definováno, synchronizuje i do sharedCollection
): Promise<void>
```

Logika:
1. Přepne hodnotu varianty (`true → false` nebo `false → true`)
2. Pokud výsledek je `ownedNonFoil=false && ownedFoil=false` → `deleteDoc`
3. Jinak → `setDoc` s novými hodnotami
4. Pokud `shareToken` → volá `mirrorOwnedCardToShared` nebo `removeMirroredOwnedCard`

#### `updateCardQuantity(userId, cardId, variant, quantity, currentOwned, shareToken?)`

Nastaví přesný počet karet. Nastavení na 0 = odebrání z kolekce.

```typescript
async function updateCardQuantity(
  userId: string,
  cardId: string,
  variant: 'nonfoil' | 'foil',
  quantity: number,
  currentOwned: OwnedCard,
  shareToken?: string
): Promise<void>
```

#### `subscribeToCollectionSettings(userId, callback)`

Real-time listener na nastavení kolekcí (které sady jsou povoleny).

```typescript
function subscribeToCollectionSettings(
  userId: string,
  callback: (raw: Record<string, unknown> | null) => void
): Unsubscribe
```

#### `saveCollectionSettings(userId, settings)`

Uloží nastavení kolekcí do Firestore.

```typescript
async function saveCollectionSettings(
  userId: string,
  settings: Record<string, unknown>
): Promise<void>
```

#### `subscribeToSecretLairSettings(userId, callback)`

Real-time listener na povolené Secret Lair drops.

```typescript
function subscribeToSecretLairSettings(
  userId: string,
  callback: (enabledDropIds: string[] | null) => void
): Unsubscribe
```

#### `saveSecretLairSettings(userId, enabledDropIds)`

Uloží seznam povolených SL drop ID.

```typescript
async function saveSecretLairSettings(
  userId: string,
  enabledDropIds: string[]
): Promise<void>
```

---

## sharing.ts – Sdílení kolekcí

**Soubor:** [src/services/sharing.ts](../src/services/sharing.ts)

Správa sdílených kolekcí pomocí unikátních URL tokenů. Sdílená kolekce je veřejně přístupná bez autentifikace.

### Tok sdílení

```
Uživatel klikne "Share"
         │
         ▼
getOrCreateShareToken(user)
         │
    Existuje token?
    ├── ANO → Vrátí existující token, aktualizuje metadata
    └── NE  → Vytvoří nový token (randomToken)
              Uloží do userShares/{userId}
              Vytvoří sharedCollections/{token}
              syncAllOwnedCardsToShared() ← první full sync
         │
         ▼
URL: /share/{token}
```

### Inkrementální synchronizace

Po každé změně ownership se automaticky synchronizuje do shared collection:

```
toggleCardOwnership() nebo updateCardQuantity()
         │
         ▼ (pokud shareToken je definován)
mirrorOwnedCardToShared(token, cardId, data)
         nebo
removeMirroredOwnedCard(token, cardId)
```

### Funkce

#### `getOrCreateShareToken(user)`

Vrátí existující token nebo vytvoří nový. Při vytvoření provede full sync owned cards.

```typescript
async function getOrCreateShareToken(user: {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
}): Promise<string>
```

#### `getExistingShareToken(userId)`

Načte existující token bez vytváření nového.

```typescript
async function getExistingShareToken(userId: string): Promise<string | null>
```

#### `syncAllOwnedCardsToShared(userId, token)`

Full synchronizace – přepíše celou shared collection aktuálními daty. Používá Firestore `writeBatch` pro atomickou operaci.

```typescript
async function syncAllOwnedCardsToShared(userId: string, token: string): Promise<void>
```

#### `mirrorOwnedCardToShared(token, cardId, data)`

Inkrementální update jedné karty v shared collection.

```typescript
async function mirrorOwnedCardToShared(token: string, cardId: string, data: {
  set: string;
  collectorNumber: string;
  name: string;
  ownedNonFoil: boolean;
  ownedFoil: boolean;
  quantityNonFoil: number;
  quantityFoil: number;
  addedAt?: unknown;
}): Promise<void>
```

#### `removeMirroredOwnedCard(token, cardId)`

Odebere kartu ze shared collection (atomicky s aktualizací `updatedAt`).

```typescript
async function removeMirroredOwnedCard(token: string, cardId: string): Promise<void>
```

---

## mtgjson.ts – MTGJSON API

**Soubor:** [src/services/mtgjson.ts](../src/services/mtgjson.ts)

Načítá data o produktech a boosterech z [MTGJSON API](https://mtgjson.com/api/v5/). Tato data nejsou v Scryfall API dostupná.

### Kdy se MTGJSON nepoužívá

Sady typu `tokens`, `promos`, `art-series`, `minigames`, `other` nemají MTGJSON data. Funkce `skipsMtgjson(set)` vrátí `true` pro tyto typy a jejich zpracování se přeskočí.

### In-memory cache

```typescript
const setCache = new Map<string, MtgjsonSetData>();
```

Každá sada se fetchuje pouze jednou za session (React Query pak přidává vlastní cache).

### Master set koncept

MTGJSON ukládá informace o sealed produktech (boostery) do **master setu** franšízy – prvního setu (nejnižší `order`) v rámci franšízy. Například u LOTR je to `ltr` (Tales of Middle-earth).

```
Warhammer 40K:
  Master set: '40k' (order: 1) → obsahuje sealedProduct data
  Tokens set: 't40k' (order: 2) → odkazuje na produkty z master setu
```

### Funkce

#### `fetchBoosterMap(sets[])`

Vytvoří mapu karta → booster typy pro všechny sady. Paralelní fetch všech MTGJSON dat, fallback na master set při chybě.

```typescript
async function fetchBoosterMap(sets: CollectionSet[]): Promise<BoosterMap>

type BoosterMap = Map<string, BoosterEntry>
// Klíč: '{setCode}:{collectorNumber}', např. '40k:042'

interface BoosterEntry {
  play: Set<'foil' | 'nonfoil'>;       // Dostupné ve Play boosteru
  collector: Set<'foil' | 'nonfoil'>; // Dostupné v Collector boosteru
}
```

#### `fetchCardProducts(setCode, collectorNumber, sets[])`

Načte produkty (boostery, boxy, decky) pro konkrétní kartu.

```typescript
async function fetchCardProducts(
  setCode: string,
  collectorNumber: string,
  sets: CollectionSet[]
): Promise<CardProduct[]>
```

Filtruje relevantní kategorie: `booster_pack`, `booster_box`, `bundle`, `box_set`, `deck`, `limited_aid_tool`.

---

## userProfile.ts – Uživatelský profil

**Soubor:** [src/services/userProfile.ts](../src/services/userProfile.ts)

Správa uživatelských profilů v Firestore. Profil se vytvoří automaticky při prvním přihlášení.

### Funkce

#### `createUserProfileIfNeeded(user)`

Vytvoří profil pokud neexistuje. Při každém přihlášení aktualizuje `displayName` a `photoURL`.

```typescript
async function createUserProfileIfNeeded(user: User): Promise<void>
```

Volá se z `useAuth` hook při detekci přihlášeného uživatele.

#### `getUserProfile(userId)`

Načte profil uživatele z Firestore.

```typescript
async function getUserProfile(userId: string): Promise<UserProfile | null>
```
