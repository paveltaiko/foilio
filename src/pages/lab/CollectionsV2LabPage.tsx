import { useMemo, useState } from 'react';
import { FlaskConical } from 'lucide-react';
import { SetTabsOverflowLab } from '../../components/lab/SetTabsOverflowLab';
import { Link } from 'react-router';
import { labCards, labFranchises, labSets } from './collectionsV2.mock';
import { useCollectionsSettings } from './useCollectionsSettings';
import { getVisibleCards, getVisibleSets, isActiveTabValid } from './collectionsSettings';
import type { CollectionSet } from '../../config/collections';

const labSetsAsCollectionSets = labSets as unknown as CollectionSet[];

function rarityClass(rarity: string): string {
  if (rarity === 'mythic') return 'text-orange-600';
  if (rarity === 'rare') return 'text-yellow-700';
  if (rarity === 'uncommon') return 'text-blue-700';
  return 'text-neutral-500';
}

export function CollectionsV2LabPage() {
  const { settings } = useCollectionsSettings();
  const [activeSetId, setActiveSetId] = useState<string>('all');

  const visibleSets = useMemo(() => getVisibleSets(settings, labSetsAsCollectionSets), [settings]);
  const effectiveActiveSetId = isActiveTabValid(activeSetId, visibleSets) ? activeSetId : 'all';

  const cardsInScope = useMemo(() => {
    if (effectiveActiveSetId === 'all') {
      return getVisibleCards(settings, labSetsAsCollectionSets, labCards);
    }

    return labCards.filter((item) => item.setId === effectiveActiveSetId);
  }, [effectiveActiveSetId, settings]);

  const setMeta = useMemo(() => {
    const bySet: Record<string, { total: number; owned: number }> = {};

    for (const set of visibleSets) {
      const setCards = labCards.filter((card) => card.setId === set.id);
      bySet[set.id] = {
        total: setCards.length,
        owned: setCards.filter((card) => card.owned).length,
      };
    }

    return bySet;
  }, [visibleSets]);

  const totalOwned = cardsInScope.filter((card: typeof labCards[number]) => card.owned).length;

  return (
    <div className="app-container-padded py-4 sm:py-6">
      <div className="rounded-2xl border border-surface-border bg-[linear-gradient(145deg,#ffffff_0%,#f7f7f8_100%)] p-4 sm:p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-600">
              <FlaskConical className="h-3.5 w-3.5" />
              Lab Route
            </p>
            <h1 className="mt-2 text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">
              Collections V2 Demo
            </h1>
            <p className="mt-1 text-sm text-neutral-600">
              Isolated UX shell for multi-collection selection and set-tab overflow behavior.
            </p>
          </div>
          <code className="rounded-md bg-neutral-900 px-2 py-1 text-[11px] text-neutral-100">/lab/collections-v2</code>
        </div>

        <div className="space-y-4">
          <SetTabsOverflowLab
            sets={visibleSets}
            activeSetId={effectiveActiveSetId}
            onChange={setActiveSetId}
            setMeta={setMeta}
          />

          {visibleSets.length === 0 && (
            <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-600">
              No active sets are enabled. Open{' '}
              <Link to="/settings" className="font-semibold text-primary-600 hover:text-primary-700">
                Settings
              </Link>{' '}
              and enable at least one collection and set.
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-neutral-200 bg-white p-3">
              <p className="text-xs uppercase tracking-wide text-neutral-500">Cards in scope</p>
              <p className="mt-1 text-2xl font-bold text-neutral-900">{cardsInScope.length}</p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-3">
              <p className="text-xs uppercase tracking-wide text-neutral-500">Owned</p>
              <p className="mt-1 text-2xl font-bold text-neutral-900">{totalOwned}</p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-3">
              <p className="text-xs uppercase tracking-wide text-neutral-500">Completion</p>
              <p className="mt-1 text-2xl font-bold text-neutral-900">
                {cardsInScope.length > 0 ? Math.round((totalOwned / cardsInScope.length) * 100) : 0}%
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-3">
            <p className="mb-3 text-sm font-semibold text-neutral-800">Mock Card Grid</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {cardsInScope.map((card: typeof labCards[number]) => {
                const set = labSets.find((item) => item.id === card.setId);
                const franchise = labFranchises.find((item) => item.id === card.franchiseId);

                return (
                  <article key={card.id} className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="line-clamp-1 text-sm font-semibold text-neutral-900">{card.name}</p>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-neutral-600 border border-neutral-200">
                        {set?.code ?? 'SET'}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-neutral-500">{franchise?.name ?? 'Unknown'}</span>
                      <span className={`font-semibold uppercase ${rarityClass(card.rarity)}`}>{card.rarity}</span>
                    </div>
                    <div className="mt-3 inline-flex rounded-md px-2 py-1 text-[11px] font-semibold border border-neutral-200 bg-white text-neutral-700">
                      {card.owned ? 'Owned' : 'Missing'}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
