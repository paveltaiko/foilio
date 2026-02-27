# Foilio – Dokumentace

Foilio je progresivní webová aplikace (PWA) pro správu kolekcí Magic: The Gathering karet licencovaných sad (Universe Beyond). Umožňuje sledovat vlastněné karty, foil varianty, počty a celkovou hodnotu kolekce.

---

## Technický stack

| Oblast | Technologie |
|--------|------------|
| UI framework | React 18 + TypeScript |
| Routing | React Router v7 |
| Styling | Tailwind CSS v4 s `@theme` |
| Backend | Firebase / Firestore |
| Datový zdroj | Scryfall API + localStorage cache |
| Ikony | Lucide React |
| Data fetching | TanStack React Query |

---

## Architektura

```
src/
├── components/
│   ├── ui/          # Design system primitiva
│   ├── layout/      # Aplikační layout (Header, Nav, Footer)
│   ├── cards/       # Zobrazení MTG karet
│   ├── dashboard/   # Widgety domovské stránky
│   ├── filters/     # Filtrování a vyhledávání
│   └── collection/  # Toolbar a sdílení kolekce
├── pages/           # Top-level stránky (routes)
├── hooks/           # Custom React hooky
├── services/        # API a Firestore operace
├── config/          # Firebase, definice sad, SL drops
├── utils/           # Pomocné funkce (cache, ceny, rarity)
└── types/           # TypeScript typy (card.ts, user.ts)
```

---

## Dokumentace

### Design systém

| Soubor | Obsah |
|--------|-------|
| [design-system.md](./design-system.md) | Barvy, typografie, animace, CSS utility třídy, responsive breakpointy |

### Komponenty

| Soubor | Obsah |
|--------|-------|
| [components/ui.md](./components/ui.md) | Button, IconButton, Modal, Tabs, SegmentedControl, Badge, ProgressBar, Input, Checkbox, PullToRefresh, FaqAccordion, CollectionModeTabs |
| [components/layout.md](./components/layout.md) | Header, BottomNav, Footer, AvatarMenu |
| [components/cards.md](./components/cards.md) | CardItem, CardGrid, CardDetail, CardProductsTooltip |
| [components/dashboard.md](./components/dashboard.md) | WidgetCard, HeroWidget, CardSpotlightWidget, FoilBreakdownWidget, RarityBreakdownWidget, TopFranchisesWidget, NearCompleteWidget |
| [components/filters.md](./components/filters.md) | CollectionToolbar, FilterDrawer, SearchInput, OwnershipFilter, SortControl, BoosterFilter, SetTabs, ShareCollectionButton |

### Hooky a datová vrstva

| Soubor | Obsah |
|--------|-------|
| [hooks.md](./hooks.md) | useAuth, useOwnedCards, useCardCollection, useCollectionStats, useHomeStats, useDashboardCardLoader, useSharedCollection, useSecretLairCollection, useRenderBatch, useBoosterMap, useCardProducts, useScryfallCards |
| [services.md](./services.md) | scryfall.ts, firestore.ts, sharing.ts, mtgjson.ts, userProfile.ts – API funkce, caching, rate limiting |

### Typy a konfigurace

| Soubor | Obsah |
|--------|-------|
| [types.md](./types.md) | ScryfallCard, OwnedCard, CardWithVariant, CardProduct, UserProfile a všechny type aliasy |
| [config.md](./config.md) | FranchiseId, SetType, CollectionSet, franchises[], collectionSets[], Secret Lair drops, Firebase konfigurace |

### Stránky

| Soubor | Obsah |
|--------|-------|
| [pages.md](./pages.md) | Routing, App.tsx, AuthGuard, PreviewLoginLandingPage, DashboardPage, CollectionPage, CollectionsSettingsPage, SharedCollectionPage, globální Providers |

---

## Stránky (Routes)

| Route | Stránka | Popis |
|-------|---------|-------|
| `/` | redirect | Přesměruje na `/dashboard` |
| `/dashboard` | `DashboardPage` | Domovská stránka se statistikami |
| `/collection` | `CollectionPage` | Browsování a správa karet |
| `/settings` | `CollectionsSettingsPage` | Nastavení povolených sad |
| `/share/:token` | `SharedCollectionPage` | Sdílená kolekce (read-only) |

---

## Klíčové koncepty

### Vlastnictví karet

Každá karta může existovat ve dvou variantách: **Non-Foil** a **Foil**. Data jsou uložena v Firestore jako `OwnedCard`:

```typescript
interface OwnedCard {
  scryfallId: string;
  ownedNonFoil: boolean;
  ownedFoil: boolean;
  quantityNonFoil: number;
  quantityFoil: number;
  addedAt: Date;
  updatedAt: Date;
}
```

### Barevné kódování

| Stav | Barva |
|------|-------|
| Vlastněná (non-foil) | Zelená (`owned`) |
| Vlastněná (foil) | Purpurová (`foil-purple`) |
| Nevlastněná | Neutrální (opacity 85%) |
| Primární akce | Spider-Man červená (`primary-500`) |

### Caching strategie

Data ze Scryfall API jsou cachována ve dvou vrstvách:
1. **L1 – In-memory:** Aktuální session, okamžitý přístup
2. **L2 – localStorage:** Persistentní, TTL 24h pro karty, 7d pro sady

### Mobile/PWA

- Bottom navigation místo sidebar
- Swipe gesta (drawer, navigace karet, pull-to-refresh)
- Safe area insets pro iOS notch
- `display-mode: standalone` detekce pro PWA specifické úpravy

---

## Konvence kódu

### Naming

- **Komponenty:** PascalCase (`CardDetail.tsx`)
- **Hooky:** camelCase s prefixem `use` (`useCardCollection.ts`)
- **Typy/Interfaces:** PascalCase (`ScryfallCard`)
- **CSS třídy:** kebab-case (`.foil-overlay`)

### Importy

Komponenty exportují pojmenované exporty (named exports), nikoliv default:

```tsx
// ✅ Správně
export function Button({ ... }: ButtonProps) { ... }
import { Button } from '../ui/Button';

// ❌ Vyhýbáme se
export default function Button(...) { ... }
```

### Props

- Všechny props jsou explicitně typované přes TypeScript interfaces
- Volitelné props mají `?` a rozumnou výchozí hodnotu
- Event handlery mají prefix `on` (`onToggle`, `onClose`)
