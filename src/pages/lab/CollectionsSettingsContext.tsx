import { useMemo, useState, type ReactNode } from 'react';
import { franchises, collectionSets } from '../../config/collections';
import {
  createDefaultCollectionSettings,
  normalizeCollectionSettings,
  type CollectionSettings,
} from './collectionsSettings';
import { CollectionsSettingsContext, type CollectionsSettingsContextValue } from './CollectionsSettingsStore';

const STORAGE_KEY = 'foilio-collections-settings-v1';

function loadInitialSettings(): CollectionSettings {
  const defaults = createDefaultCollectionSettings(franchises, collectionSets);

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;

    const parsed = JSON.parse(raw) as unknown;
    return normalizeCollectionSettings(parsed, franchises, collectionSets);
  } catch {
    return defaults;
  }
}

export function CollectionsSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<CollectionSettings>(loadInitialSettings);

  const persist = (next: CollectionSettings) => {
    setSettings(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
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
  }), [settings]);

  return (
    <CollectionsSettingsContext.Provider value={value}>
      {children}
    </CollectionsSettingsContext.Provider>
  );
}
