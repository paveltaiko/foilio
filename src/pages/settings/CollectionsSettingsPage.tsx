import { useState } from 'react';
import { CollectionsSettingsPanel } from '../../components/settings/CollectionsSettingsPanel';
import { SecretLairSettingsPanel } from '../../components/settings/SecretLairSettingsPanel';
import { SettingsLayout } from '../../components/settings/SettingsLayout';
import { Tabs } from '../../components/ui/Tabs';
import { franchises, collectionSets } from '../../config/collections';
import { secretLairDrops } from '../../config/secretLairDrops';
import { useCollectionsSettings } from '../../hooks/useCollectionsSettings';
import { useSecretLairDropSettings } from '../../hooks/useSecretLairDropSettings';

export function CollectionsSettingsPage() {
  const { settings, setCollectionEnabled, setSetVisibility } = useCollectionsSettings();
  const { enabledDropIds, toggleDrop } = useSecretLairDropSettings();
  const [activeMode, setActiveMode] = useState('ub');

  const ubActiveCount = franchises.filter((f) => settings.collections[f.id]?.enabled).length;
  const slActiveCount = enabledDropIds.size;

  const modeTabs = [
    { id: 'ub',          label: 'Universes Beyond', count: ubActiveCount || undefined },
    { id: 'secret-lair', label: 'Secret Lair',       count: slActiveCount || undefined },
    { id: 'custom',      label: 'Custom' },
  ];

  return (
    <SettingsLayout
      title="Collections & Sets"
      description="Turn collections on/off and control which sets are visible in collection tabs."
    >
      <Tabs tabs={modeTabs} activeTab={activeMode} onChange={setActiveMode} />

      <div className="mt-5">
        {activeMode === 'ub' && (
          <CollectionsSettingsPanel
            franchises={franchises}
            sets={collectionSets}
            value={settings}
            onCollectionToggle={setCollectionEnabled}
            onSetToggle={setSetVisibility}
          />
        )}

        {activeMode === 'secret-lair' && (
          <SecretLairSettingsPanel
            drops={secretLairDrops}
            enabledDropIds={enabledDropIds}
            onToggle={toggleDrop}
          />
        )}

        {activeMode === 'custom' && (
          <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
            <p className="text-sm font-medium">Custom sets — coming soon</p>
          </div>
        )}
      </div>
    </SettingsLayout>
  );
}
