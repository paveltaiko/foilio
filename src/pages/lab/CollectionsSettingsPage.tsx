import { CollectionsSettingsPanel } from '../../components/lab/CollectionsSettingsPanel';
import { franchises, collectionSets } from '../../config/collections';
import { useCollectionsSettings } from './useCollectionsSettings';

export function CollectionsSettingsPage() {
  const { settings, setCollectionEnabled, setSetVisibility } = useCollectionsSettings();

  return (
    <div className="app-container-padded py-6 sm:py-8 min-h-screen">
      <div className="rounded-2xl border border-surface-border bg-white p-4 sm:p-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">Collections</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Turn collections on/off and control which sets are visible in collection tabs.
          </p>
        </div>

        <CollectionsSettingsPanel
          franchises={franchises}
          sets={collectionSets}
          value={settings}
          onCollectionToggle={setCollectionEnabled}
          onSetToggle={setSetVisibility}
        />
      </div>
    </div>
  );
}
