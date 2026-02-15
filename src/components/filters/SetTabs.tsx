import { Tabs } from '../ui/Tabs';
import type { SetCode } from '../../types/card';

interface SetTabsProps {
  activeSet: SetCode;
  onChange: (set: SetCode) => void;
  cardCounts?: Record<SetCode, number>;
}

const SET_NAMES: Record<SetCode, string> = {
  all: 'Full Collection',
  spm: "Marvel's Spider-Man",
  spe: "Marvel's Spider-Man Eternal",
  mar: 'Marvel Universe',
};

export function SetTabs({ activeSet, onChange, cardCounts }: SetTabsProps) {
  const tabs = (Object.keys(SET_NAMES) as SetCode[]).map((setCode) => ({
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
