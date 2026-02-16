# 🕷️ MTG Spider-Man Collection Tracker

Webová aplikace pro sledování sbírky karet z edice **Magic: The Gathering × Marvel Spider-Man**. Umožňuje přehledně zobrazit všechny karty z edice, označovat vlastněné karty a sledovat pokrok ve sbírce.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss)
![Firebase](https://img.shields.io/badge/Firebase-12-FFCA28?logo=firebase)

## ✨ Funkce

- 🔐 **Přihlášení přes Google** – bezpečná autentizace pomocí Firebase Auth
- 🃏 **Prohlížení karet** – všechny karty z edice načtené ze Scryfall API
- ✅ **Sledování vlastnictví** – označování karet, které vlastníte
- 📊 **Statistiky sbírky** – přehled o pokroku a hodnotě sbírky
- 🔍 **Vyhledávání a filtry** – rychlé hledání karet podle názvu
- 📱 **Responzivní design** – funguje na mobilu i desktopu

## 🛠️ Technologie

- **Frontend:** React 19, TypeScript, Tailwind CSS 4
- **State Management:** TanStack Query (React Query)
- **Backend:** Firebase (Authentication, Firestore)
- **Data:** Scryfall API
- **Build:** Vite
- **Icons:** Lucide React

## 🚀 Instalace

1. **Naklonuj repozitář:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/mtg-spider-man.git
   cd mtg-spider-man
   ```

2. **Nainstaluj závislosti:**
   ```bash
   npm install
   ```

3. **Nastav Firebase:**
   - Vytvoř projekt na [Firebase Console](https://console.firebase.google.com/)
   - Povol Google Authentication
   - Vytvoř Firestore databázi
   - Zkopíruj `.env.example` do `.env` a doplň Firebase credentials:
     ```env
     VITE_FIREBASE_API_KEY=your_api_key
     VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
     VITE_FIREBASE_PROJECT_ID=your_project_id
     VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
     VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
     VITE_FIREBASE_APP_ID=your_app_id
     ```

4. **Spusť vývojový server:**
   ```bash
   npm run dev
   ```

## 📦 Skripty

| Příkaz | Popis |
|--------|-------|
| `npm run dev` | Spustí vývojový server |
| `npm run build` | Vytvoří produkční build |
| `npm run preview` | Náhled produkčního buildu |
| `npm run lint` | Spustí ESLint |

## 🌐 Nasazení

Aplikace je optimalizovaná pro nasazení na **Vercel**:

1. Propoj GitHub repozitář s Vercel
2. Přidej Environment Variables (Firebase config)
3. Deploy! 🚀

## 📄 Licence

MIT

---

*Vytvořeno s ❤️ pro sběratele MTG karet*
