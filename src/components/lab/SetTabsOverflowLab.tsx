import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { LabSet } from '../../pages/lab/collectionsV2.mock';

interface SetTabMeta {
  total: number;
  owned: number;
}

interface SetTabsOverflowLabProps {
  sets: LabSet[];
  activeSetId: string;
  onChange: (setId: string) => void;
  setMeta: Record<string, SetTabMeta>;
}

function progressPercent(total: number, owned: number): number {
  if (total <= 0) return 0;
  return Math.round((owned / total) * 100);
}

export function SetTabsOverflowLab({ sets, activeSetId, onChange, setMeta }: SetTabsOverflowLabProps) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [maxVisible, setMaxVisible] = useState(5);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const update = () => {
      setMaxVisible(window.innerWidth < 640 ? 3 : 5);
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    function onMouseDown(event: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    }

    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  const { visibleSets, hiddenSets } = useMemo(() => {
    const ordered = [...sets].sort((a, b) => a.order - b.order);
    if (ordered.length <= maxVisible) {
      return { visibleSets: ordered, hiddenSets: [] as LabSet[] };
    }

    const baseVisible = ordered.slice(0, maxVisible);
    const active = ordered.find((item) => item.id === activeSetId);

    if (active && !baseVisible.some((item) => item.id === active.id)) {
      baseVisible[baseVisible.length - 1] = active;
    }

    const visibleIds = new Set(baseVisible.map((item) => item.id));
    const hidden = ordered.filter((item) => !visibleIds.has(item.id));

    return { visibleSets: baseVisible, hiddenSets: hidden };
  }, [sets, activeSetId, maxVisible]);

  return (
    <div ref={wrapperRef} className="relative flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => onChange('all')}
        className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
          activeSetId === 'all'
            ? 'border-primary-500 bg-primary-500 text-white'
            : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
        }`}
      >
        All Sets
      </button>

      {visibleSets.map((set) => {
        const meta = setMeta[set.id] ?? { total: 0, owned: 0 };
        const progress = progressPercent(meta.total, meta.owned);

        return (
          <button
            key={set.id}
            type="button"
            onClick={() => onChange(set.id)}
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeSetId === set.id
                ? 'border-primary-500 bg-primary-500 text-white'
                : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            <span>{set.code}</span>
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${
              activeSetId === set.id ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-600'
            }`}>
              {meta.total}
            </span>
            <span className={`text-[10px] font-bold ${activeSetId === set.id ? 'text-white' : 'text-neutral-500'}`}>
              {progress}%
            </span>
          </button>
        );
      })}

      {hiddenSets.length > 0 && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsMoreOpen((prev) => !prev)}
            className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
            aria-expanded={isMoreOpen}
          >
            +{hiddenSets.length} more
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isMoreOpen ? 'rotate-180' : ''}`} />
          </button>

          {isMoreOpen && (
            <div className="absolute left-0 top-full z-20 mt-2 min-w-56 rounded-xl border border-surface-border bg-white p-2 shadow-xl">
              {hiddenSets.map((set) => {
                const meta = setMeta[set.id] ?? { total: 0, owned: 0 };
                const progress = progressPercent(meta.total, meta.owned);

                return (
                  <button
                    key={set.id}
                    type="button"
                    onClick={() => {
                      onChange(set.id);
                      setIsMoreOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs text-neutral-700 hover:bg-neutral-50"
                  >
                    <span className="font-semibold">{set.name}</span>
                    <span className="ml-2 text-[10px] text-neutral-500">
                      {meta.total} · {progress}%
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
