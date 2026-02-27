# Stránky – Foilio

Stránky jsou v [src/pages/](../src/pages/). Routing je zajišťován React Routerem v7. Globální layout (Header, BottomNav, Footer) je v [src/App.tsx](../src/App.tsx), stránky jsou renderovány uvnitř `<main>`.

---

## Obsah

- [Routing – přehled](#routing--přehled)
- [App.tsx – kořen aplikace](#apptsx--kořen-aplikace)
- [AuthGuard – ochrana stránek](#authguard--ochrana-stránek)
- [PreviewLoginLandingPage](#previewloginlandingpage)
- [DashboardPage](#dashboardpage)
- [CollectionPage](#collectionpage)
- [CollectionsSettingsPage](#collectionssettingspage)
- [SharedCollectionPage](#sharedcollectionpage)
- [LoginPage](#loginpage)
- [Providers – globální kontext](#providers--globální-kontext)

---

## Routing – přehled

```
/                    → redirect na /dashboard
/dashboard           → DashboardPage          (chráněno AuthGuardem)
/collection          → CollectionPage         (chráněno AuthGuardem)
/settings            → CollectionsSettingsPage
/share/:token        → SharedCollectionPage   (veřejné, bez auth)
/lab/collections-v2  → CollectionsV2LabPage   (vývojové, nezveřejněné)
```

Nepřihlášený uživatel na `/dashboard` nebo `/collection` vidí místo obsahu `PreviewLoginLandingPage`.

---

## App.tsx – kořen aplikace

**Soubor:** [src/App.tsx](../src/App.tsx)

Kořenová komponenta. Inicializuje React Query a renderuje celý layout.

### Struktura

```
App
└── QueryClientProvider (TanStack React Query)
    └── AppContent
        ├── SecretLairDropSettingsProvider   ← globální SLD nastavení
        │   └── CollectionsSettingsProvider  ← globální nastavení sad
        │       ├── Header
        │       ├── <main>
        │       │   └── Routes (React Router)
        │       ├── BottomNav
        │       └── Footer (pouze non-standalone PWA)
```

### Globální stav v App.tsx

| State | Typ | Účel |
|-------|-----|------|
| `isSearchOpen` | `boolean` | Zobrazení SearchInput overlaye |

### PWA standalone detekce

```typescript
const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
```

- Pokud `isStandalone === true` → skryje `Footer` a skryje SearchInput tlačítko v Headeru (v standalone módu je search vždy v BottomNav)

### Navigation v Headeru

Chování tlačítek v Headeru závisí na aktuální route (`useLocation()`):
- `/settings` → zobrazí back tlačítko (zpět v historii nebo na `/collection`)
- Ostatní stránky → zobrazí search tlačítko (pokud není standalone)

---

## AuthGuard – ochrana stránek

**Soubor:** [src/components/auth/AuthGuard.tsx](../src/components/auth/AuthGuard.tsx)

Wrapper komponenta, která chrání stránky vyžadující autentifikaci.

### Props

```typescript
interface AuthGuardProps {
  user: User | null;
  loading: boolean;
  onLogin: () => void;
  children: ReactNode;
}
```

### Logika

```
loading === true
  → Spinner (centered, min-h 60vh)

user === null
  → PreviewLoginLandingPage (marketing landing page s přihlašovacím tlačítkem)

user !== null
  → Renderuje children (chráněná stránka)
```

### Použití v App.tsx

```tsx
<AuthGuard user={user} loading={loading} onLogin={login}>
  {user && <CollectionPage user={user} ... />}
</AuthGuard>
```

`{user && ...}` je nutné – TypeScript nevidí, že `children` bude renderováno pouze pokud `user !== null`.

---

## PreviewLoginLandingPage

**Soubor:** [src/pages/PreviewLoginLandingPage.tsx](../src/pages/PreviewLoginLandingPage.tsx)

Marketing landing page zobrazená nepřihlášeným uživatelům místo chráněných stránek.

### Props

```typescript
interface PreviewLoginLandingPageProps {
  onLogin: () => void;     // Spustí Google OAuth flow
  isLoggedIn: boolean;     // Po přihlášení redirect na /
}
```

### Sekce stránky

```
1. Hero Banner
   ├── Pozadí: spider-man artwork + gradientní overlay (#06133a tmavě modrá)
   ├── Headline, popis aplikace
   ├── Tlačítko "Sign in with Google"
   └── Link "Explore preview cards" (anchor na sekci karet níže)

2. Supported Collections
   └── Pill badges pro každou franšízu z franchises[]

3. Feature Cards (2×2 grid)
   ├── Owned vs Missing – tracking nonfoil/foil
   ├── Collection Value – live ceny ze Scryfall
   ├── Share by Link – read-only sdílení
   └── Private by Default – soukromé bez sdílení

4. Most Popular Cards (id="preview-cards")
   ├── 8 Spider-Man karet (PREVIEW_CARD_SELECTION – hardcoded)
   ├── React Query s staleTime: 24h (data se cachovají)
   ├── CardGrid v read-only módu
   └── createPreviewOwnedCards() – vygeneruje fake owned data pro preview

5. How It Works (3 kroky)

6. FAQ
   └── FaqAccordion komponenta
```

### Preview data

Karta data jsou načítána přes `fetchCardsByCollectorNumbers()` a zobrazena s fake owned stavem (generovaný deterministicky dle indexu karty – bez náhody, vždy stejný výsledek).

### Redirect po přihlášení

```typescript
useEffect(() => {
  if (isLoggedIn) navigate('/', { replace: true });
}, [isLoggedIn, navigate]);
```

---

## DashboardPage

**Soubor:** [src/pages/DashboardPage.tsx](../src/pages/DashboardPage.tsx)

**Route:** `/dashboard`

Domovská stránka po přihlášení. Zobrazuje agregované statistiky kolekce pomocí widgetů.

### Data flow

```
useAuth()
  └── user.uid
      ├── useOwnedCards(user.uid)
      │     └── ownedCards: Map<string, OwnedCard>
      │
      ├── useCollectionsSettings()
      │     └── settings: CollectionsSettings
      │
      ├── useDashboardCardLoader(ownedCards, settings)
      │     └── cacheVersion: number  (inkrementuje se po prefetch)
      │
      └── useHomeStats(ownedCards, settings, cacheVersion)
            └── stats: DashboardStats
```

### Props `useHomeStats` výstupu

```typescript
{
  totalUniqueOwned: number;        // Celkový počet unikátních vlastněných karet
  totalValueEur: number;           // Celková hodnota kolekce v EUR
  globalCompletionPct: number;     // % dokončení přes všechny povolené sady
  nonFoilCount: number;            // Počet non-foil karet
  foilCount: number;               // Počet foil karet
  nonFoilValue: number;            // Hodnota non-foil karet v EUR
  foilValue: number;               // Hodnota foil karet v EUR
  rarityBreakdown: Record<string, number>;  // { mythic: 45, rare: 120, ... }
  topFranchises: FranchiseStat[];  // Pokrok per franšíza
  nearCompleteSets: NearCompleteSet[];      // Sady blízko 100%
  mostValuableCards: ValuableCard[];        // Top karty dle ceny
  recentCards: OwnedCard[];                 // Naposledy přidané
}
```

### Widget layout

```
app-container-padded flex flex-col gap-3 sm:gap-4

├── HeroWidget                    (celá šířka)
├── CardSpotlightWidget           (celá šířka)
│
├── grid grid-cols-2 gap-3
│   ├── FoilBreakdownWidget
│   └── RarityBreakdownWidget
│
└── grid grid-cols-1 sm:grid-cols-2 gap-3
    ├── TopFranchisesWidget
    └── NearCompleteWidget
```

### CardDetail modal

Dashboard umožňuje otevřít `CardDetail` pro kartu kliknutou v `CardSpotlightWidget`. Modal je vždy v **read-only** módu (`readOnly` prop) – ownership toggley jsou vypnuté.

```typescript
const [selectedCard, setSelectedCard] = useState<ScryfallCard | null>(null);
const [selectedVariant, setSelectedVariant] = useState<CardVariant>(null);
```

---

## CollectionPage

**Soubor:** [src/pages/CollectionPage.tsx](../src/pages/CollectionPage.tsx)

**Route:** `/collection`

Hlavní stránka pro správu kolekce karet. Nejkomplexnější stránka aplikace.

### Props

```typescript
interface CollectionPageProps {
  user: User;            // Firebase uživatel (zaručeně přihlášen)
  isSearchOpen: boolean; // Řídí SearchInput overlay (stav z App.tsx)
  onSearchClose: () => void;
}
```

### Lokální state

| State | Typ | Výchozí | Účel |
|-------|-----|---------|------|
| `searchQuery` | `string` | `''` | Text hledaného výrazu |
| `shareToken` | `string \| null` | `null` | Share token pro sync při ownership změnách |
| `shareToastMessage` | `string \| null` | `null` | Toast zpráva po sdílení (auto-mizí po 2,2s) |
| `shareToastType` | `ShareToastType` | `'success'` | Typ toastu (`'success'` / `'error'`) |
| `selectedVariant` | `CardVariant` | `null` | Aktuální varianta v CardDetail modalu |
| `isFilterDrawerOpen` | `boolean` | `false` | Stav mobilního filter draweru |
| `activeTab` | `string` | `'all'` | Aktivní tab – UB set ID nebo SLD drop ID nebo `'all'` |

### Aktivní mód (UB vs SL)

Tab `activeTab` je **unified** – obsahuje jak UB sady, tak SL drops v jedné liště.

```typescript
// SL mode: activeTab není 'all' A patří do enabled SLD
const isSLMode = activeTab !== 'all' && enabledDropIdSet.has(activeTab);
```

Tab `'all'` = Full Collection (UB + SL dohromady).

### Data flow

```
useOwnedCards(user.uid)
  └── ownedCards, updateLocal

useCollectionsSettings()
  └── settings, isLoading

useSecretLairDropSettings()
  └── enabledDropIds

useCardCollection({ ownedCards, searchQuery, visibleSetIds, sets })
  └── UB karty, filtry, řazení, paginace

useSecretLairCollection({ ownedCards, searchQuery, drops })
  └── SL karty, filtry, řazení
```

### Sloučená data pro Full Collection tab

Při `activeTab === 'all'`:

```typescript
currentCards    = [...ubCurrentCards, ...slSortedFilteredCards.map(c => c.card)]
sortedCards     = [...ubSortedFilteredCards, ...slSortedFilteredCards]
visibleCards    = [...ubVisibleCards, ...slVisibleCards]
mergedCounts['all'] = ubCardCounts['all'] + slCardCounts['all']
```

### Tab konfigurace

```typescript
allTabs = [
  { id: 'all', label: 'Full Collection', count: mergedCardCounts['all'] },
  ...visibleSetIds.map(id => ({ id, label: set.name, count: ... })),
  ...enabledDrops.map(drop => ({ id: drop.id, label: drop.name, count: ... })),
]
```

### Ownership handlers

Stránka obsahuje dva handlery pro mutaci vlastnictví karet:

#### `handleToggle(cardId, variant)`

Toggle vlastnictví karty (nonfoil/foil). Větví se dle módu:
- **Firebase:** volá `toggleCardOwnership()` ze services/firestore (+ sync do shared collection pokud `shareToken`)
- **Offline (localStorage):** volá `updateLocal()` s optimistickým updatem

#### `handleQuantityChange(cardId, variant, quantity)`

Nastavení přesného počtu karet:
- **Firebase:** volá `updateCardQuantity()` ze services/firestore
- **Offline:** volá `updateLocal()` s přepočtem `ownedNonFoil/ownedFoil`
- Nastavení `quantity=0` smaže kartu z kolekce

### Fade-in animace při přechodu loadingu

```typescript
// gridKey se inkrementuje při přechodu loading: true → false
const [gridKey, setGridKey] = useState(0);
useEffect(() => {
  if (prevLoadingRef.current && !isCardsLoading) {
    setGridKey(k => k + 1);
  }
}, [isCardsLoading]);
// <div key={gridKey} className="animate-fade-in ...">
```

### Empty state – žádná kolekce

Pokud jsou nastavení načtena, ale žádná sada není povolena (`visibleSetIds.length === 0`), zobrazí se:
```
[Settings ikona]
"No collection selected"
"Enable a collection in Settings to start tracking your cards."
[Tlačítko → /settings]
```

### Render struktura

```
PullToRefresh (disabled při otevřeném search/modalu/draweru)
  └── div.app-container-padded
      ├── Tabs (allTabs, activeTab → setActiveTab)
      ├── CollectionToolbar
      │   ├── sort, ownership filter, booster filter
      │   ├── groupBySet toggle
      │   ├── filter count badge
      │   └── ShareCollectionButton
      └── (loading? CardGridSkeleton : noCollection? EmptyState : CardGrid)

FilterDrawer (mobilní, controlled)
CardDetail (modal)
SearchInput (overlay, controlled z App.tsx)
ShareFeedbackToast
```

---

## CollectionsSettingsPage

**Soubor:** [src/pages/CollectionsSettingsPage.tsx](../src/pages/CollectionsSettingsPage.tsx)

**Route:** `/settings`

Správa nastavení kolekcí – které franšízy a sady jsou viditelné. Stránka nevyžaduje auth (je přístupná bez AuthGuardu).

### Lokální state

| State | Typ | Výchozí | Účel |
|-------|-----|---------|------|
| `activeMode` | `CollectionMode` | `'ub'` | Aktivní panel ('ub' / 'secret-lair' / 'custom') |

### Panely

Záložky (CollectionModeTabs) přepínají mezi třemi panely:

```
'ub'           → CollectionsSettingsPanel
                 ├── Seznam franšíz s toggle (celá franšíza on/off)
                 └── Per-franšíza: seznam sad s individuálním toggle

'secret-lair'  → SecretLairSettingsPanel
                 └── Seznam SLD drops s toggle

'custom'       → placeholder "Custom sets — coming soon"
```

### Hooks

```typescript
const { settings, setCollectionEnabled, setSetVisibility } = useCollectionsSettings();
const { enabledDropIds, toggleDrop } = useSecretLairDropSettings();
```

Změny se automaticky ukládají do Firestore (nebo localStorage v offline módu) přes `CollectionsSettingsContext`.

### Back navigace

```typescript
// Desktop: zobrazí ArrowLeft tlačítko
// Logika: pokud existuje history → navigate(-1), jinak → /collection
if (window.history.length > 1) navigate(-1);
else navigate('/collection');
```

Na mobilu je back navigace v Headeru (App.tsx detekuje route `/settings` a zobrazí back tlačítko).

---

## SharedCollectionPage

**Soubor:** [src/pages/SharedCollectionPage.tsx](../src/pages/SharedCollectionPage.tsx)

**Route:** `/share/:token`

Veřejně přístupná read-only kolekce jiného uživatele. **Nevyžaduje přihlášení.**

### Props

```typescript
interface SharedCollectionPageProps {
  currentUserId: string | null;  // UID přihlášeného uživatele (nebo null)
  isSearchOpen: boolean;
  onSearchClose: () => void;
}
```

### Data flow

```
useParams<{ token: string }>()
  └── token (z URL /share/:token)
      └── useSharedCollection(token)
            ├── ownedCards: Map<string, OwnedCard>   (read-only)
            ├── ownerUserId: string | null
            ├── profile: UserProfile | null           (jméno, avatar)
            ├── loading, error, refresh()
```

```
useCardCollection({ ownedCards, searchQuery, sets: collectionSets })
  └── Standardní filtrování, řazení, paginace nad shared daty
```

### Redirect vlastníka

Pokud přihlášený uživatel navštíví vlastní sdílenou kolekci, je přesměrován na `/`:

```typescript
useEffect(() => {
  if (ownerUserId && currentUserId && ownerUserId === currentUserId) {
    navigate('/', { replace: true });
  }
}, [ownerUserId, currentUserId]);
```

### Error stavy

| Error | Zobrazení |
|-------|-----------|
| `'Collection is not available.'` | Textová zpráva + link "Back to home" |
| `'Shared collection not found.'` | Stejné |
| `'Shared collection is disabled.'` | Stejné |
| `'Failed to load collection.'` | Stejné |

### Owner banner

Horní lišta se jménem a avatarem vlastníka:

```
← [avatar] Pavel Taiko
            Shared collection
```

### Read-only mód

- `CardGrid` má `readOnly` prop – ownership tlačítka jsou zakázána
- `CardDetail` má `readOnly` prop – nelze editovat ownership ani quantity
- `onToggle` a `onQuantityChange` jsou `noop` funkce

### Dostupné funkce

Přes toolbar jsou dostupné:
- `OwnershipFilter` – filtrovat owned/missing/all
- `SortControl` – řadit karty
- `GroupBySet` toggle (při `activeSet === 'all'`)
- `CollectionSummary` – celkové statistiky (totalCards, ownedCount, value, %)

---

## LoginPage

**Soubor:** [src/pages/LoginPage.tsx](../src/pages/LoginPage.tsx)

Jednoduchá stránka s Google přihlašovacím tlačítkem. V aktuálním routingu není přímo použita – přihlašování je řešeno přes `PreviewLoginLandingPage` v `AuthGuard`. `LoginPage` existuje jako standalone varianta pro případné budoucí použití.

### Props

```typescript
interface LoginPageProps {
  onLogin: () => void;
  error: string | null;
}
```

Zobrazí: nadpis, popis, `LoginButton`, chybovou zprávu (pokud `error !== null`).

---

## Providers – globální kontext

### CollectionsSettingsProvider

**Soubor:** [src/pages/CollectionsSettingsContext.tsx](../src/pages/CollectionsSettingsContext.tsx)

Globální provider pro nastavení povolených UB kolekcí. Obaluje celou aplikaci v `App.tsx`.

```typescript
interface CollectionsSettingsContextValue {
  settings: CollectionSettings;
  isLoading: boolean;
  setCollectionEnabled: (franchiseId: string, enabled: boolean) => void;
  setSetVisibility: (setId: string, visible: boolean) => void;
}
```

**Inicializace:**
- Firebase mód: `settings` začíná jako default (vše `enabled: false`), `isLoading: true` → po první Firestore odpovědi `isLoading: false`
- Offline mód: `settings` se načte z localStorage klíče `foilio-collections-settings-v1`

**localStorage migrace:** Pokud Firestore neobsahuje data, ale localStorage ano, data se automaticky migrují do Firestore.

**`normalizeCollectionSettings`:** Funkce ze `collectionsSettings.ts`, která sloučí uložená data s aktuální definicí sad (přidá nové sady s výchozím stavem, odstraní sady které již neexistují).

### SecretLairDropSettingsProvider

**Soubor:** [src/hooks/SecretLairDropSettingsContext.tsx](../src/hooks/SecretLairDropSettingsContext.tsx)

Provider pro seznam povolených Secret Lair drops. Funguje analogicky k `CollectionsSettingsProvider`.

```typescript
interface SecretLairDropSettingsContextValue {
  enabledDropIds: Set<string>;
  toggleDrop: (dropId: string) => void;
}
```

Data jsou ukládána do Firestore (`settings/secretLair`) nebo localStorage.

---

## Kontext CollectionMode – unified tab systém

Stránka `CollectionPage` používá unified tab systém, kde UB sady a SL drops sdílejí jednu tab lištu. Přechod mezi nimi je řízen hodnotou `activeTab`:

```
activeTab = 'all'           → Full Collection (UB + SL merged)
activeTab = 'ltr'           → UB set (Lord of the Rings)
activeTab = 'sld-2024-03-08' → SL drop (konkrétní Secret Lair)
```

Mód je pak odvozen:
```typescript
const isSLMode = activeTab !== 'all' && enabledDropIdSet.has(activeTab);
```
