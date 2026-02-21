import { Link } from 'react-router';
import { CollectionsSettingsPanel } from '../../components/lab/CollectionsSettingsPanel';
import { labFranchises, labSets } from './collectionsV2.mock';
import { useCollectionsSettings } from './useCollectionsSettings';

export function CollectionsSettingsPage() {
  const { settings, setCollectionEnabled, setSetVisibility } = useCollectionsSettings();

  return (
    <div className="app-container-padded py-6 sm:py-8 min-h-screen">
      <div className="rounded-2xl border border-surface-border bg-white p-4 sm:p-6">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">Collections</h1>
            <p className="mt-1 text-sm text-neutral-500">
              Turn collections on/off and control which sets are visible in collection tabs.
            </p>
          </div>
          <Link
            to="/lab/collections-v2"
            className="shrink-0 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Back to demo
          </Link>
        </div>

        <CollectionsSettingsPanel
          franchises={labFranchises}
          sets={labSets}
          value={settings}
          onCollectionToggle={setCollectionEnabled}
          onSetToggle={setSetVisibility}
        />
      </div>
    </div>
  );
}
