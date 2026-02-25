import type { SecretLairDrop } from '../../config/secretLairDrops';

interface SecretLairSettingsPanelProps {
  drops: SecretLairDrop[];
  enabledDropIds: Set<string>;
  onToggle: (dropId: string, enabled: boolean) => void;
}

export function SecretLairSettingsPanel({
  drops,
  enabledDropIds,
  onToggle,
}: SecretLairSettingsPanelProps) {
  const renderCard = (drop: SecretLairDrop) => {
    const enabled = enabledDropIds.has(drop.id);
    return (
      <section key={drop.id} className="flex flex-col rounded-xl border border-neutral-200 overflow-hidden">
        <div
          className={`flex items-center justify-between gap-3 pl-4 pr-3 py-4 cursor-pointer transition-colors ${enabled ? 'bg-neutral-100' : 'bg-neutral-50'}`}
          onClick={() => onToggle(drop.id, !enabled)}
        >
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">{drop.name}</h3>
            <p className="text-xs text-neutral-400 mt-0.5">{drop.ip}</p>
          </div>
          <button
            type="button"
            aria-pressed={enabled}
            onClick={(e) => { e.stopPropagation(); onToggle(drop.id, !enabled); }}
            className={`relative h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
              enabled ? 'bg-primary-500' : 'bg-neutral-300'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                enabled ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
            <span className="sr-only">Toggle {drop.name}</span>
          </button>
        </div>
      </section>
    );
  };

  const half = Math.ceil(drops.length / 2);
  const leftCol = drops.slice(0, half);
  const rightCol = drops.slice(half);

  return (
    <>
      {/* Mobile: jeden sloupec */}
      <div className="flex flex-col gap-3 sm:hidden">
        {drops.map(renderCard)}
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
