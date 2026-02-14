import { useState, useEffect, useCallback } from 'react';
import { isFirebaseConfigured } from '../config/firebase';
import { subscribeToOwnedCards } from '../services/firestore';
import type { OwnedCard } from '../types/card';

const LOCAL_STORAGE_KEY = 'mtg-spider-owned-cards';

function loadFromLocalStorage(): Map<string, OwnedCard> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return new Map();
    const entries: [string, OwnedCard][] = JSON.parse(raw);
    return new Map(entries.map(([k, v]) => [k, {
      ...v,
      quantityNonFoil: v.quantityNonFoil ?? (v.ownedNonFoil ? 1 : 0),
      quantityFoil: v.quantityFoil ?? (v.ownedFoil ? 1 : 0),
      addedAt: new Date(v.addedAt),
      updatedAt: new Date(v.updatedAt),
    }]));
  } catch {
    return new Map();
  }
}

function saveToLocalStorage(cards: Map<string, OwnedCard>) {
  const entries = Array.from(cards.entries());
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(entries));
}

export function useOwnedCards(userId: string | null) {
  const [ownedCards, setOwnedCards] = useState<Map<string, OwnedCard>>(() => {
    if (!isFirebaseConfigured) {
      return loadFromLocalStorage();
    }
    return new Map();
  });
  const [loading, setLoading] = useState(!!userId);

  useEffect(() => {
    if (!userId) return;

    // Use Firestore when configured, localStorage otherwise
    if (isFirebaseConfigured) {
      const unsubscribe = subscribeToOwnedCards(userId, (cards) => {
        setOwnedCards(cards);
        setLoading(false);
      });
      return unsubscribe;
    }
  }, [userId]);

  // Save to localStorage when cards change (offline mode)
  const updateLocal = useCallback((updater: (prev: Map<string, OwnedCard>) => Map<string, OwnedCard>) => {
    setOwnedCards((prev) => {
      const next = updater(prev);
      if (!isFirebaseConfigured) {
        saveToLocalStorage(next);
      }
      return next;
    });
  }, []);

  return { ownedCards, loading, updateLocal };
}
