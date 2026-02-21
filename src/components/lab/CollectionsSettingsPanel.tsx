import type { CollectionSettings } from '../../pages/lab/collectionsSettings';
import type { Franchise, CollectionSet, FranchiseId } from '../../config/collections';

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
        {collection.enabled && (
          <div className="divide-y divide-neutral-100">
            {franchiseSets.map((set) => {
              const checked = collection.setVisibility[set.id] ?? false;
              return (
                <div
                  key={set.id}
                  className="flex cursor-pointer items-center justify-between pl-4 pr-3 py-2.5 text-sm"
                  onClick={() => onSetToggle(franchise.id, set.id, !checked)}
                >
                  <span className="text-neutral-700">
                    {set.name}
                    <span className="ml-2 text-xs text-neutral-400">{set.code}</span>
                  </span>
                  <button
                    type="button"
                    aria-pressed={checked}
                    onClick={(e) => { e.stopPropagation(); onSetToggle(franchise.id, set.id, !checked); }}
                    className={`relative h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
                      checked ? 'bg-neutral-700' : 'bg-neutral-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                        checked ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
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
