import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { franchises, collectionSets } from '../config/collections';
import { isFirebaseConfigured } from '../config/firebase';
import { subscribeToCollectionSettings, saveCollectionSettings } from '../services/firestore';
import {
  createDefaultCollectionSettings,
  normalizeCollectionSettings,
  type CollectionSettings,
} from '../utils/collectionsSettings';
import { CollectionsSettingsContext, type CollectionsSettingsContextValue } from './CollectionsSettingsStore';

const STORAGE_KEY = 'foilio-collections-settings-v1';

function loadFromLocalStorage(): CollectionSettings {
  const defaults = createDefaultCollectionSettings(franchises, collectionSets);
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    return normalizeCollectionSettings(JSON.parse(raw) as unknown, franchises, collectionSets);
  } catch {
    return defaults;
  }
}

interface CollectionsSettingsProviderProps {
  userId: string | null;
  children: ReactNode;
}

export function CollectionsSettingsProvider({ userId, children }: CollectionsSettingsProviderProps) {
  const [settings, setSettings] = useState<CollectionSettings>(() =>
    isFirebaseConfigured
      ? createDefaultCollectionSettings(franchises, collectionSets)
      : loadFromLocalStorage()
  );
  // Firebase: wait for first Firestore response before showing empty state
  const [isLoading, setIsLoading] = useState(isFirebaseConfigured && !!userId);

  useEffect(() => {
    if (!userId || !isFirebaseConfigured) return;

    setIsLoading(true);
    const unsubscribe = subscribeToCollectionSettings(userId, (raw) => {
      if (raw === null) {
        // Firestore has no data — migrate from localStorage if available
        const localRaw = window.localStorage.getItem(STORAGE_KEY);
        if (localRaw) {
          const local = loadFromLocalStorage();
          saveCollectionSettings(userId, local as unknown as Record<string, unknown>).catch((err) => {
            console.error('[CollectionsSettings] localStorage migration failed:', err);
          });
          setSettings(local);
        } else {
          setSettings(createDefaultCollectionSettings(franchises, collectionSets));
        }
      } else {
        setSettings(normalizeCollectionSettings(raw, franchises, collectionSets));
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, [userId]);

  const persist = useCallback((next: CollectionSettings) => {
    setSettings(next); // immediate optimistic update

    if (isFirebaseConfigured && userId) {
      saveCollectionSettings(userId, next as unknown as Record<string, unknown>).catch((err) => {
        console.error('[CollectionsSettings] Failed to save to Firestore:', err);
      });
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  }, [userId]);

  const value = useMemo<CollectionsSettingsContextValue>(() => ({
    settings,
    isLoading,
    setCollectionEnabled: (franchiseId, enabled) => {
      const current = settings.collections[franchiseId];
      const setVisibility = enabled
        ? Object.fromEntries(Object.keys(current.setVisibility).map((id) => [id, true]))
        : current.setVisibility;
      const next: CollectionSettings = {
        collections: {
          ...settings.collections,
          [franchiseId]: { ...current, enabled, setVisibility },
        },
      };
      persist(next);
    },
    setSetVisibility: (franchiseId, setId, visible) => {
      const current = settings.collections[franchiseId];
      const next: CollectionSettings = {
        collections: {
          ...settings.collections,
          [franchiseId]: {
            ...current,
            setVisibility: {
              ...current.setVisibility,
              [setId]: visible,
            },
          },
        },
      };
      persist(next);
    },
  }), [settings, isLoading, persist]);

  return (
    <CollectionsSettingsContext.Provider value={value}>
      {children}
    </CollectionsSettingsContext.Provider>
  );
}
