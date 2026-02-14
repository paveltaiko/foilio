import { Tabs } from '../ui/Tabs';
import type { SetCode } from '../../types/card';

interface SetTabsProps {
  activeSet: SetCode;
  onChange: (set: SetCode) => void;
  cardCounts?: Record<SetCode, number>;
}

const SET_NAMES: Record<SetCode, string> = {
  spm: 'Spider-Man',
  spe: 'Eternal',
  mar: 'Marvel Universe',
};

export function SetTabs({ activeSet, onChange, cardCounts }: SetTabsProps) {
  const tabs = (['spm', 'spe', 'mar'] as const).map((code) => ({
    id: code,
    label: SET_NAMES[code],
    count: cardCounts?.[code],
  }));

  return (
    <Tabs
      tabs={tabs}
      activeTab={activeSet}
      onChange={(id) => onChange(id as SetCode)}
    />
  );
}
