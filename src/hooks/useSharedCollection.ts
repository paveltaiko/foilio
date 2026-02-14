import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import { getUserProfile } from '../services/userProfile';
import type { OwnedCard } from '../types/card';
import type { UserProfile } from '../types/user';

interface SharedCollectionState {
  ownedCards: Map<string, OwnedCard>;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

export function useSharedCollection(userId: string | undefined) {
  const [state, setState] = useState<SharedCollectionState>({
    ownedCards: new Map(),
    profile: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!userId || !isFirebaseConfigured || !db) {
      setState((prev) => ({ ...prev, loading: false, error: 'Sbírka není dostupná.' }));
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        // Fetch profile and owned cards in parallel
        const [profile, snapshot] = await Promise.all([
          getUserProfile(userId!),
          getDocs(collection(db!, 'users', userId!, 'ownedCards')),
        ]);

        if (cancelled) return;

        if (!profile) {
          setState({ ownedCards: new Map(), profile: null, loading: false, error: 'Uživatel nebyl nalezen.' });
          return;
        }

        const cards = new Map<string, OwnedCard>();
        snapshot.forEach((doc) => {
          const data = doc.data();
          cards.set(doc.id, {
            scryfallId: doc.id,
            set: data.set,
            collectorNumber: data.collectorNumber,
            name: data.name,
            ownedNonFoil: data.ownedNonFoil ?? false,
            ownedFoil: data.ownedFoil ?? false,
            quantityNonFoil: data.quantityNonFoil ?? (data.ownedNonFoil ? 1 : 0),
            quantityFoil: data.quantityFoil ?? (data.ownedFoil ? 1 : 0),
            addedAt: data.addedAt?.toDate?.() ?? new Date(),
            updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
          });
        });

        setState({ ownedCards: cards, profile, loading: false, error: null });
      } catch {
        if (!cancelled) {
          setState({ ownedCards: new Map(), profile: null, loading: false, error: 'Nepodařilo se načíst sbírku.' });
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [userId]);

  return state;
}
