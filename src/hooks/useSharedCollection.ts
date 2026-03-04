import { useState, useEffect, useCallback } from 'react';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import type { OwnedCard } from '../types/card';
import type { UserProfile } from '../types/user';
import { deserializeOwnedCard } from '../utils/deserializeOwnedCard';

interface SharedCollectionState {
  ownedCards: Map<string, OwnedCard>;
  profile: UserProfile | null;
  ownerUserId: string | null;
  // undefined = ještě se načítá, string[] = načteno (může být prázdné)
  visibleSetIds: string[] | undefined;
  loading: boolean;
  error: string | null;
}

const EMPTY_ERROR_STATE = (error: string): SharedCollectionState => ({
  ownedCards: new Map(),
  profile: null,
  ownerUserId: null,
  visibleSetIds: [],
  loading: false,
  error,
});

export function useSharedCollection(token: string | undefined) {
  const isAvailable = !!token && isFirebaseConfigured && !!db;
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState<SharedCollectionState>({
    ownedCards: new Map(),
    profile: null,
    ownerUserId: null,
    visibleSetIds: undefined,
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
          setState(EMPTY_ERROR_STATE('Shared collection not found.'));
          return;
        }

        const sharedData = sharedSnap.data();
        if (sharedData.enabled === false) {
          setState(EMPTY_ERROR_STATE('Shared collection is disabled.'));
          return;
        }

        const ownerId = sharedData.userId as string | undefined;

        // visibleSetIds are stored directly in the sharedCollections document
        // and synced by the owner's CollectionPage when settings change.
        const rawVisibleSetIds = sharedData.visibleSetIds;
        const visibleSetIds: string[] = Array.isArray(rawVisibleSetIds)
          ? rawVisibleSetIds.filter((v): v is string => typeof v === 'string')
          : [];

        const snapshot = await getDocs(collection(firestore, 'sharedCollections', shareToken, 'ownedCards'));
        if (cancelled) return;

        const cards = new Map<string, OwnedCard>();
        snapshot.forEach((docSnap) => {
          cards.set(docSnap.id, deserializeOwnedCard(docSnap.id, docSnap.data() as Record<string, unknown>));
        });

        setState({
          ownedCards: cards,
          profile: {
            userId: sharedData.userId,
            displayName: sharedData.displayName ?? 'User',
            photoURL: sharedData.photoURL ?? null,
            createdAt: sharedData.createdAt?.toDate?.() ?? new Date(),
          },
          ownerUserId: ownerId ?? null,
          visibleSetIds,
          loading: false,
          error: null,
        });
      } catch {
        if (!cancelled) {
          setState(EMPTY_ERROR_STATE('Failed to load collection.'));
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [isAvailable, token, reloadKey]);

  const refresh = useCallback(() => {
    setReloadKey((prev) => prev + 1);
  }, []);

  return { ...state, refresh };
}
