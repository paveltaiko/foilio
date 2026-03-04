import { memo } from 'react';
import type { OwnershipFilter as OwnershipFilterType } from '../../types/card';
import { SegmentedControl } from '../ui/SegmentedControl';

interface OwnershipFilterProps {
  value: OwnershipFilterType;
  onChange: (filter: OwnershipFilterType) => void;
}

const OPTIONS: { id: OwnershipFilterType; label: string; title: string }[] = [
  { id: 'all', label: 'All', title: 'Show all cards' },
  { id: 'owned', label: 'Owned', title: 'Show only owned cards' },
  { id: 'missing', label: 'Missing', title: 'Show only missing cards' },
];

export const OwnershipFilter = memo(function OwnershipFilter({ value, onChange }: OwnershipFilterProps) {
  return <SegmentedControl options={OPTIONS} value={value} onChange={onChange} />;
});
