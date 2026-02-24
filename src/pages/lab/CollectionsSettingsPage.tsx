import { CollectionsSettingsPanel } from '../../components/lab/CollectionsSettingsPanel';
import { franchises, collectionSets } from '../../config/collections';
import { useCollectionsSettings } from './useCollectionsSettings';

export function CollectionsSettingsPage() {
  const { settings, setCollectionEnabled, setSetVisibility } = useCollectionsSettings();

  return (
    <div className="app-container-padded py-3 sm:py-4 min-h-screen">
      <div className="mb-4 sm:mb-5">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">Settings</h1>
      </div>

      <div className="rounded-2xl border border-surface-border bg-white p-4 sm:p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">Collections</h2>
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
