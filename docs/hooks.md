# Custom Hooky – Foilio

Všechny custom hooky jsou v [src/hooks/](../src/hooks/). Tvoří datovou vrstvu mezi UI komponentami, Firebase a Scryfall API.

---

## Obsah

- [useAuth](#useauth)
- [useOwnedCards](#useownedcards)
- [useCardCollection](#usecardcollection)
- [useCollectionStats](#usecollectionstats)
- [useHomeStats](#usehomestats)
- [useDashboardCardLoader](#usedashboardcardloader)
- [useSharedCollection](#usesharedcollection)
- [useSecretLairCollection](#usesecretlaircollection)
- [useRenderBatch](#userenderbatch)
- [useBoosterMap](#useboostermap)
- [useCardProducts](#usecardproducts)
- [useScryfallCards](#usescryfallcards)

---

## useAuth

**Soubor:** [src/hooks/useAuth.ts](../src/hooks/useAuth.ts)

Spravuje Firebase Google autentifikaci. Automaticky přepíná mezi popup a redirect přihlášením podle zařízení a detekuje offline mód (bez Firebase).

### Signatúra

```typescript
function useAuth(): {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isFirebaseConfigured: boolean;
}
```

### Návratové hodnoty

| Hodnota | Typ | Popis |
|---------|-----|-------|
| `user` | `User \| null` | Firebase uživatel, nebo offline `local-user` objekt, nebo `null` (nepřihlášen) |
| `loading` | `boolean` | `true` dokud Firebase neověří stav přihlášení |
| `error` | `string \| null` | Chybová zpráva při selhání přihlášení |
| `login()` | `() => Promise<void>` | Spustí Google OAuth flow |
| `logout()` | `() => Promise<void>` | Odhlásí uživatele z Firebase |
| `isFirebaseConfigured` | `boolean` | `true` pokud jsou nastaveny Firebase env proměnné |

### Offline mód

Pokud Firebase není nakonfigurováno (chybí env proměnné), hook automaticky nastaví uživatele na lokální objekt:

```typescript
// Offline user (lokální mód bez Firebase)
{ uid: 'local-user', displayName: 'Local user', photoURL: null }
```

Data jsou pak ukládána do `localStorage` místo Firestore.

### Strategie přihlášení

| Zařízení | Metoda | Důvod |
|---------|--------|-------|
| Mobil / tablet (coarse pointer) | `signInWithRedirect` | Popup bývá blokován na mobilech |
| Desktop | `signInWithPopup` | Plynulejší UX |
| ngrok/tunnel URL | `signInWithPopup` | Redirect ztrácí session kontext |
| Popup blokován | `signInWithRedirect` | Automatický fallback |

### Příklady použití

```tsx
function App() {
  const { user, loading, login, logout, isFirebaseConfigured } = useAuth();

  if (loading) return <Spinner />;

  if (!user) return <button onClick={login}>Sign in with Google</button>;

  return (
    <div>
      Přihlášen jako {user.displayName}
      <button onClick={logout}>Odhlásit</button>
    </div>
  );
}
```

---

## useOwnedCards

**Soubor:** [src/hooks/useOwnedCards.ts](../src/hooks/useOwnedCards.ts)

Načítá a spravuje vlastněné karty. Při Firebase módu používá real-time Firestore listener, v offline módu čte/zapisuje do `localStorage`.

### Signatúra

```typescript
function useOwnedCards(userId: string | null): {
  ownedCards: Map<string, OwnedCard>;
  loading: boolean;
  updateLocal: (updater: (prev: Map<string, OwnedCard>) => Map<string, OwnedCard>) => void;
}
```

### Návratové hodnoty

| Hodnota | Popis |
|---------|-------|
| `ownedCards` | `Map<scryfallId, OwnedCard>` – aktuální stav vlastněných karet |
| `loading` | `true` dokud nepřijde první odpověď z Firestore |
| `updateLocal` | Funkce pro lokální optimistickou aktualizaci (offline mód) |

### Chování

```
Firebase konfigurováno?
├── ANO → Firestore real-time listener (onSnapshot)
│         Automaticky updatuje ownedCards při každé změně v DB
└── NE  → localStorage klíč: 'mtg-spider-owned-cards'
          Data jsou serializována jako JSON array párů [id, OwnedCard]
```

### Příklady použití

```tsx
const { ownedCards, loading, updateLocal } = useOwnedCards(user.uid);

// Optimistická lokální aktualizace (offline mód)
updateLocal((prev) => {
  const next = new Map(prev);
  next.set(cardId, updatedCard);
  return next;
});
```

---

## useCardCollection

**Soubor:** [src/hooks/useCardCollection.ts](../src/hooks/useCardCollection.ts)

Nejkomplexnější hook aplikace. Spravuje celý lifecycle kolekce karet: postupné načítání ze Scryfall po stránkách, filtrování, řazení, paginaci (render batching) a vyhledávání.

### Signatúra

```typescript
interface UseCardCollectionOptions {
  ownedCards: Map<string, OwnedCard>;
  searchQuery?: string;
  visibleSetIds?: string[];       // Povolené sady (undefined = vše)
  sets: CollectionSet[];
}

function useCardCollection(options: UseCardCollectionOptions): {
  // Stav aktivní sady
  activeSet: SetCode;
  setActiveSet: (set: SetCode) => void;

  // Filtry a řazení
  sortOption: SortOption;
  setSortOption: (sort: SortOption) => void;
  ownershipFilter: OwnershipFilter;
  setOwnershipFilter: (f: OwnershipFilter) => void;
  boosterFilter: BoosterFilter;
  setBoosterFilter: (f: BoosterFilter) => void;
  groupBySet: boolean;
  setGroupBySet: (v: boolean) => void;

  // Karty pro zobrazení
  visibleCards: CardWithVariant[];
  isCardsLoading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  isLoadingMore: boolean;
  loadMoreError: string | null;

  // Vybraná karta (detail)
  selectedCard: ScryfallCard | null;
  setSelectedCard: (card: ScryfallCard | null) => void;

  // Statistiky
  stats: CollectionStats;
  setTotals: Record<string, number>;

  // Booster data
  boosterMapLoading: boolean;
  hasBoosterData: boolean;

  // Sets metadata
  sets: CollectionSet[];
  setOrder: string[];
}
```

### Načítání karet

Hook načítá karty **postupně po stránkách** pro každou sadu:

```
Pro každou sadu:
1. Pokus o načtení z localStorage cache (L2)
2. Pokud cache miss → fetchCardsPageForSet() ze Scryfall API
3. Každá stránka je uložena do cache
4. Při scrollu na konec gridu → loadMore() načte další stránku

Při searchQuery:
- Načte VŠECHNY karty (všechny stránky) pro aktivní sadu
- Filtruje lokálně (case-insensitive match na name a collector_number)
```

### Filtrování

Filtry jsou aplikovány na straně klienta po načtení karet:

| Filtr | Logika |
|-------|--------|
| `ownershipFilter='owned'` | Karta musí mít `ownedNonFoil === true` nebo `ownedFoil === true` |
| `ownershipFilter='missing'` | Karta nesmí být vlastněna |
| `boosterFilter='play'` | Karta musí být v play boosteru (dle MTGJSON boosterMap) |
| `boosterFilter='collector'` | Karta musí být v collector boosteru |
| `searchQuery` | Substring match na `name` nebo `collector_number` |

### Řazení

| Možnost | Logika |
|---------|--------|
| `number-asc` | Dle `collector_number` vzestupně |
| `number-desc` | Dle `collector_number` sestupně |
| `price-asc` | Dle `sortPrice` vzestupně (null = na konec) |
| `price-desc` | Dle `sortPrice` sestupně (null = na konec) |

`sortPrice` je vypočítán jako cena relevantní varianty: foil → `prices.eur_foil`, non-foil → `prices.eur`.

### Render batching

Hook spolupracuje s `useRenderBatch` pro omezení počtu renderovaných karet:
- Začíná s `getBatchSize()` kartami (závisí na velikosti obrazovky)
- `loadMore()` zvýší `renderLimit` o `renderBatchSize`
- Při změně aktivní sady nebo search query se limit resetuje

---

## useCollectionStats

**Soubor:** [src/hooks/useCollectionStats.ts](../src/hooks/useCollectionStats.ts)

Memoizovaný výpočet statistik pro danou skupinu karet.

### Signatúra

```typescript
function useCollectionStats(
  cards: ScryfallCard[],
  ownedCards: Map<string, OwnedCard>,
  setCode: SetCode   // 'all' nebo konkrétní set kód
): {
  totalCards: number;
  ownedCount: number;
  totalValue: number;    // EUR, součet hodnot vlastněných karet × počty
  percentage: number;   // Math.round((ownedCount / totalCards) * 100)
}
```

### Logika výpočtu hodnoty

```typescript
// Hodnota = nonfoil_cena × nonfoil_qty + foil_cena × foil_qty
if (owned.ownedNonFoil) totalValue += parsePrice(card.prices.eur) * owned.quantityNonFoil;
if (owned.ownedFoil)    totalValue += parsePrice(card.prices.eur_foil) * owned.quantityFoil;
```

---

## useHomeStats

**Soubor:** [src/hooks/useHomeStats.ts](../src/hooks/useHomeStats.ts)

Agreguje statistiky z vlastněných karet pro dashboard widgety. Potřebuje Scryfall data v cache (zajišťuje `useDashboardCardLoader`).

### Signatúra

```typescript
function useHomeStats(
  ownedCards: OwnedCard[],
  settings: CollectionsSettings
): {
  totalUniqueOwned: number;
  totalValueEur: number;
  globalCompletionPct: number;
  rarityBreakdown: Record<string, number>;  // { mythic: 45, rare: 120, ... }
  topFranchises: FranchiseStat[];
  nearCompleteSets: NearCompleteSet[];
  mostValuableCards: ValuableCard[];
}
```

### Typy výsledků

```typescript
interface FranchiseStat {
  franchiseId: string;
  name: string;
  owned: number;
  total: number;
  pct: number;        // 0–100
}

interface NearCompleteSet {
  setId: string;
  name: string;
  remaining: number;  // Počet chybějících karet do 100%
}

interface ValuableCard {
  scryfallId: string;
  name: string;
  priceEur: number;
  isFoil: boolean;
}
```

### Závislost na cache

`rarityBreakdown` a ceny jsou získávány ze Scryfall cache (`getCachedCardById`). Data musí být předem načtena přes `useDashboardCardLoader`. Pokud karta není v cache, je přeskočena.

---

## useDashboardCardLoader

**Soubor:** [src/hooks/useDashboardCardLoader.ts](../src/hooks/useDashboardCardLoader.ts)

Prefetchuje Scryfall data pro všechny vlastněné karty do localStorage cache. Spouští se automaticky při načtení dashboardu.

### Signatúra

```typescript
function useDashboardCardLoader(): {
  isLoading: boolean;
}
```

### Chování

1. Získá seznam všech `scryfallId` z `useOwnedCards`
2. Filtruje ID, která ještě nejsou v cache (`getCachedCardById`)
3. Batch-fetches zbývající karty přes `fetchCardsByIds()` (max 75 ID na request)
4. Ukládá výsledky do Scryfall L2 cache

---

## useSharedCollection

**Soubor:** [src/hooks/useSharedCollection.ts](../src/hooks/useSharedCollection.ts)

Načítá read-only kolekci jiného uživatele na základě sdíleného tokenu.

### Signatúra

```typescript
function useSharedCollection(token: string | undefined): {
  ownedCards: Map<string, OwnedCard>;
  profile: UserProfile | null;        // Profil vlastníka kolekce
  ownerUserId: string | null;
  loading: boolean;
  error: string | null;               // 'Collection not found', 'disabled', 'not available'
  refresh: () => void;                // Manuální re-fetch
}
```

### Chyby

| Chyba | Situace |
|-------|---------|
| `'Collection is not available.'` | Token není definován nebo Firebase není nakonfigurováno |
| `'Shared collection not found.'` | Token neexistuje v Firestore |
| `'Shared collection is disabled.'` | Kolekce je zakázána (`enabled: false`) |
| `'Failed to load collection.'` | Síťová chyba |

---

## useSecretLairCollection

**Soubor:** [src/hooks/useSecretLairCollection.ts](../src/hooks/useSecretLairCollection.ts)

Spravuje kolekci Secret Lair drops. Podobná struktura jako `useCardCollection`, ale optimalizovaná pro SLD (načítá karty přes datum vydání).

### Signatúra

```typescript
function useSecretLairCollection(options: {
  ownedCards: Map<string, OwnedCard>;
  enabledDrops: SecretLairDrop[];
  searchQuery?: string;
}): {
  cards: CardWithVariant[];
  isLoading: boolean;
  activeDropId: string | null;
  setActiveDropId: (id: string | null) => void;
  // ... (podobné jako useCardCollection)
}
```

---

## useRenderBatch

**Soubor:** [src/hooks/useRenderBatch.ts](../src/hooks/useRenderBatch.ts)

Spravuje postupné renderování velkého počtu karet pro plynulé UI. Zabraňuje zamrznutí prohlížeče při zobrazení stovek karet najednou.

### Signatúra

```typescript
function useRenderBatch(resetTrigger?: unknown): {
  renderBatchSize: number;    // Kolik karet přidat při každém "load more"
  renderLimit: number;        // Aktuální maximální počet renderovaných karet
  setRenderLimit: Dispatch<SetStateAction<number>>;
}
```

### Chování

- `getBatchSize()` z `utils/responsive.ts` vrací různé hodnoty dle šířky okna
- `resetTrigger` – při změně (jiná sada, nový search) se `renderLimit` resetuje na `getBatchSize()`
- `ResizeObserver` (přes window resize event) zvyšuje `renderBatchSize` při změně velikosti okna

### Použití v CardGrid

```
useCardCollection → visibleCards (všechny filtrované karty)
useRenderBatch    → renderLimit (kolik se jich fakticky renderuje)

CardGrid renderuje pouze: visibleCards.slice(0, renderLimit)
```

---

## useBoosterMap

**Soubor:** [src/hooks/useBoosterMap.ts](../src/hooks/useBoosterMap.ts)

React Query wrapper pro načtení booster mapy z MTGJSON. Mapa přiřazuje každé kartě, zda je dostupná v Play nebo Collector boosteru.

### Signatúra

```typescript
function useBoosterMap(): {
  data: BoosterMap | undefined;  // Map<'setCode:collectorNumber', BoosterEntry>
  isLoading: boolean;
  error: Error | null;
}

interface BoosterEntry {
  play: Set<'foil' | 'nonfoil'>;
  collector: Set<'foil' | 'nonfoil'>;
}
```

---

## useCardProducts

**Soubor:** [src/hooks/useCardProducts.ts](../src/hooks/useCardProducts.ts)

Načte nákupní produkty pro konkrétní kartu (v jakých baleních je dostupná).

### Signatúra

```typescript
function useCardProducts(setCode: string, collectorNumber: string): {
  products: CardProduct[];
  isLoading: boolean;
}

interface CardProduct {
  uuid: string;
  name: string;
  category: string;          // 'booster_pack', 'booster_box', 'bundle', ...
  subtype: string | null;    // 'play', 'collector', null
  availableNonFoil: boolean;
  availableFoil: boolean;
}
```

Produkty jsou zobrazeny v `CardProductsTooltip` v CardDetail modálu.

---

## useScryfallCards

**Soubor:** [src/hooks/useScryfallCards.ts](../src/hooks/useScryfallCards.ts)

Jednoduchý React Query wrapper pro načtení všech karet sady najednou. Používán tam, kde není potřeba postupné paginované načítání.

### Signatúra

```typescript
function useScryfallCards(setCode: string): {
  cards: ScryfallCard[];
  isLoading: boolean;
  error: Error | null;
}
```
