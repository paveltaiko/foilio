import { useContext } from 'react';
import { CollectionsSettingsContext } from '../providers/CollectionsSettingsStore';

export function useCollectionsSettings() {
  const context = useContext(CollectionsSettingsContext);
  if (!context) {
    throw new Error('useCollectionsSettings must be used within CollectionsSettingsProvider');
  }
  return context;
}
