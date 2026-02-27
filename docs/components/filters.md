# Filtry a nástroje kolekce – Foilio

Komponenty pro filtrování, řazení a sdílení kolekce jsou v [src/components/filters/](../../src/components/filters/) a [src/components/collection/](../../src/components/collection/).

---

## Obsah

- [CollectionToolbar](#collectiontoolbar)
- [FilterDrawer](#filterdrawer)
- [SearchInput](#searchinput)
- [OwnershipFilter](#ownershipfilter)
- [SortControl](#sortcontrol)
- [BoosterFilter](#boosterfilter)
- [SetTabs](#settabs)
- [ShareCollectionButton](#sharecollectionbutton)

---

## CollectionToolbar

**Soubor:** [src/components/collection/CollectionToolbar.tsx](../../src/components/collection/CollectionToolbar.tsx)

Hlavní toolbar kolekce s filtry, řazením a sdílením. Má responsivní rozdělení – na mobilu zobrazí kompaktní variantu, na desktopu plnohodnotnou.

### Props

```typescript
interface CollectionToolbarProps {
  user: User;
  isSLMode: boolean;                    // Secret Lair mód
  activeTab: string;
  sortOption: SortOption;
  onSortChange: (v: SortOption) => void;
  ownershipFilter: OwnershipFilter;
  onOwnershipChange: (v: OwnershipFilter) => void;
  boosterFilter: BoosterFilter;
  onBoosterChange: (v: BoosterFilter) => void;
  boosterMapLoading: boolean;
  hasBoosterData: boolean;
  groupBySet: boolean;
  onGroupBySetToggle: () => void;
  activeFilterCount: number;            // Počet aktivních filtrů (badge)
  hasActiveFilters: boolean;
  onReset: () => void;
  onFilterDrawerOpen: () => void;
  onTokenReady: (token: string) => void;
  onShareFeedback: (message: string, type: ShareToastType) => void;
}
```

### Responsivní chování

#### Mobil (`md:hidden`)

```
[Filters (3)]  [↺]          [⊞]  [↗]
```

- Tlačítko "Filters" otevírá `FilterDrawer`
- Badge s počtem aktivních filtrů (`bg-primary-500 text-white rounded-full w-5 h-5`)
- Tlačítko reset (`↺`) – jen pokud jsou aktivní filtry
- Toggle "Group by set" (`⊞`) – jen pokud `!isSLMode && activeTab === 'all'`
- Share tlačítko (`↗`)

#### Desktop (`hidden md:flex`)

```
[All | Owned | Missing]  [Number ↑ | Price ↑]  [Play | Collector]  [⊞]  [↺]  [↗]
```

Plná varianta se všemi filtry vedle sebe.

### Viditelnost prvků

| Prvek | Podmínka zobrazení |
|-------|-------------------|
| Group by set toggle | `!isSLMode && activeTab === 'all'` |
| Booster filter | `!isSLMode && hasBoosterData` |
| Reset button | `hasActiveFilters` |
| Share button | Firebase je konfigurované |

### Vizuální vlastnosti

- **Kontejner:** `pt-7 pb-4 space-y-2`
- **Filters tlačítko (mobil):** `bg-white border border-surface-border rounded-lg px-3 py-2`

---

## FilterDrawer

**Soubor:** [src/components/filters/FilterDrawer.tsx](../../src/components/filters/FilterDrawer.tsx)

Mobilní drawer se všemi filtrovacími možnostmi. Otvírá se jako `Modal` (bottom sheet).

### Props

```typescript
interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  boosterFilter: BoosterFilter;
  onBoosterChange: (v: BoosterFilter) => void;
  ownershipFilter: OwnershipFilter;
  onOwnershipChange: (v: OwnershipFilter) => void;
  sortOption: SortOption;
  onSortChange: (v: SortOption) => void;
  boosterMapLoading?: boolean;
  showBoosterFilter?: boolean;    // Default: true
  hasActiveFilters?: boolean;
  onReset?: () => void;
}
```

### Struktura draweru

```
Filters
────────────────────────────

Ownership
[  All  |  Owned  |  Missing  ]

Sort by
[  Number ↑  |  Price ↑  ]

Booster
[  All  |  Play  |  Collector  ]

[      Reset filters       ]    ← disabled pokud žádné aktivní filtry
```

### Interní `DrawerSegmented` komponenta

Lokální varianta `SegmentedControl` pro použití uvnitř draweru. Stejné vizuální principy – `bg-primary-500` pro aktivní stav.

### Sort chování

Sort tlačítka jsou "toggle" – kliknutím na aktivní tlačítko přepne směr:
- `Number ↑` → klik → `Number ↓`
- `Price ↑` → klik → `Price ↓`

### Reset tlačítko

| Stav | Pozadí | Text | Cursor |
|------|--------|------|--------|
| Aktivní filtry | `bg-neutral-800` | `text-white` | `cursor-pointer` |
| Bez aktivních filtrů | `bg-neutral-100` | `text-neutral-400` | `cursor-not-allowed` |

---

## SearchInput

**Soubor:** [src/components/filters/SearchInput.tsx](../../src/components/filters/SearchInput.tsx)

Full-screen search overlay zobrazující se přes celý header. Renderuje se jako Portal do `document.body`.

### Props

```typescript
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  isOpen: boolean;
  onClose: () => void;
  placeholder?: string;   // Default: "Search card..."
}
```

### Vizuální vlastnosti

- **Pozice:** `fixed inset-x-0 top-0 z-[100]` – překrývá Header
- **Pozadí:** `bg-white shadow-md`
- **Padding:** `px-3 py-3`
- **Animace:** `animate-fade-in`

### Chování

- **Auto-focus:** při `isOpen` se input automaticky focusuje
- **Zavření:** klik na X tlačítko vymaže hodnotu a zavře input
- **Blur zavření:** pokud je input prázdný a ztratí focus, zavře se
- **Search ikona:** `Search` z lucide-react, vlevo

### Příklady použití

```tsx
<SearchInput
  value={searchQuery}
  onChange={setSearchQuery}
  isOpen={isSearchOpen}
  onClose={() => setIsSearchOpen(false)}
  placeholder="Search card name or number..."
/>
```

---

## OwnershipFilter

**Soubor:** [src/components/filters/OwnershipFilter.tsx](../../src/components/filters/OwnershipFilter.tsx)

Filtr zobrazení karet dle stavu vlastnictví. Wrapper nad `SegmentedControl`.

### Props

```typescript
interface OwnershipFilterProps {
  value: OwnershipFilter;         // 'all' | 'owned' | 'missing'
  onChange: (filter: OwnershipFilter) => void;
}
```

### Možnosti

| Hodnota | Label | Popis |
|---------|-------|-------|
| `all` | All | Zobrazit všechny karty |
| `owned` | Owned | Zobrazit jen vlastněné karty |
| `missing` | Missing | Zobrazit jen chybějící karty |

---

## SortControl

**Soubor:** [src/components/filters/SortControl.tsx](../../src/components/filters/SortControl.tsx)

Ovládání řazení karet. Wrapper nad `SegmentedControl` s toggle logikou.

### Props

```typescript
interface SortControlProps {
  value: SortOption;         // 'number-asc' | 'number-desc' | 'price-asc' | 'price-desc'
  onChange: (sort: SortOption) => void;
}
```

### Chování

Dvě skupiny: `number` a `price`. Kliknutí přepíná směr v rámci skupiny, kliknutí na neaktivní skupinu ji aktivuje (asc jako výchozí).

| Akce | Výsledek |
|------|---------|
| Klik na "Number" (neaktivní) | `number-asc` |
| Klik na "Number" (aktivní ↑) | `number-desc` |
| Klik na "Number" (aktivní ↓) | `number-asc` |
| Klik na "Price" (neaktivní) | `price-asc` |

Label zobrazuje šipku aktuálního směru: `Number ↑`, `Price ↓`

---

## BoosterFilter

**Soubor:** [src/components/filters/BoosterFilter.tsx](../../src/components/filters/BoosterFilter.tsx)

Filtr dle typu boosteru. Zobrazuje se jen pokud má sada booster data.

### Props

```typescript
interface BoosterFilterProps {
  value: BoosterFilter;         // 'all' | 'play' | 'collector'
  onChange: (filter: BoosterFilter) => void;
  isLoading?: boolean;          // Při načítání dat je disabled
}
```

### Možnosti

| Hodnota | Label | Popis |
|---------|-------|-------|
| `all` | All | Všechny karty |
| `play` | Play | Karty dostupné v Play boosteru |
| `collector` | Collector | Karty dostupné v Collector boosteru |

Při `isLoading={true}` je `SegmentedControl` neinteraktivní (opacity reduced).

---

## SetTabs

**Soubor:** [src/components/filters/SetTabs.tsx](../../src/components/filters/SetTabs.tsx)

Záložky pro výběr aktivního setu nebo "All Cards". Wrapper nad `Tabs` komponentou.

Zobrazuje: `All Cards | Warhammer 40K | LOTR | Fallout | ...`

Na mobilu se přepne do dropdown selectu. Na desktopu s overflow → "More" dropdown.

---

## ShareCollectionButton

**Soubor:** [src/components/collection/ShareCollectionButton.tsx](../../src/components/collection/ShareCollectionButton.tsx)

Tlačítko pro sdílení kolekce pomocí unikátního URL tokenu.

### Props

```typescript
interface ShareCollectionButtonProps {
  user: User;
  onTokenReady: (token: string) => void;
  onFeedback: (message: string, type: ShareToastType) => void;
}

type ShareToastType = 'success' | 'error' | 'copied';
```

### Chování

1. Při prvním kliknutí: generuje token v Firestore (`generating.ts`)
2. Pokud token existuje: zkopíruje URL do schránky
3. Zobrazí `ShareFeedbackToast` se zpětnou vazbou

### Typy zpětné vazby

| Type | Zpráva | Barva |
|------|--------|-------|
| `success` | "Share link created!" | Zelená |
| `copied` | "Link copied to clipboard!" | Modrá |
| `error` | "Failed to create share link" | Červená |
