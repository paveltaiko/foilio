import { useState, useEffect } from 'react';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import type { OwnedCard } from '../types/card';
import type { UserProfile } from '../types/user';

interface SharedCollectionState {
  ownedCards: Map<string, OwnedCard>;
  profile: UserProfile | null;
  ownerUserId: string | null;
  loading: boolean;
  error: string | null;
}

export function useSharedCollection(token: string | undefined) {
  const isAvailable = !!token && isFirebaseConfigured && !!db;
  const [state, setState] = useState<SharedCollectionState>({
    ownedCards: new Map(),
    profile: null,
    ownerUserId: null,
    loading: isAvailable,
    error: isAvailable ? null : 'Collection is not available.',
  });

  useEffect(() => {
    if (!isAvailable || !db || typeof token !== 'string') {
      return;
    }
    const firestore = db;
    const shareToken = token;

    let cancelled = false;

    async function load() {
      try {
        const sharedRef = doc(firestore, 'sharedCollections', shareToken);
        const sharedSnap = await getDoc(sharedRef);

        if (cancelled) return;

        if (!sharedSnap.exists()) {
          setState({
            ownedCards: new Map(),
            profile: null,
            ownerUserId: null,
            loading: false,
            error: 'Shared collection not found.',
          });
          return;
        }

        const sharedData = sharedSnap.data();
        if (sharedData.enabled === false) {
          setState({
            ownedCards: new Map(),
            profile: null,
            ownerUserId: null,
            loading: false,
            error: 'Shared collection is disabled.',
          });
          return;
        }

        const snapshot = await getDocs(collection(firestore, 'sharedCollections', shareToken, 'ownedCards'));
        if (cancelled) return;

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

        setState({
          ownedCards: cards,
          profile: {
            userId: sharedData.userId,
            displayName: sharedData.displayName ?? 'User',
            photoURL: sharedData.photoURL ?? null,
            createdAt: sharedData.createdAt?.toDate?.() ?? new Date(),
          },
          ownerUserId: sharedData.userId ?? null,
          loading: false,
          error: null,
        });
      } catch {
        if (!cancelled) {
          setState({
            ownedCards: new Map(),
            profile: null,
            ownerUserId: null,
            loading: false,
            error: 'Failed to load collection.',
          });
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [isAvailable, token]);

  return state;
}
