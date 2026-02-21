import { Tabs } from '../ui/Tabs';
import type { CollectionSet } from '../../config/collections';

interface SetTabsProps {
  activeSet: string;
  onChange: (set: string) => void;
  sets: CollectionSet[];
  cardCounts?: Record<string, number>;
  visibleSets?: string[];
}

export function SetTabs({ activeSet, onChange, sets, cardCounts, visibleSets }: SetTabsProps) {
  const allowedSetIds = visibleSets ? visibleSets : sets.map((s) => s.id);

  const tabs = [
    { id: 'all', label: 'Full Collection', count: cardCounts?.['all'] },
    ...allowedSetIds.map((setId) => {
      const set = sets.find((s) => s.id === setId);
      return {
        id: setId,
        label: set?.name ?? setId,
        count: cardCounts?.[setId],
      };
    }),
  ];

  return (
    <Tabs
      tabs={tabs}
      activeTab={activeSet}
      onChange={onChange}
    />
  );
}
