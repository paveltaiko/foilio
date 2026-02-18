import { Tabs } from '../ui/Tabs';
import type { OwnershipFilter as OwnershipFilterType } from '../../types/card';

interface OwnershipFilterProps {
  value: OwnershipFilterType;
  onChange: (filter: OwnershipFilterType) => void;
}

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'owned', label: 'Owned' },
  { id: 'missing', label: 'Missing' },
];

export function OwnershipFilter({ value, onChange }: OwnershipFilterProps) {
  return (
    <div className="w-36 md:w-auto">
      <Tabs
        tabs={TABS}
        activeTab={value}
        onChange={(id) => onChange(id as OwnershipFilterType)}
      />
    </div>
  );
}
