# Komponenty karet – Foilio

Komponenty pro zobrazení a interakci s MTG kartami jsou v [src/components/cards/](../../src/components/cards/).

---

## Obsah

- [CardItem](#carditem)
- [CardGrid](#cardgrid)
- [CardDetail](#carddetail)
- [CardProductsTooltip](#cardproductstooltip)

---

## CardItem

**Soubor:** [src/components/cards/CardItem.tsx](../../src/components/cards/CardItem.tsx)

Jednotlivá karta v gridu. Zobrazuje náhled obrázku, identifikační informace a ownership tlačítka.

### Props

```typescript
interface CardItemProps {
  card: ScryfallCard;
  owned?: OwnedCard;
  displayVariant?: CardVariant;  // null = obě varianty, 'nonfoil'/'foil' = jen jedna
  onToggle: (cardId: string, variant: 'nonfoil' | 'foil') => void;
  onClick: (card: ScryfallCard, variant: CardVariant) => void;
  readOnly?: boolean;
}
```

### Vizuální struktura

```
┌──────────────────────┐
│                   [1x]│  ← quantity badge (pokud > 1)
│                      │
│      [obrázek]       │  ← aspect ratio 488:680
│                      │
│   + foil overlay     │
└──────────────────────┘
  Název karty
  #042 · R           €2.50
  [  NF  ] [  F  ]        ← ownership buttons
```

### Aspect ratio

Karty mají pevný poměr stran **488:680** (standardní MTG karta). Tailwind custom token: `aspect-[488/680]`.

### Foil efekt

Foil karty (při `displayVariant === 'foil'` nebo vlastněná foil) mají:
- `.foil-image` na `<img>` – zvýšená saturace a jas
- `.foil-overlay` absolutně pozicovaný přes obrázek – duhový gradient

```html
<div class="relative overflow-hidden rounded-lg">
  <img class="foil-image" src="..." />
  <div class="foil-overlay" />
</div>
```

### Barevné kódování hranic

| Stav | Ohraničení | Pozadí |
|------|-----------|--------|
| Foil owned | `border-foil-border` | `bg-white` |
| Non-foil owned | `border-owned-border` | `bg-white` |
| Not owned | `border-surface-border` + `.card-not-owned` | `bg-white` |

### Ownership tlačítka

Pokud není `readOnly`:
- Klik na neaktivní tlačítko → toggle (přidá ownership)
- Klik na aktivní tlačítko → nic (odebírání je jen v CardDetail)

| Stav | Pozadí | Text |
|------|--------|------|
| Owned | `bg-owned-bg border-owned-border` | `text-owned` – "NF" |
| Foil owned | `bg-foil-bg border-foil-border` | `text-foil-purple` – "F" |
| Not owned | `bg-neutral-50 border-neutral-200` | `text-neutral-400` |

Pokud `readOnly`:
- Tlačítka jsou nahrazena statickými boxy (bez interakce)

### Quantity badge

Při počtu > 1 se v pravém horním rohu zobrazí badge:
- `bg-black/70 text-white rounded-full h-5 sm:h-6`
- Text: `1x`, `2x`, atd.

### Rarity indikátor

Collector number a rarita: `#042 · R` – barva dle [getRarityInfo](../../src/utils/rarity.ts).

---

## CardGrid

**Soubor:** [src/components/cards/CardGrid.tsx](../../src/components/cards/CardGrid.tsx)

Responsivní grid pro zobrazení kolekcí karet s infinite scrollem.

### Props

```typescript
interface CardGridProps {
  cards: CardWithVariant[];
  ownedCards: Map<string, OwnedCard>;
  onToggle: (cardId: string, variant: 'nonfoil' | 'foil') => void;
  onCardClick: (card: ScryfallCard, variant: CardVariant) => void;
  readOnly?: boolean;
  groupBySet?: boolean;          // Seskupení karet po sadách
  sets?: CollectionSet[];        // Potřebné pro groupBySet (metadata sad)
  onLoadMore?: () => void;       // Callback pro infinite scroll
  hasMore?: boolean;
  isLoadingMore?: boolean;
  loadMoreError?: string | null;
}
```

### Responsivní grid

```
Mobil (< 640px):  2 sloupce
Tablet (< 768px): 2 sloupce
Desktop (≥ 768px): 3 sloupce
Large (≥ 1024px):  4 sloupce
XL (≥ 1280px):     4 sloupce
```

```html
<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
```

### Grouping by set

Při `groupBySet={true}` jsou karty seskupeny pod nadpisy sad:

```
── Warhammer 40K Commander ──────────── 24/42
  [karta] [karta] [karta] [karta]
  [karta] [karta] ...

── Lord of the Rings ─────────────────── 36/281
  [karta] [karta] ...
```

Nadpis sady: název + počet vlastněných / celkem.

### Infinite scroll

Používá `IntersectionObserver` pro detekci konce gridu:
- `rootMargin: '0px 0px 900px 0px'` – trigger 900px před koncem (předkládání)
- Throttling: minimálně 300ms mezi triggers
- Footer se sentinel elementem je vždy poslední

### Skeleton loading

Při `isLoadingMore` se zobrazí 4 skeleton placeholders:
```html
<div class="skeleton aspect-[488/680] rounded-lg" />
```

### Empty state

Při prázdném poli karet: centrovaný text "No cards to display".

### LoadMoreFooter

- Tlačítko "Load more cards" – jen pokud `hasMore && !isLoadingMore`
- Skeleton (4 karty) – jen pokud `isLoadingMore`
- Error message – jen pokud `loadMoreError`

---

## CardDetail

**Soubor:** [src/components/cards/CardDetail.tsx](../../src/components/cards/CardDetail.tsx)

Detailní pohled na kartu v modálu. Umožňuje správu ownership, nastavení počtu karet a navigaci mezi kartami.

### Props

```typescript
interface CardDetailProps {
  card: ScryfallCard | null;
  selectedVariant?: CardVariant;          // null = automaticky, 'foil'/'nonfoil'
  owned?: OwnedCard;
  onClose: () => void;
  onToggle: (cardId: string, variant: 'nonfoil' | 'foil') => void;
  onQuantityChange?: (cardId: string, variant: 'nonfoil' | 'foil', quantity: number) => void;
  cards?: CardWithVariant[];              // Celý seznam pro navigaci
  onNavigate?: (card: ScryfallCard, variant: CardVariant) => void;
  readOnly?: boolean;
}
```

### Struktura modálu

```
┌────────────────────────────────────────┐
│  Název karty                      [✕] │
│  Sada · #042 · Mythic · [Koupit]      │
├────────────────────────────────────────┤
│  [←]   [   obrázek karty   ]   [→]  │
│              1 / 42                    │
├────────────────────────────────────────┤
│  [    Non-Foil: ± qty    ] [Foil: ±] │
│  [   €5.00              ] [€12.50 ] │
├────────────────────────────────────────┤
│  [  View on Cardmarket  →           ] │
└────────────────────────────────────────┘
```

### Navigace mezi kartami

**Desktop:** Šipky vlevo/vpravo (tlačítka na okrajích obrázku)

**Mobil:** Swipe gesture (horizontální tah)
- Threshold: 80px pro aktivaci navigace
- Resistance: 0.2 při nemožnosti navigace (první/poslední karta)
- Direction lock: rozlišuje horizontální (navigace) vs vertikální (modal close) gesta

**Klávesnice:** `ArrowLeft` / `ArrowRight`

**Animace navigace** (state machine):
1. `idle` → karta je statická
2. `exiting` → aktuální karta sjede z obrazovky (0.28s ease-in)
3. `repositioning` → nová karta je umístěna mimo obrazovku (bez animace)
4. `entering` → nová karta vjede do obrazovky (0.28s ease-out)
5. → `idle`

Během navigace je výška kontejneru uzamčena, aby nedošlo k vertikálnímu posunu.

### Quantity management

Při vlastnění karty se zobrazí +/- tlačítka:

```
[ − ] 2 [ + ]
```

- **Non-foil:** `bg-emerald-500 text-white` tlačítka
- **Foil:** `bg-purple-400 text-white` tlačítka
- Snížení na 0 = odebrání z kolekce

### Ceny

| Varianta | Pozadí | Text |
|----------|--------|------|
| Non-Foil | `bg-neutral-50 border border-neutral-200` | `text-neutral-800` |
| Foil | `bg-gradient-to-br from-purple-50 to-pink-50 border border-foil-border` | `text-foil-purple` |

### Zoom obrázku

Kliknutím na obrázek se otevře full-screen zoom overlay (z-index 90):
- Tmavé pozadí `rgba(0,0,0,0.85)`
- Tlačítko zavření (pravý horní roh)
- **Swipe-to-close:** tah dolů/nahoru ≥ 80px zavře zoom
- Animace: `animate-scale-in` při otevření, `animate-scale-out` při zavření

### Read-only mód

Při `readOnly={true}`:
- Ownership panely jsou statické boxy (bez interakce)
- Není dostupné +/- tlačítko pro quantity
- Určeno pro sdílené kolekce (`SharedCollectionPage`)

---

## CardProductsTooltip

**Soubor:** [src/components/cards/CardProductsTooltip.tsx](../../src/components/cards/CardProductsTooltip.tsx)

Malý tooltip s odkazem na nákupní platformy, zobrazovaný v `CardDetail`.

### Props

```typescript
interface CardProductsTooltipProps {
  setCode: string;
  collectorNumber: string;
}
```

### Chování

- Kliknutím na ikonu se zobrazí/skryje tooltip
- Obsahuje link na Cardmarket a Scryfall pro danou kartu
- Automaticky zavírá při kliknutí mimo nebo na Escape
