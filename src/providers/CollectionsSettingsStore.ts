import { createContext } from 'react';
import type { FranchiseId } from '../config/collections';
import type { CollectionSettings } from '../utils/collectionsSettings';

export interface CollectionsSettingsContextValue {
  settings: CollectionSettings;
  isLoading: boolean;
  setCollectionEnabled: (franchiseId: FranchiseId, enabled: boolean) => void;
  setSetVisibility: (franchiseId: FranchiseId, setId: string, visible: boolean) => void;
}

export const CollectionsSettingsContext = createContext<CollectionsSettingsContextValue | null>(null);
