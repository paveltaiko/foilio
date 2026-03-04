import type { CollectionSettings } from '../../utils/collectionsSettings';
import type { Franchise, CollectionSet, FranchiseId } from '../../config/collections';
import { Toggle } from '../ui/Toggle';

interface CollectionsSettingsPanelProps {
  franchises: Franchise[];
  sets: CollectionSet[];
  value: CollectionSettings;
  onCollectionToggle: (franchiseId: FranchiseId, enabled: boolean) => void;
  onSetToggle: (franchiseId: FranchiseId, setId: string, visible: boolean) => void;
}

export function CollectionsSettingsPanel({
  franchises,
  sets,
  value,
  onCollectionToggle,
  onSetToggle,
}: CollectionsSettingsPanelProps) {
  const renderCard = (franchise: Franchise) => {
    const collection = value.collections[franchise.id] ?? { enabled: false, setVisibility: {} };
    const franchiseSets = sets
      .filter((set) => set.franchiseId === franchise.id)
      .sort((a, b) => a.order - b.order);

    return (
      <section key={franchise.id} className="flex flex-col rounded-xl border border-neutral-200 overflow-hidden">
        <div className={`flex items-center justify-between gap-3 pl-4 pr-3 py-4 transition-colors ${collection.enabled ? 'bg-neutral-100' : 'bg-neutral-50'}`}>
          <h3 className="text-sm font-semibold text-neutral-900">{franchise.name}</h3>
          <Toggle
            checked={collection.enabled}
            onChange={(enabled) => onCollectionToggle(franchise.id, enabled)}
            label={`Toggle ${franchise.name}`}
          />
        </div>
        {collection.enabled && (
          <div className="divide-y divide-neutral-100">
            {franchiseSets.map((set) => {
              const checked = collection.setVisibility[set.id] ?? false;
              return (
                <div
                  key={set.id}
                  className="flex cursor-pointer items-center justify-between pl-4 pr-3 py-2.5 text-sm"
                  role="button"
                  tabIndex={0}
                  onClick={() => onSetToggle(franchise.id, set.id, !checked)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSetToggle(franchise.id, set.id, !checked); } }}
                >
                  <span className="text-neutral-700">
                    {set.name}
                    <span className="ml-2 text-xs text-neutral-400">{set.code}</span>
                  </span>
                  <Toggle
                    checked={checked}
                    onChange={(visible) => onSetToggle(franchise.id, set.id, visible)}
                    color="neutral"
                    stopPropagation
                  />
                </div>
              );
            })}
          </div>
        )}
      </section>
    );
  };

  const half = Math.ceil(franchises.length / 2);
  const leftCol = franchises.slice(0, half);
  const rightCol = franchises.slice(half);

  return (
    <>
      {/* Mobile: jeden sloupec */}
      <div className="flex flex-col gap-3 sm:hidden">
        {franchises.map(renderCard)}
      </div>
      {/* Desktop: dva sloupce */}
      <div className="hidden sm:flex gap-3 items-start">
        <div className="flex flex-col gap-3 flex-1">
          {leftCol.map(renderCard)}
        </div>
        <div className="flex flex-col gap-3 flex-1">
          {rightCol.map(renderCard)}
        </div>
      </div>
    </>
  );
}
