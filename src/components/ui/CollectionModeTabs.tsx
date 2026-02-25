export type CollectionMode = 'ub' | 'secret-lair' | 'custom';

interface CollectionModeTabsProps {
  activeMode: CollectionMode;
  onChange: (mode: CollectionMode) => void;
}

const MODES: Array<{ id: CollectionMode; label: string }> = [
  { id: 'ub',           label: 'Universes Beyond' },
  { id: 'secret-lair',  label: 'Secret Lair'      },
  { id: 'custom',       label: 'Custom'            },
];

export function CollectionModeTabs({ activeMode, onChange }: CollectionModeTabsProps) {
  return (
    <div className="flex gap-0 border-b border-neutral-200">
      {MODES.map((mode) => (
        <button
          key={mode.id}
          onClick={() => mode.id !== 'custom' && onChange(mode.id)}
          disabled={mode.id === 'custom'}
          className={[
            'px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors',
            mode.id === 'custom' ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer',
            activeMode === mode.id
              ? 'text-primary-500 border-primary-500'
              : 'text-neutral-500 border-transparent hover:text-neutral-700',
          ].join(' ')}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}
