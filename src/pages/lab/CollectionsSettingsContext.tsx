import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { franchises, collectionSets } from '../../config/collections';
import { isFirebaseConfigured } from '../../config/firebase';
import { subscribeToCollectionSettings, saveCollectionSettings } from '../../services/firestore';
import {
  createDefaultCollectionSettings,
  normalizeCollectionSettings,
  type CollectionSettings,
} from './collectionsSettings';
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

  useEffect(() => {
    if (!userId || !isFirebaseConfigured) return;

    const unsubscribe = subscribeToCollectionSettings(userId, (raw) => {
      if (raw === null) {
        // Firestore nemá data — migruj z localStorage pokud existuje
        const localRaw = window.localStorage.getItem(STORAGE_KEY);
        if (localRaw) {
          const local = loadFromLocalStorage();
          saveCollectionSettings(userId, local as unknown as Record<string, unknown>).catch((err) => {
            console.error('[CollectionsSettings] Migrace z localStorage selhala:', err);
          });
          setSettings(local);
        } else {
          setSettings(createDefaultCollectionSettings(franchises, collectionSets));
        }
      } else {
        setSettings(normalizeCollectionSettings(raw, franchises, collectionSets));
      }
    });

    return unsubscribe;
  }, [userId]);

  const persist = (next: CollectionSettings) => {
    setSettings(next); // okamžitá optimistická aktualizace

    if (isFirebaseConfigured && userId) {
      saveCollectionSettings(userId, next as unknown as Record<string, unknown>).catch((err) => {
        console.error('[CollectionsSettings] Uložení do Firestore selhalo:', err);
      });
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  };

  const value = useMemo<CollectionsSettingsContextValue>(() => ({
    settings,
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [settings, userId]);

  return (
    <CollectionsSettingsContext.Provider value={value}>
      {children}
    </CollectionsSettingsContext.Provider>
  );
}
