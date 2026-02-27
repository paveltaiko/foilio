import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';

export type CollectionMode = 'ub' | 'secret-lair' | 'custom';

interface CollectionModeTabsProps {
  activeMode: CollectionMode;
  onChange: (mode: CollectionMode) => void;
}

const MODES: Array<{ id: CollectionMode; label: string; disabled?: boolean }> = [
  { id: 'ub',          label: 'Universes Beyond' },
  { id: 'secret-lair', label: 'Secret Lair'      },
  { id: 'custom',      label: 'Custom', disabled: true },
];

export function CollectionModeTabs({ activeMode, onChange }: CollectionModeTabsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const activeLabel = MODES.find((m) => m.id === activeMode)?.label;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleSelect = useCallback((mode: CollectionMode) => {
    onChange(mode);
    setIsOpen(false);
  }, [onChange]);

  return (
    <>
      {/* Mobile: dropdown */}
      <div className="md:hidden">
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setIsOpen((o) => !o)}
            className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-white border border-surface-border rounded-lg text-sm font-semibold text-neutral-800 hover:bg-neutral-50 transition-colors cursor-pointer"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
          >
            <span>{activeLabel}</span>
            <ChevronDown
              className={`w-5 h-5 text-neutral-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              strokeWidth={2.5}
            />
          </button>

          {isOpen && (
            <div
              className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-surface-border rounded-lg shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
              role="listbox"
            >
              {MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => !mode.disabled && handleSelect(mode.id)}
                  disabled={mode.disabled}
                  className={`
                    w-full flex items-center px-4 py-3 text-sm font-semibold transition-colors cursor-pointer
                    ${mode.disabled ? 'opacity-40 cursor-not-allowed' : ''}
                    ${!mode.disabled && activeMode === mode.id
                      ? 'bg-primary-50 text-primary-600'
                      : !mode.disabled
                        ? 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
                        : 'text-neutral-500'
                    }
                  `}
                  role="option"
                  aria-selected={activeMode === mode.id}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Desktop: taby */}
      <div className="hidden md:flex gap-0 border-b border-neutral-200">
        {MODES.map((mode) => (
          <button
            key={mode.id}
            onClick={() => !mode.disabled && onChange(mode.id)}
            disabled={mode.disabled}
            className={[
              'px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors',
              mode.disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer',
              activeMode === mode.id
                ? 'text-primary-500 border-primary-500'
                : 'text-neutral-500 border-transparent hover:text-neutral-700',
            ].join(' ')}
          >
            {mode.label}
          </button>
        ))}
      </div>
    </>
  );
}
