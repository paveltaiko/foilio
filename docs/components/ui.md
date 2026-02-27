# UI Primitiva – Foilio

Všechny primitivní komponenty jsou umístěny v [src/components/ui/](../../src/components/ui/). Tvoří základ design systému a jsou používány napříč celou aplikací.

---

## Obsah

- [Button](#button)
- [IconButton](#iconbutton)
- [Modal](#modal)
- [Tabs](#tabs)
- [SegmentedControl](#segmentedcontrol)
- [Badge](#badge)
- [ProgressBar](#progressbar)
- [Input](#input)
- [Checkbox](#checkbox)
- [PullToRefresh](#pulltorefresh)
- [FaqAccordion](#faqaccordion)
- [CollectionModeTabs](#collectionmodetabs)

---

## Button

**Soubor:** [src/components/ui/Button.tsx](../../src/components/ui/Button.tsx)

Základní akční tlačítko s několika vizuálními variantami a dvěma velikostmi. Rozšiřuje nativní `<button>` element.

### Props

```typescript
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger-ghost';
  size?: 'sm' | 'md';
}
```

### Varianty

| Variant | Pozadí | Text | Hover | Použití |
|---------|--------|------|-------|---------|
| `primary` | `bg-primary-500` | `text-white` | `hover:bg-primary-600` | Hlavní akce, potvrzení |
| `secondary` | `bg-white border` | `text-neutral-800` | `hover:bg-neutral-50` | Sekundární akce |
| `ghost` | transparentní | `text-neutral-600` | `hover:bg-neutral-100` | Subtilní akce, navigace |
| `danger-ghost` | transparentní | `text-neutral-600` | `hover:bg-red-50` | Destruktivní akce |

### Velikosti

| Size | Padding | Font | Min-height |
|------|---------|------|-----------|
| `sm` | `px-3 py-1.5` | `text-xs` | `min-h-8` (32px) |
| `md` *(výchozí)* | `px-4 py-2` | `text-sm` | `min-h-10` (40px) |

### Chování

- **Disabled stav:** `opacity-50 cursor-not-allowed` – automaticky z HTML `disabled` atributu
- **Transitions:** `transition-colors duration-150`
- **Border radius:** `rounded-md` (6px)

### Příklady použití

```tsx
// Primární akce
<Button variant="primary" onClick={handleSave}>
  Save changes
</Button>

// Malé sekundární tlačítko
<Button variant="secondary" size="sm">
  Cancel
</Button>

// Ghost tlačítko
<Button variant="ghost" disabled={isLoading}>
  Skip
</Button>
```

---

## IconButton

**Soubor:** [src/components/ui/IconButton.tsx](../../src/components/ui/IconButton.tsx)

Čtvercové tlačítko pro ikony s rozlišením aktivního/neaktivního stavu. Pevná velikost 38×38px.

### Props

```typescript
interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  children: ReactNode;
}
```

### Stavy

| Stav | Pozadí | Text | Ohraničení |
|------|--------|------|-----------|
| Neaktivní *(výchozí)* | `bg-white` | `text-neutral-500` | `border-surface-border` |
| Aktivní (`active={true}`) | `bg-primary-500` | `text-white` | `border-primary-500` |
| Disabled | `opacity-60` | – | – |

### Vizuální vlastnosti

- **Velikost:** `h-[38px] w-[38px]` – fixní, touch-friendly
- **Border radius:** `rounded-lg`
- **Transition:** `colors duration-150`

### Příklady použití

```tsx
// Toggle "group by set"
<IconButton
  active={groupBySet}
  onClick={onGroupBySetToggle}
  title="Group by set"
>
  <Layers className="w-4 h-4" />
</IconButton>

// Reset filtrů
<IconButton onClick={onReset}>
  <RotateCcw className="w-4 h-4" />
</IconButton>
```

---

## Modal

**Soubor:** [src/components/ui/Modal.tsx](../../src/components/ui/Modal.tsx)

Pokročilý modal s adaptivním chováním pro mobilní a desktopové zařízení. Na mobilu se zobrazí jako bottom drawer s gesture podporou, na desktopu jako centrovaný dialog.

### Props

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}
```

### Chování

#### Mobil (bottom drawer)
- Animace: `animate-slide-up` při otevření, `animate-slide-down` při zavření
- **Swipe-to-close:** tažení dolů ≥ 100px modal zavře
- Handle bar: 9px vysoký, šedý proužek na vrchu – vizuální indikátor swipe možnosti
- **Direction lock:** rozlišuje vertikální (swipe-to-close) vs horizontální (ignore) gesta
- Max výška: `90svh`
- Safe area padding pro iPhone notch

#### Desktop
- Animace: `animate-scale-in` / `animate-scale-out`
- Zavření tlačítkem X nebo klávesou Escape
- Max výška: `85vh`
- Centrovaný s `max-w-lg` šířkou

### Sdílené chování
- **Portal:** Renderuje do `document.body` mimo DOM hierarchii
- **Scroll lock:** Zamkne `body` scroll při otevřeném modálu (kompenzuje scrollbar šířku)
- **Escape key:** Zavře modal na klávesnici
- **Overlay:** Klik na tmavé pozadí modal zavře
- **Z-index:** `70`

### Příklady použití

```tsx
// CardDetail modal
<Modal isOpen={!!selectedCard} onClose={handleClose}>
  <CardDetail card={selectedCard} ... />
</Modal>

// FilterDrawer
<Modal isOpen={isFilterOpen} onClose={closeFilter}>
  <div className="space-y-5">
    <h2>Filters</h2>
    ...
  </div>
</Modal>
```

---

## Tabs

**Soubor:** [src/components/ui/Tabs.tsx](../../src/components/ui/Tabs.tsx)

Záložkový navigační prvek s responzivním chováním – na mobilu dropdown select, na desktopu horizontální tabs s overflow řešením pomocí "More" dropdown.

### Props

```typescript
interface Tab {
  id: string;
  label: string;
  count?: number;        // Volitelný číselný badge
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  prefix?: ReactNode;    // Volitelný prvek před tabsy (např. CollectionModeTabs)
}
```

### Chování

#### Mobil (`block md:hidden`)
- Renderuje `<select>` nativní dropdown
- `count` zobrazí jako "(42)" za labelem

#### Desktop (`hidden md:block`)
- Horizontální tabs s `overflow-hidden`
- `ResizeObserver` sleduje dostupnou šířku
- Přetékající tabs se schovjí do "More" dropdown tlačítka
- `count` zobrazí jako malý badge `text-2xs`

### Příklady použití

```tsx
const tabs = [
  { id: 'all', label: 'All Cards', count: 450 },
  { id: 'wh40k', label: 'Warhammer 40K' },
  { id: 'lotr', label: 'Lord of the Rings', count: 281 },
];

<Tabs
  tabs={tabs}
  activeTab={activeTab}
  onChange={setActiveTab}
  prefix={<CollectionModeTabs ... />}
/>
```

---

## SegmentedControl

**Soubor:** [src/components/ui/SegmentedControl.tsx](../../src/components/ui/SegmentedControl.tsx)

Skupina tlačítek fungující jako radio buttons – pouze jedno může být aktivní. Používá generický TypeScript typ pro type-safe hodnoty.

### Props

```typescript
interface SegmentOption<T extends string> {
  id: T;
  label: ReactNode;
  title?: string;        // Tooltip (title atribut)
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}
```

### Vizuální vlastnosti

- **Výška:** `h-[38px]` – touch-friendly, konzistentní s IconButton
- **Zakulacení:** `first:rounded-l-lg last:rounded-r-lg` – group border radius
- **Border:** `-ml-px first:ml-0` – sdílené ohraničení mezi segmenty

| Stav | Pozadí | Text | Z-index |
|------|--------|------|---------|
| Neaktivní | `bg-white` | `text-neutral-500` | `z-0` |
| Hover | `hover:bg-neutral-50` | `hover:text-neutral-700` | `z-0` |
| Aktivní | `bg-primary-500` | `text-white` | `z-10` |

### Příklady použití

```tsx
// Ownership filter (All / Owned / Missing)
<SegmentedControl
  options={[
    { id: 'all', label: 'All', title: 'Show all cards' },
    { id: 'owned', label: 'Owned', title: 'Show only owned cards' },
    { id: 'missing', label: 'Missing', title: 'Show only missing cards' },
  ]}
  value={ownershipFilter}
  onChange={setOwnershipFilter}
/>

// Sort control (Number / Price)
<SegmentedControl
  options={[
    { id: 'number', label: 'Number ↑' },
    { id: 'price', label: 'Price ↑' },
  ]}
  value={activeSortGroup}
  onChange={handleSortClick}
/>
```

---

## Badge

**Soubor:** [src/components/ui/Badge.tsx](../../src/components/ui/Badge.tsx)

Malý informační prvek zobrazující stav nebo kategorii karty. Volitelně interaktivní.

### Props

```typescript
interface BadgeProps {
  variant: 'owned' | 'foil' | 'not-owned' | 'set-label';
  children: React.ReactNode;
  onClick?: () => void;   // Badge bude interaktivní (cursor-pointer)
  className?: string;
}
```

### Varianty

| Variant | Pozadí | Text | Ohraničení | Popis |
|---------|--------|------|-----------|-------|
| `owned` | `bg-owned-bg` | `text-owned` | `border-owned-border` | Vlastněná karta (non-foil) |
| `foil` | `bg-foil-bg` | `text-foil-purple` | `border-foil-border` | Vlastněná foil karta |
| `not-owned` | `bg-neutral-100` | `text-neutral-400` | `border-neutral-200` | Nevlastněná karta |
| `set-label` | `bg-neutral-100` | `text-neutral-700` | `border-neutral-200` | Kód sady (`font-mono font-bold`) |

### Vizuální vlastnosti

- **Padding:** `px-2 py-0.5`
- **Font:** `text-2xs uppercase` (kromě `set-label` – ten je `font-mono font-bold`)
- **Interaktivní:** `cursor-pointer hover:opacity-80 active:scale-95`

### Příklady použití

```tsx
// Karta je vlastněná
<Badge variant="owned">Owned</Badge>

// Foil varianta
<Badge variant="foil">Foil</Badge>

// Kód sady
<Badge variant="set-label">wh40k</Badge>

// Interaktivní badge (toggle)
<Badge variant="owned" onClick={() => onToggle(card.id, 'nonfoil')}>
  NF
</Badge>
```

---

## ProgressBar

**Soubor:** [src/components/ui/ProgressBar.tsx](../../src/components/ui/ProgressBar.tsx)

Jednoduchý horizontální progress bar pro zobrazení procenta dokončení.

### Props

```typescript
interface ProgressBarProps {
  value: number;      // 0–100 (procenta)
  className?: string;
}
```

### Vizuální vlastnosti

- **Track:** `h-2 bg-neutral-100 rounded-full`
- **Bar:** `bg-primary-500 rounded-full`
- **Animace:** `transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)` – plynulé rozjetí
- **Min-width:** `8px` při `value > 0` – bar je vždy viditelný

### Příklady použití

```tsx
// Dokončenost kolekce
<ProgressBar value={globalCompletionPct} />

// S custom třídou
<ProgressBar value={75} className="mt-2" />
```

---

## Input

**Soubor:** [src/components/ui/Input.tsx](../../src/components/ui/Input.tsx)

Textový vstup s volitelným labelem a prefix symbolem.

### Props

```typescript
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;     // Label nad inputem
  prefix?: string;    // Symbol vlevo (např. "€")
}
```

### Vizuální vlastnosti

- **Výška:** `h-10`
- **Font:** `text-sm font-mono text-right` – čísla zarovnaná vpravo
- **Label:** `text-xs font-medium text-neutral-600`
- **Ohraničení:** `border-neutral-200`
- **Focus:** `border-primary-500 ring-2 ring-primary-100`
- **Placeholder:** `text-neutral-400`
- **Disabled:** `bg-neutral-50 text-neutral-400`
- **Prefix:** absolutně pozicovaný vlevo, input pak má `pl-8`

### Příklady použití

```tsx
// S labelem a prefix symbolem
<Input
  label="Price limit"
  prefix="€"
  type="number"
  value={priceLimit}
  onChange={(e) => setPriceLimit(e.target.value)}
  placeholder="0.00"
/>

// Bez labelu
<Input
  type="text"
  value={query}
  onChange={(e) => setQuery(e.target.value)}
/>
```

---

## Checkbox

**Soubor:** [src/components/ui/Checkbox.tsx](../../src/components/ui/Checkbox.tsx)

Vlastní checkbox s SVG checkmarkem místo nativního HTML prvku.

### Props

```typescript
interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}
```

### Vizuální vlastnosti

- **Velikost:** `h-5 w-5` – čtverec 20×20px
- **Border radius:** `rounded-md`
- **SVG checkmark:** `polyline "1,5 4.5,8.5 11,1"`, bílá barva, strokeWidth 2.5

| Stav | Pozadí | Ohraničení |
|------|--------|-----------|
| Unchecked | `bg-white` | `border-neutral-300 hover:border-neutral-400` |
| Checked | `bg-primary-500` | `border-primary-500` |
| Disabled | – | `opacity-40 cursor-not-allowed` |

### Příklady použití

```tsx
<Checkbox
  checked={isEnabled}
  onChange={(checked) => setIsEnabled(checked)}
/>

<Checkbox
  checked={isSelected}
  onChange={handleChange}
  disabled={isLoading}
/>
```

---

## PullToRefresh

**Soubor:** [src/components/ui/PullToRefresh.tsx](../../src/components/ui/PullToRefresh.tsx)

Wrapper komponenta přidávající pull-to-refresh gesto na mobilních zařízeních. Přetáhnutím dolů se spustí `onRefresh` callback.

### Props

```typescript
interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  disabled?: boolean;
}
```

### Thresholdy a fyzika

| Konstanta | Hodnota | Popis |
|-----------|---------|-------|
| `REVEAL_START_PX` | 60px | Od kdy se začne zobrazovat indikátor |
| `REFRESH_HOLD_PX` | 82px | Pozice při aktivním refreshi |
| `THRESHOLD_PX` | 135px | Přetažení spouštějící refresh |
| Resistance | `0.72` | Faktor odporu tahu (tah → pohyb) |
| Max pull | `50% viewport` | Maximální vzdálenost tahu (min 220px) |

### Indikátor

- 12-ramenný spinner (SVG)
- Barva: `text-primary-500`
- Scale: `0.9 → 1.0` při tahu
- Spin animace (2.3s) aktivní při `isRefreshing`

### Příklady použití

```tsx
<PullToRefresh onRefresh={handleRefresh}>
  <CardGrid ... />
</PullToRefresh>

// Vypnutý (např. při otevřeném filtru)
<PullToRefresh onRefresh={handleRefresh} disabled={isFilterOpen}>
  ...
</PullToRefresh>
```

---

## FaqAccordion

**Soubor:** [src/components/ui/FaqAccordion.tsx](../../src/components/ui/FaqAccordion.tsx)

Rozbalovací seznam otázek a odpovědí. Jedno kliknutí otevře odpověď, druhé zavře.

### Props

```typescript
interface FaqItem {
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
}
```

### Vizuální vlastnosti

- **Kontejner:** `border border-surface-border rounded-lg`
- **Položky:** oddělené `divide-y divide-surface-border`
- **Tlačítko:** `px-4 py-3.5 sm:px-5 sm:py-4 hover:bg-neutral-50`
- **Šipka:** `ChevronDown`, rotuje o 180° při rozbalení (`transition-transform duration-200`)
- **Odpověď:** `text-xs sm:text-sm text-neutral-600 px-4 pb-4`

### Příklady použití

```tsx
<FaqAccordion
  items={[
    {
      question: 'What is Foilio?',
      answer: 'Foilio is a Magic: The Gathering collection tracker...',
    },
    {
      question: 'How do I add cards?',
      answer: 'Click on any card to toggle ownership...',
    },
  ]}
/>
```

---

## CollectionModeTabs

**Soubor:** [src/components/ui/CollectionModeTabs.tsx](../../src/components/ui/CollectionModeTabs.tsx)

Přepínač módu kolekce – určuje, které sady jsou zobrazeny. Funguje jako horizontální tab bar.

### Props

```typescript
export type CollectionMode = 'ub' | 'secret-lair' | 'custom';

interface CollectionModeTabsProps {
  activeMode: CollectionMode;
  onChange: (mode: CollectionMode) => void;
}
```

### Módy

| Mód | Label | Popis |
|-----|-------|-------|
| `ub` | Universe Beyond | Licencované MTG sady (Warhammer, LOTR, atd.) |
| `secret-lair` | Secret Lair | Secret Lair drops |
| `custom` | Custom | Vlastní výběr (zatím nedostupné – `disabled`) |

### Vizuální vlastnosti

- **Styl:** Border-bottom tabs (`border-b-2 -mb-px`)
- **Aktivní:** `text-primary-500 border-primary-500`
- **Neaktivní:** `text-neutral-500 border-transparent hover:text-neutral-700`
- **Custom mód:** `opacity-30 cursor-not-allowed`
- **Padding:** `px-4 py-2.5`

### Příklady použití

```tsx
<CollectionModeTabs
  activeMode={collectionMode}
  onChange={setCollectionMode}
/>
```
