# Design systém – Foilio

Foilio používá **Tailwind CSS v4** s vlastním `@theme` blokem definovaným v [src/index.css](../src/index.css). Veškeré tokeny jsou dostupné jako CSS custom properties a automaticky jako Tailwind utility třídy.

---

## Obsah

- [Barvy](#barvy)
- [Typografie](#typografie)
- [Border radius](#border-radius)
- [Animace](#animace)
- [CSS utility třídy](#css-utility-třídy)
- [Responsive breakpointy](#responsive-breakpointy)
- [Z-index hierarchie](#z-index-hierarchie)
- [Rarita karet](#rarita-karet)

---

## Barvy

### Primární – Spider-Man Red

Hlavní akční barva aplikace. Používá se pro tlačítka, aktivní stavy, badge, progress bary a fokusové prstence.

| Token | Hodnota | Použití |
|-------|---------|---------|
| `primary-50` | `#FEF2F2` | Pozadí jemných akcentů, hover stavy |
| `primary-100` | `#FEE2E2` | Světlé pozadí badges |
| `primary-200` | `#FECACA` | Ohraničení jemných prvků |
| `primary-300` | `#F87171` | Ikony, dekorativní prvky |
| `primary-400` | `#EF4444` | Hover tlačítek |
| `primary-500` | `#DC2626` | **Hlavní akční barva** – tlačítka, aktivní stavy |
| `primary-600` | `#B91C1C` | Hover primary tlačítek |
| `primary-700` | `#991B1B` | Active/pressed stav |
| `primary-800` | `#7F1D1D` | Tmavé akcenty |
| `primary-900` | `#450A0A` | Nejsilnější akcent |

```css
/* CSS custom property */
var(--color-primary-500)

/* Tailwind utility */
bg-primary-500
text-primary-500
border-primary-500
```

---

### Sekundární – Spider-Man Blue

Používá se pro sekundární akce, externí linky (Cardmarket), informační prvky.

| Token | Hodnota | Použití |
|-------|---------|---------|
| `secondary-50` | `#EFF6FF` | Pozadí Cardmarket tlačítek |
| `secondary-100` | `#DBEAFE` | Světlé akcenty |
| `secondary-200` | `#BFDBFE` | Ohraničení informačních prvků |
| `secondary-300` | `#93C5FD` | – |
| `secondary-400` | `#60A5FA` | – |
| `secondary-500` | `#2563EB` | **Hlavní sekundární barva** |
| `secondary-600` | `#1D4ED8` | Hover sekundárních prvků |
| `secondary-700` | `#1E40AF` | Tmavý sekundární |

```html
<!-- Příklad: Cardmarket odkaz -->
<a class="text-secondary-500 bg-secondary-50 border border-secondary-200 hover:bg-secondary-100">
  View on Cardmarket
</a>
```

---

### Sémantické barvy – Owned (vlastněno)

Zelená paleta pro indikaci vlastněných karet.

| Token | Hodnota | Použití |
|-------|---------|---------|
| `owned` | `#22C55E` | Text, ikony vlastněných karet |
| `owned-bg` | `#F0FDF4` | Pozadí owned badge/panelů |
| `owned-border` | `#86EFAC` | Ohraničení owned prvků |

```html
<!-- Owned stav karty -->
<div class="bg-owned-bg border-owned-border">
  <span class="text-owned">Owned</span>
</div>
```

---

### Sémantické barvy – Foil

Purpurová/duhová paleta pro foil varianty karet.

| Token | Hodnota | Použití |
|-------|---------|---------|
| `foil-purple` | `#A855F7` | Hlavní foil text, ikony |
| `foil-pink` | `#EC4899` | Část foil gradientu |
| `foil-blue` | `#3B82F6` | Část foil gradientu |
| `foil-green` | `#10B981` | Část foil gradientu |
| `foil-bg` | `#FAF5FF` | Pozadí foil panelů |
| `foil-border` | `#E9D5FF` | Ohraničení foil prvků |

```html
<!-- Foil cena karty -->
<div class="bg-gradient-to-br from-purple-50 to-pink-50 border border-foil-border">
  <span class="text-foil-purple font-bold">€ 12.50</span>
</div>
```

---

### Surface barvy

Neutrální plochy pro pozadí, karty a ohraničení.

| Token | Hodnota | Použití |
|-------|---------|---------|
| `surface-primary` | `#FFFFFF` | Primární pozadí karet, modalů, widgetů |
| `surface-secondary` | `#FAFAFA` | Pozadí stránky (body) |
| `surface-elevated` | `#FFFFFF` | Elevated prvky (dropdown, tooltip) |
| `surface-border` | `#EDEDED` | Standardní ohraničení |

---

## Typografie

### Fonty

| Proměnná | Font stack | Použití |
|----------|-----------|---------|
| `--font-sans` | `Inter, system-ui, -apple-system, sans-serif` | Veškerý UI text |
| `--font-mono` | `JetBrains Mono, Fira Code, monospace` | Ceny, kódy, čísla karet, výsledky |

```html
<!-- Cena v mono fontu -->
<span class="font-mono text-base font-bold">€ 45.00</span>

<!-- Collector number -->
<span class="font-mono text-xs text-neutral-500">#042</span>
```

### Vlastní velikosti

| Třída | Velikost | Line height | Použití |
|-------|---------|-------------|---------|
| `text-2xs` | `0.625rem` (10px) | `0.875rem` | Tiny labely, počty v tabech, badge texty |

```html
<span class="text-2xs font-medium uppercase tracking-wider">42</span>
```

---

## Border radius

| Token | Hodnota | Použití |
|-------|---------|---------|
| `--radius-card` | `8px` | Karty ve gridu (`rounded-lg`) |
| `--radius-card-sm` | `14px` | Větší karty na desktopu (`rounded-card-sm`) |
| `--radius-lg` | `8px` | Obecné zakulacení |

Tailwind třídy pro zakulacení:
- `rounded-sm` – 4px – malé prvky
- `rounded-md` – 6px – tlačítka, inputy
- `rounded-lg` – 8px – karty, panely
- `rounded-xl` – 12px – dropdown menu, widgety
- `rounded-2xl` – 16px – dashboard widgety
- `rounded-full` – plný – avatar, badges, circular buttons

---

## Animace

Všechny animace jsou definovány jako CSS keyframes a zpřístupněny přes Tailwind `animate-*` třídy.

### Dostupné animace

| Třída | Trvání | Easing | Popis |
|-------|--------|--------|-------|
| `animate-foil-shimmer` | 3s | linear | Nekonečné posouvání foil gradient textu |
| `animate-scale-in` | 200ms | `cubic-bezier(0.16, 1, 0.3, 1)` | Otevření modálu (desktop) – scale 0.95→1 + fade in |
| `animate-scale-out` | 200ms | `cubic-bezier(0.4, 0, 1, 1)` | Zavření modálu (desktop) – scale 1→0.95 + fade out |
| `animate-slide-up` | 300ms | `cubic-bezier(0.16, 1, 0.3, 1)` | Otevření draweru (mobile) – slide z dola |
| `animate-slide-down` | 300ms | `cubic-bezier(0.4, 0, 1, 1)` | Zavření draweru (mobile) – slide dolu |
| `animate-fade-in` | 200ms | `ease` | Fade in – SearchInput overlay, card grid |
| `animate-fade-out` | 300ms | `cubic-bezier(0.4, 0, 1, 1)` | Fade out |

### Použití

```html
<!-- Otevírací animace modal (desktop) -->
<div class="animate-scale-in">...</div>

<!-- Zavírací animace drawer (mobile) -->
<div class="animate-slide-down">...</div>

<!-- Shimmer text u foil karet -->
<span class="text-foil">Foil</span>
```

---

## CSS utility třídy

Vlastní třídy definované v `src/index.css` mimo Tailwind systém.

### Layout

| Třída | Popis |
|-------|-------|
| `.app-container` | Centrovaný container, `max-width: 72rem` |
| `.app-container-padded` | Stejné jako výše + `padding-inline: 0.75rem` (na xl bez paddingu) |
| `.pb-nav` | Padding-bottom pro fixed bottom nav na mobilu; na `sm:` = `2rem` |
| `.safe-bottom` | `padding-bottom: env(safe-area-inset-bottom)` – iOS notch |

```html
<!-- Standardní obsah stránky -->
<main class="app-container-padded pb-nav safe-bottom">
  ...
</main>
```

### Karty a foil efekty

| Třída | Popis |
|-------|-------|
| `.foil-image` | Zvýšená saturace a jas: `filter: saturate(1.3) brightness(1.05) contrast(1.05)` |
| `.foil-overlay` | Absolutně pozicovaný duhový gradient přes obrázek, `mix-blend-mode: screen` |
| `.card-not-owned` | `opacity: 0.85` – vizuální odlišení nevlastněných karet |
| `.card-hover-lift` | Hover efekt `translateY(-2px)` – pouze na zařízeních s myší (`@media (hover: hover)`) |

```html
<!-- Foil karta -->
<div class="relative overflow-hidden rounded-lg">
  <img class="foil-image" src="..." />
  <div class="foil-overlay" />
</div>

<!-- Nevlastněná karta -->
<div class="card-not-owned">...</div>
```

### Loading a animace

| Třída | Popis |
|-------|-------|
| `.skeleton` | Pulzující loading placeholder – šedé pozadí s 2s pulse animací |
| `.text-foil` | Animovaný shimmer gradient text (purple → pink → blue) |

```html
<!-- Loading skeleton -->
<div class="skeleton h-48 w-full rounded-lg" />

<!-- Foil text -->
<span class="text-foil font-bold">Foil Edition</span>
```

### Touch a scroll

| Třída | Popis |
|-------|-------|
| `.scrollbar-hide` | Skryje scrollbar (mobile) |
| `.touch-pan-y` | `touch-action: pan-y` – umožní vertikální scroll přes touch gesta |
| `.touch-pan-x` | `touch-action: pan-x` – umožní horizontální scroll |
| `.overscroll-contain` | `overscroll-behavior: contain` – zabrání propagaci scrollu na parent |

---

## Responsive breakpointy

Foilio používá **mobile-first** přístup. Výchozí styly platí pro mobilní zařízení, breakpointy přidávají úpravy pro větší obrazovky.

| Prefix | Šířka | Popis |
|--------|-------|-------|
| *(žádný)* | `0px+` | Mobilní zařízení |
| `sm:` | `640px+` | Tablet / malý desktop |
| `md:` | `768px+` | Střední desktop |
| `lg:` | `1024px+` | Velký desktop |
| `xl:` | `1280px+` | Extra velký desktop |

### Klíčové responsive patterny

```html
<!-- Grid: 2 sloupce mobil, 3 tablet, 4 desktop -->
<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">

<!-- Skrýt na mobilu, zobrazit na desktopu -->
<div class="hidden md:flex">

<!-- Zobrazit jen na mobilu -->
<div class="md:hidden">

<!-- Různé mezerování -->
<div class="gap-2 sm:gap-3 md:gap-4">

<!-- Různá výška headeru -->
<header class="h-16 sm:h-14">
```

---

## Z-index hierarchie

| Vrstva | Z-index | Prvky |
|--------|---------|-------|
| Obsah stránky | `0` | Karty, widgety, text |
| Sticky header | `z-40` | `Header`, `BottomNav` |
| Dropdown menu | `z-50` | `AvatarMenu` dropdown |
| Modal overlay | `z-70` | `Modal` komponenta |
| Search overlay | `z-[100]` | `SearchInput` portal |
| Zoom overlay | `z-[90]` | Zoom obrázku v `CardDetail` |

---

## Rarita karet

Rarita je zobrazena konzistentně přes celou aplikaci pomocí utility `getRarityInfo()` z [src/utils/rarity.ts](../src/utils/rarity.ts).

| Rarita | Zkratka | Barva textu | Badge třída |
|--------|---------|-------------|-------------|
| Common | C | `text-neutral-400` | `bg-neutral-400 text-white` |
| Uncommon | U | `text-slate-500` | `bg-slate-500 text-white` |
| Rare | R | `text-amber-500` | `bg-amber-500 text-white` |
| Mythic | M | `text-red-500` | `bg-red-500 text-white` |
| Special | S | `text-purple-500` | `bg-purple-500 text-white` |
| Bonus | B | `text-purple-500` | `bg-purple-500 text-white` |

```tsx
import { getRarityInfo } from '../utils/rarity';

const info = getRarityInfo(card.rarity);
// info.label    → "Mythic"
// info.short    → "M"
// info.colorClass → "text-red-500"
// info.badgeClass → "bg-red-500 text-white"
```
