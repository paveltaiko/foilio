# Dashboard widgety – Foilio

Dashboard je domovská stránka aplikace (`/dashboard`) zobrazující agregované statistiky kolekce. Widgety jsou v [src/components/dashboard/](../../src/components/dashboard/), data jsou připravována hooky `useHomeStats` a `useDashboardCardLoader`.

---

## Obsah

- [Přehled layoutu](#přehled-layoutu)
- [WidgetCard](#widgetcard)
- [HeroWidget](#herowidget)
- [CardSpotlightWidget](#cardspotlightwidget)
- [FoilBreakdownWidget](#foilbreakdownwidget)
- [RarityBreakdownWidget](#raritybreakdownwidget)
- [TopFranchisesWidget](#topfranchiseswidget)
- [NearCompleteWidget](#nearompletewidget)
- [Data hooks](#data-hooks)

---

## Přehled layoutu

```
DashboardPage
├── HeroWidget                      ← celá šířka
├── CardSpotlightWidget             ← celá šířka
├── [grid 2 sloupce]
│   ├── FoilBreakdownWidget
│   └── RarityBreakdownWidget
└── [grid 1→2 sloupce]
    ├── TopFranchisesWidget
    └── NearCompleteWidget
```

Kontejner: `app-container-padded flex flex-col gap-3 sm:gap-4 pb-3 sm:py-5`

---

## WidgetCard

**Soubor:** [src/components/dashboard/WidgetCard.tsx](../../src/components/dashboard/WidgetCard.tsx)

Základní wrapper pro všechny widgety kromě `CardSpotlightWidget` (který má vlastní styl).

### Props

```typescript
interface WidgetCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}
```

### Vizuální vlastnosti

- **Pozadí:** `bg-surface-primary`
- **Ohraničení:** `border border-surface-border`
- **Border radius:** `rounded-2xl` (16px)
- **Padding:** `p-3 sm:p-4`
- **Title:** `text-xs font-semibold uppercase tracking-wider text-neutral-600`

### Příklady použití

```tsx
<WidgetCard title="My Collection">
  <div>obsah widgetu</div>
</WidgetCard>

<WidgetCard title="Finish" className="col-span-1">
  ...
</WidgetCard>
```

---

## HeroWidget

**Soubor:** [src/components/dashboard/HeroWidget.tsx](../../src/components/dashboard/HeroWidget.tsx)

Hlavní hero sekce zobrazující celkovou hodnotu kolekce, počet karet a procento dokončení.

### Props

```typescript
interface HeroWidgetProps {
  totalUniqueOwned: number;
  totalValueEur: number;
  globalCompletionPct: number;
}
```

### Vizuální struktura

```
┌───────────────────────────────────────────────┐
│  My Collection                                │
│                                               │
│              € 1 234.50                       │  ← Celková hodnota (velká, mono)
│              Total Value                      │
│                                               │
│  ┌─────────────────┐   ┌─────────────────┐   │
│  │       450        │   │      63%         │  │
│  │      Cards       │   │    Complete      │  │
│  └─────────────────┘   └─────────────────┘   │
│  ████████████████████░░░░░░░░░░░  63%         │  ← ProgressBar
└───────────────────────────────────────────────┘
```

### Datové zobrazení

| Hodnota | Font | Velikost | Poznámka |
|---------|------|---------|---------|
| Celková hodnota | `font-mono` | `text-3xl sm:text-4xl font-bold` | Skryje se při `€ 0` (zobrazí `—`) |
| Label "Total Value" | sans | `text-xs sm:text-sm uppercase tracking-wider` | `text-neutral-400` |
| Počet karet | `font-mono` | `text-lg sm:text-xl font-bold` | `toLocaleString()` formátování |
| Procento | `font-mono` | `text-lg sm:text-xl font-bold` | Zaokrouhleno na celé % |

Statistické boxy: `bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5`

---

## CardSpotlightWidget

**Soubor:** [src/components/dashboard/CardSpotlightWidget.tsx](../../src/components/dashboard/CardSpotlightWidget.tsx)

Dvojí pohled na nejcennější karty a naposledy přidané karty s náhledem obrázku.

### Props

```typescript
interface CardSpotlightWidgetProps {
  mostValuableCards: ValuableCard[];
  recentCards: OwnedCard[];
  onCardClick: (card: ScryfallCard, variant: 'nonfoil' | 'foil') => void;
}

interface ValuableCard {
  scryfallId: string;
  name: string;
  priceEur: number;
  isFoil: boolean;
}
```

### Vizuální struktura

```
┌────────────────────────────────────────────────┐
│  Cards                                         │
│                                                │
│  [Most Valuable]  [Recently Added]             │  ← Tab switcher
│  ─────────────────────────────────────────     │
│                                                │
│  ┌──────────┐   Dragon Shield        €45.00   │
│  │          │   Sorin, Imperious...  €28.50   │  ← zvýrazněný řádek
│  │ [náhled] │ ► Elesh Norn           €21.00   │
│  │          │   Nicol Bolas          €18.00   │
│  └──────────┘   Atraxa               €15.00   │
└────────────────────────────────────────────────┘
```

### Záložky

| Tab | Obsah | Vedlejší info |
|-----|-------|--------------|
| `Most Valuable` | Top karty dle ceny | Cena v EUR (violet pro foil) |
| `Recently Added` | Naposledy přidané | Relativní čas (`now`, `5m`, `2h`, `3d`) |

### Interakce

- **Hover na řádek:** nahradí náhled obrázku danou kartou
- **Klik na řádek:** otevře `CardDetail` pro danou kartu
- **Foil indikátor:** fialový tečkový indikátor `w-2 h-2 bg-violet-500 rounded-full`
- **Foil karta v náhledu:** tenký fialový rámeček `ring-1 ring-violet-400`

### Widget specifický styl

Tento widget **nepoužívá** `WidgetCard`, má vlastní styl:
- `bg-surface-primary border border-surface-border rounded-2xl overflow-hidden`
- Padding: `px-3 pb-8 sm:px-4 sm:pb-4`
- Záložky: stejný styl jako `CollectionModeTabs`

---

## FoilBreakdownWidget

**Soubor:** [src/components/dashboard/FoilBreakdownWidget.tsx](../../src/components/dashboard/FoilBreakdownWidget.tsx)

Rozpad kolekce na non-foil a foil varianty s progress bary.

### Props

```typescript
interface FoilBreakdownWidgetProps {
  nonFoilCount: number;
  foilCount: number;
  nonFoilValue: number;
  foilValue: number;
}
```

### Vizuální struktura

```
┌─────────────────────────────┐
│  Finish                     │
│                             │
│  NF         340  / €890.00  │
│  ████████████████░░░         │
│                             │
│  F           110  / €456.00 │
│  ████████░░░░░░░░░░          │
└─────────────────────────────┘
```

| Řádek | Barva baru | Označení |
|-------|-----------|---------|
| Non-Foil | `bg-neutral-400` | `NF` |
| Foil | `bg-violet-500` | `F` |

Procento se počítá z celkového množství. Hodnota je skryta pokud je 0.

---

## RarityBreakdownWidget

**Soubor:** [src/components/dashboard/RarityBreakdownWidget.tsx](../../src/components/dashboard/RarityBreakdownWidget.tsx)

Vizualizace rozložení karet podle rarity.

### Props

```typescript
interface RarityBreakdownWidgetProps {
  rarityBreakdown: Record<string, number>;  // { mythic: 45, rare: 120, ... }
}
```

### Vizuální struktura

```
┌─────────────────────────────┐
│  Rarity                     │
│                             │
│  M  ████████░░░░░░░░  45   │  ← Mythic (červená)
│  R  ██████████████░░  120  │  ← Rare (oranžová)
│  U  █████░░░░░░░░░░░   80  │  ← Uncommon (šedá)
│  C  ████░░░░░░░░░░░░   60  │  ← Common (neutrální)
│  S  █░░░░░░░░░░░░░░░    5  │  ← Special (purpurová)
└─────────────────────────────┘
```

Pořadí rarit (od vzácných po časté): `mythic → rare → uncommon → common → special → bonus`

Barvy progress barů odpovídají barvám z `getRarityInfo().badgeClass`:
- Mythic: `bg-red-500`
- Rare: `bg-amber-500`
- Uncommon: `bg-slate-500`
- Common: `bg-neutral-400`
- Special/Bonus: `bg-purple-500`

Empty state: "Browse your collection first" (při 0 kartách)

---

## TopFranchisesWidget

**Soubor:** [src/components/dashboard/TopFranchisesWidget.tsx](../../src/components/dashboard/TopFranchisesWidget.tsx)

Přehled pokroku pro každou povolenou franšízu.

### Props

```typescript
interface TopFranchisesWidgetProps {
  topFranchises: FranchiseStat[];
}

interface FranchiseStat {
  franchiseId: string;
  name: string;
  owned: number;
  total: number;
  pct: number;      // 0–100
}
```

### Vizuální struktura

```
┌─────────────────────────────────────────┐
│  Collection Progress                    │
│                                         │
│  Warhammer 40K              42 / 120   │
│  ██████░░░░░░░░░░░░░░░       35%       │
│                                         │
│  Lord of the Rings         180 / 281   │
│  ████████████░░░░░░░░       64%       │
└─────────────────────────────────────────┘
```

- Progress bar: `bg-primary-500` (červená)
- Skóre: `owned / total` (vlastní/celkem)
- Empty state: "Enable franchises in Settings to see progress"

---

## NearCompleteWidget

**Soubor:** [src/components/dashboard/NearCompleteWidget.tsx](../../src/components/dashboard/NearCompleteWidget.tsx)

Seznam sad, které jsou blízko dokončení (threshold definován v `useHomeStats`).

### Props

```typescript
interface NearCompleteWidgetProps {
  nearCompleteSets: NearCompleteSet[];
}

interface NearCompleteSet {
  setId: string;
  name: string;
  remaining: number;   // Počet chybějících karet
}
```

### Vizuální struktura

```
┌─────────────────────────────────────────┐
│  Almost Complete                        │
│                                         │
│  Warhammer 40K Commander    3 left     │  ← zelená barva (owned)
│  LOTR: Riders of Rohan      7 left     │
│  Fallout Commander          2 left     │
└─────────────────────────────────────────┘
```

- "X left" text: `text-owned font-semibold font-mono`
- Empty state: "No sets above 60% yet" (threshold je 60%)
- Každá řádka: `py-2` separátor

---

## Data hooks

Dashboard se napájí ze dvou specializovaných hooků.

### useHomeStats

**Soubor:** [src/hooks/useHomeStats.ts](../../src/hooks/useHomeStats.ts)

Agreguje statistiky z vlastněných karet a Scryfall cache.

```typescript
function useHomeStats(
  ownedCards: OwnedCard[],
  settings: CollectionsSettings
): {
  totalUniqueOwned: number;
  totalValueEur: number;
  globalCompletionPct: number;
  rarityBreakdown: Record<string, number>;
  topFranchises: FranchiseStat[];
  nearCompleteSets: NearCompleteSet[];
  mostValuableCards: ValuableCard[];
}
```

Data pro rarity pocházejí ze Scryfall localStorage cache (`getCachedCardById`) – **nejsou** součástí `OwnedCard` záznamu.

### useDashboardCardLoader

**Soubor:** [src/hooks/useDashboardCardLoader.ts](../../src/hooks/useDashboardCardLoader.ts)

Předkládá (prefetch) Scryfall data pro vlastněné karty do cache, aby `useHomeStats` měl přístup k rarity, cenám a obrázkům bez dalšího síťového požadavku.
