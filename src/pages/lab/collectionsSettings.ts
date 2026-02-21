import type { LabCard, LabFranchise, LabSet, FranchiseId } from './collectionsV2.mock';

export interface CollectionConfig {
  enabled: boolean;
  setVisibility: Record<string, boolean>;
}

export interface CollectionSettings {
  collections: Record<FranchiseId, CollectionConfig>;
}

export function createDefaultCollectionSettings(
  franchises: LabFranchise[],
  sets: LabSet[]
): CollectionSettings {
  const collections = {} as Record<FranchiseId, CollectionConfig>;

  for (const franchise of franchises) {
    const setVisibility: Record<string, boolean> = {};
    for (const set of sets) {
      if (set.franchiseId === franchise.id) {
        setVisibility[set.id] = false;
      }
    }

    collections[franchise.id] = {
      enabled: false,
      setVisibility,
    };
  }

  return { collections };
}

export function normalizeCollectionSettings(
  value: unknown,
  franchises: LabFranchise[],
  sets: LabSet[]
): CollectionSettings {
  const defaults = createDefaultCollectionSettings(franchises, sets);

  if (!value || typeof value !== 'object') {
    return defaults;
  }

  const source = (value as { collections?: unknown }).collections;
  if (!source || typeof source !== 'object') {
    return defaults;
  }

  const sourceCollections = source as Record<string, unknown>;

  for (const franchise of franchises) {
    const rawCollection = sourceCollections[franchise.id];
    if (!rawCollection || typeof rawCollection !== 'object') {
      continue;
    }

    const rawEnabled = (rawCollection as { enabled?: unknown }).enabled;
    const rawSetVisibility = (rawCollection as { setVisibility?: unknown }).setVisibility;

    defaults.collections[franchise.id].enabled = typeof rawEnabled === 'boolean' ? rawEnabled : false;

    if (!rawSetVisibility || typeof rawSetVisibility !== 'object') {
      continue;
    }

    const visibilityRecord = rawSetVisibility as Record<string, unknown>;
    const target = defaults.collections[franchise.id].setVisibility;

    for (const setId of Object.keys(target)) {
      const rawValue = visibilityRecord[setId];
      target[setId] = typeof rawValue === 'boolean' ? rawValue : false;
    }
  }

  return defaults;
}

export function getVisibleSets(settings: CollectionSettings, sets: LabSet[]): LabSet[] {
  return sets.filter((set) => {
    const collection = settings.collections[set.franchiseId];
    return collection?.enabled && collection.setVisibility[set.id];
  });
}

export function getVisibleCards(settings: CollectionSettings, sets: LabSet[], cards: LabCard[]): LabCard[] {
  const visibleSetIds = new Set(getVisibleSets(settings, sets).map((set) => set.id));
  return cards.filter((card) => visibleSetIds.has(card.setId));
}

export function isActiveTabValid(activeSetId: string, visibleSets: LabSet[]): boolean {
  if (activeSetId === 'all') return true;
  return visibleSets.some((set) => set.id === activeSetId);
}
