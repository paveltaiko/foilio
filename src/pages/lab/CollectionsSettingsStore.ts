import { createContext } from 'react';
import type { FranchiseId } from './collectionsV2.mock';
import type { CollectionSettings } from './collectionsSettings';

export interface CollectionsSettingsContextValue {
  settings: CollectionSettings;
  setCollectionEnabled: (franchiseId: FranchiseId, enabled: boolean) => void;
  setSetVisibility: (franchiseId: FranchiseId, setId: string, visible: boolean) => void;
}

export const CollectionsSettingsContext = createContext<CollectionsSettingsContextValue | null>(null);
