import type { ReactNode } from 'react';
import { Tabs } from '../ui/Tabs';
import type { SecretLairDrop } from '../../config/secretLairDrops';

interface SecretLairDropTabsProps {
  activeDrop: string;
  onChange: (dropId: string) => void;
  drops: SecretLairDrop[];
  cardCounts?: Record<string, number>;
  prefix?: ReactNode;
}

export function SecretLairDropTabs({ activeDrop, onChange, drops, cardCounts, prefix }: SecretLairDropTabsProps) {
  const tabs = [
    { id: 'all', label: 'All Drops', count: cardCounts?.['all'] },
    ...drops.map((drop) => ({
      id: drop.id,
      label: drop.name,
      count: cardCounts?.[drop.id],
    })),
  ];

  return (
    <Tabs
      tabs={tabs}
      activeTab={activeDrop}
      onChange={onChange}
      prefix={prefix}
    />
  );
}
