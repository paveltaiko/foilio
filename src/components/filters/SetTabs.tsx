import { Tabs } from '../ui/Tabs';
import type { SetCode } from '../../types/card';

interface SetTabsProps {
  activeSet: SetCode;
  onChange: (set: SetCode) => void;
  cardCounts?: Record<SetCode, number>;
  visibleSets?: SetCode[];
}

const SET_NAMES: Record<SetCode, string> = {
  all: 'Full Collection',
  spm: "Marvel's Spider-Man",
  spe: "Marvel's Spider-Man Eternal",
  mar: 'Marvel Universe',
};

const SET_CODES: SetCode[] = ['all', 'spm', 'spe', 'mar'];

export function SetTabs({ activeSet, onChange, cardCounts, visibleSets }: SetTabsProps) {
  const allowedSets = visibleSets
    ? (['all', ...visibleSets] as SetCode[])
    : SET_CODES;

  const tabs = allowedSets.map((setCode) => ({
    id: setCode,
    label: SET_NAMES[setCode],
    count: cardCounts?.[setCode],
  }));

  return (
    <Tabs
      tabs={tabs}
      activeTab={activeSet}
      onChange={(id) => onChange(id as SetCode)}
    />
  );
}
