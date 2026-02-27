# Layout komponenty – Foilio

Layout komponenty tvoří základní strukturu aplikace. Jsou umístěny v [src/components/layout/](../../src/components/layout/).

---

## Obsah

- [Header](#header)
- [BottomNav](#bottomnav)
- [Footer](#footer)
- [AvatarMenu](#avatarmenu)

---

## Struktura layoutu

```
┌─────────────────────────────────────────┐
│  Header (sticky, z-40)                  │
├─────────────────────────────────────────┤
│                                         │
│  <main> (min-h-svh, pb-nav)            │
│    Obsah stránky                        │
│                                         │
└─────────────────────────────────────────┘
│  Footer (skrytý v PWA)                  │
└─────────────────────────────────────────┘
│  BottomNav (fixed, sm:hidden)           │
└─────────────────────────────────────────┘
```

---

## Header

**Soubor:** [src/components/layout/Header.tsx](../../src/components/layout/Header.tsx)

Sticky navigační lišta v horní části aplikace.

### Props

```typescript
interface HeaderProps {
  userName?: string | null;
  userPhoto?: string | null;
  onLogin: () => void;
  onLogout: () => void;
  onOpenSettings: () => void;
  isLoggedIn: boolean;
  onSearchClick?: () => void;
  onMobileBack?: () => void;   // Zobrazí tlačítko zpět na mobilu
}
```

### Struktura

```
┌──────────────────────────────────────────────────┐
│  [←]  (mobile back)  [Foilio]  [🔍]  [Avatar]   │
└──────────────────────────────────────────────────┘
```

Tři sekce (flex justify-between):
1. **Levá oblast:** Back button (jen mobil, pokud `onMobileBack` je definováno)
2. **Střed:** Logo "Foilio" (Poppins 800, italic, `text-primary-500`)
3. **Pravá oblast:**
   - Pokud přihlášen: Search button + `AvatarMenu`
   - Pokud nepřihlášen: `LoginButton`

### Vizuální vlastnosti

- **Pozice:** `sticky top-0 z-40`
- **Pozadí:** `bg-surface-primary border-b border-surface-border`
- **Výška:** `h-16 sm:h-14`
- **Kontejner:** `app-container-padded`
- **Search button:** `bg-red-50 text-primary-500` – kruhové, 44×44px (mobil) / 34×34px (desktop)

### Logo

```tsx
<span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800 }}
  className="text-xl sm:text-2xl italic text-primary-500 tracking-tight">
  Foilio
</span>
```

---

## BottomNav

**Soubor:** [src/components/layout/BottomNav.tsx](../../src/components/layout/BottomNav.tsx)

Fixní spodní navigace pro mobilní zařízení a PWA standalone mód. Na desktopu je skrytá.

### Props

```typescript
interface BottomNavProps {
  isLoggedIn: boolean;
  onSearchClick?: () => void;
}
```

### Viditelnost

BottomNav se zobrazí za těchto podmínek:
- Šířka obrazovky < `sm` (640px), **nebo**
- PWA standalone mód (`window.matchMedia('(display-mode: standalone)')`)

Na desktopu je skrytý: `sm:hidden` (ale PWA standalone ho zobrazí i tam).

### Navigační položky

| Pořadí | Ikona | Label | Route |
|--------|-------|-------|-------|
| 1 | `Home` | Home | `/dashboard` |
| 2 | `LayoutGrid` | Collection | `/collection` |
| 3 | `Settings` | Settings | `/settings` |
| 4 | 🔍 | Search | – (callback `onSearchClick`) |

### Vizuální vlastnosti

- **Pozice:** `fixed inset-x-0 bottom-0 z-40`
- **Tvar:** `rounded-full` – celá lišta je zakulacená jako "pill"
- **Výška:** `h-[60px]`
- **Max šířka:** `max-w-sm` – centrovaná
- **Stín:** `shadow-[0_6px_20px_rgba(0,0,0,0.08)]`
- **Safe area:** `pb-safe` – podporuje iOS notch na spodku

| Stav | Ikona barva | Label barva | Pozadí ikony |
|------|-------------|-------------|--------------|
| Aktivní | `text-primary-500` | `text-primary-500` | `bg-primary-50 rounded-xl` |
| Neaktivní | `text-neutral-400` | `text-neutral-400` | – |

### Struktura položky

```
     [ikona]
      Label
```

Každá položka: flex column, ikona nahoře, text dole, `text-[10px]`.

---

## Footer

**Soubor:** [src/components/layout/Footer.tsx](../../src/components/layout/Footer.tsx)

Jednoduchá patička s copyright a MTG disclaimerem.

### Props

Žádné – pure render komponenta.

### Obsah

- Copyright: `© {currentYear} Foilio`
- Logo "Foilio" (menší verze)
- MTG disclaimer: "Wizards of the Coast, Magic: The Gathering, and their logos are property of Wizards of the Coast LLC..."

### Viditelnost

Footer se **neskryje** jen v PWA standalone módu (`!isStandalone`).
Na mobilu mimo PWA je viditelný.

### Vizuální vlastnosti

- **Pozadí:** `bg-surface-primary border-t border-surface-border`
- **Padding:** `py-6 px-3 sm:px-6`
- **Max šířka:** `max-w-6xl mx-auto`
- **Disclaimer text:** `text-xs text-neutral-400`

---

## AvatarMenu

**Soubor:** [src/components/layout/AvatarMenu.tsx](../../src/components/layout/AvatarMenu.tsx)

Dropdown menu přístupné kliknutím na uživatelský avatar v Headeru.

### Props

```typescript
interface AvatarMenuProps {
  userName?: string | null;
  userPhoto?: string | null;
  onOpenSettings: () => void;
  onLogout: () => void;
}
```

### Struktura menu

```
[Avatar foto / ikona]
         ↓ (klik)
┌──────────────────────┐
│  Pavel Taiko         │  ← jméno uživatele
├──────────────────────┤
│  🏠  Home            │
│  📦  Collection      │
│  ⚙️   Settings        │
├──────────────────────┤
│  🚪  Sign out        │  ← červené hover
└──────────────────────┘
```

### Avatar

- **Přihlášen s fotkou:** `<img>` s `referrerPolicy="no-referrer"` (Google OAuth)
- **Bez fotky:** fallback SVG ikona uživatele
- **Velikost:** `h-[44px] w-[44px] sm:h-[34px] sm:w-[34px]` – `rounded-full`

### Dropdown

- **Pozice:** `absolute right-0 top-[calc(100%+0.5rem)]`
- **Z-index:** `z-50`
- **Šířka:** `w-56 sm:w-48`
- **Stín:** `shadow-[0_14px_32px_rgba(0,0,0,0.14)]`
- **Border radius:** `rounded-xl`
- **Padding:** `p-2 sm:p-1.5`

### Zavírání menu

- Klik mimo dropdown (click outside listener)
- Klávesa Escape
- Klik na jakoukoliv menu položku

### Vizuální stav menu položek

| Typ | Normální stav | Hover |
|-----|--------------|-------|
| Navigace | `text-neutral-700` | `bg-red-50 text-primary-500` |
| Sign out | `text-neutral-700` | `bg-red-50 text-red-600` |

Aktivní route je zvýrazněna: `bg-primary-50 text-primary-500`.
