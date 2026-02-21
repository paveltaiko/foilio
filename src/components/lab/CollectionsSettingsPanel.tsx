import type { CollectionSettings } from '../../pages/lab/collectionsSettings';
import type { LabFranchise, LabSet } from '../../pages/lab/collectionsV2.mock';
import { Checkbox } from '../ui/Checkbox';

interface CollectionsSettingsPanelProps {
  franchises: LabFranchise[];
  sets: LabSet[];
  value: CollectionSettings;
  onCollectionToggle: (franchiseId: LabFranchise['id'], enabled: boolean) => void;
  onSetToggle: (franchiseId: LabFranchise['id'], setId: string, visible: boolean) => void;
}

export function CollectionsSettingsPanel({
  franchises,
  sets,
  value,
  onCollectionToggle,
  onSetToggle,
}: CollectionsSettingsPanelProps) {
  return (
    <div>
      {franchises.map((franchise) => {
        const collection = value.collections[franchise.id];
        const franchiseSets = sets
          .filter((set) => set.franchiseId === franchise.id)
          .sort((a, b) => a.order - b.order);

        return (
          <section key={franchise.id} className="py-5 first:pt-0 last:pb-0">
            <div className={`flex items-center justify-between gap-3 rounded-xl pl-4 pr-3 py-4 transition-colors ${collection.enabled ? 'bg-neutral-100' : 'bg-neutral-50'}`}>
              <h3 className="text-sm font-semibold text-neutral-900">{franchise.name}</h3>

              <button
                type="button"
                onClick={() => onCollectionToggle(franchise.id, !collection.enabled)}
                aria-pressed={collection.enabled}
                className={`relative h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
                  collection.enabled ? 'bg-primary-500' : 'bg-neutral-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    collection.enabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
                <span className="sr-only">Toggle {franchise.name}</span>
              </button>
            </div>

            <div className={`mt-3 divide-y divide-neutral-100 ${collection.enabled ? '' : 'opacity-45'}`}>
              {franchiseSets.map((set) => {
                const checked = collection.setVisibility[set.id] ?? false;

                return (
                  <div key={set.id} className="flex cursor-pointer items-center justify-between pl-4 pr-3 py-2.5 text-sm" onClick={() => collection.enabled && onSetToggle(franchise.id, set.id, !checked)}>
                    <span className="text-neutral-700">
                      {set.name}
                      <span className="ml-2 text-xs text-neutral-400">{set.code}</span>
                    </span>
                    <Checkbox
                      checked={checked}
                      disabled={!collection.enabled}
                      onChange={(value) => onSetToggle(franchise.id, set.id, value)}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
