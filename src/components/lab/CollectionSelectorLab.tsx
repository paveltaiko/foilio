import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import type { FranchiseId, LabFranchise } from '../../pages/lab/collectionsV2.mock';

interface CollectionSelectorLabProps {
  franchises: LabFranchise[];
  selectedFranchises: FranchiseId[];
  onChange: (next: FranchiseId[]) => void;
}

export function CollectionSelectorLab({
  franchises,
  selectedFranchises,
  onChange,
}: CollectionSelectorLabProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onMouseDown(event: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return franchises;
    return franchises.filter((fr) => fr.name.toLowerCase().includes(q));
  }, [franchises, query]);

  const selectedSet = new Set(selectedFranchises);
  const visibleChips = selectedFranchises.slice(0, 2);
  const hiddenCount = Math.max(0, selectedFranchises.length - visibleChips.length);

  const toggleFranchise = (id: FranchiseId) => {
    const next = selectedSet.has(id)
      ? selectedFranchises.filter((item) => item !== id)
      : [...selectedFranchises, id];

    onChange(next.length > 0 ? next : ['spider-man']);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-lg border border-surface-border bg-white px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span>Collections ({selectedFranchises.length})</span>
          <ChevronDown className={`h-4 w-4 text-neutral-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        <div className="flex items-center gap-1.5 flex-wrap">
          {visibleChips.map((id) => {
            const franchise = franchises.find((item) => item.id === id);
            if (!franchise) return null;

            return (
              <span
                key={id}
                className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${franchise.accentClass}`}
              >
                {franchise.shortName}
              </span>
            );
          })}
          {hiddenCount > 0 && (
            <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-600">
              +{hiddenCount}
            </span>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 z-30 mt-2 rounded-xl border border-surface-border bg-white p-3 shadow-xl">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search collections..."
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-800 outline-none focus:border-primary-300"
          />

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onChange(franchises.map((item) => item.id))}
              className="rounded-md border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={() => onChange(['spider-man'])}
              className="rounded-md border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Only Spider-Man
            </button>
            <button
              type="button"
              onClick={() => onChange(['spider-man'])}
              className="rounded-md border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Clear
            </button>
          </div>

          <div className="mt-3 max-h-60 overflow-y-auto rounded-lg border border-neutral-100">
            {filtered.map((franchise) => {
              const isChecked = selectedSet.has(franchise.id);

              return (
                <button
                  key={franchise.id}
                  type="button"
                  onClick={() => toggleFranchise(franchise.id)}
                  className="flex w-full items-center justify-between border-b border-neutral-100 px-3 py-2.5 text-left text-sm text-neutral-800 last:border-b-0 hover:bg-neutral-50"
                  role="option"
                  aria-selected={isChecked}
                >
                  <span>{franchise.name}</span>
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-md border ${
                      isChecked
                        ? 'border-primary-500 bg-primary-500 text-white'
                        : 'border-neutral-300 bg-white text-transparent'
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </span>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="px-3 py-6 text-center text-sm text-neutral-500">
                No collection found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
