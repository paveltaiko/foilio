import { Layers, LifeBuoy, Info } from 'lucide-react';
import { franchises } from '../../config/collections';
import { useCollectionsSettings } from '../../hooks/useCollectionsSettings';
import { SettingsMenuItem } from '../../components/settings/SettingsMenuItem';
import { SectionHeading } from '../../components/ui/SectionHeading';

const COLLECTIONS_SECTIONS = [
  {
    id: 'collections',
    icon: Layers,
    label: 'Collections & Sets',
    description: 'Turn collections on/off and control which sets are visible.',
    href: '/settings/collections',
  },
] as const;

const GENERAL_SECTIONS = [
  {
    id: 'support',
    icon: LifeBuoy,
    label: 'Support',
    description: 'Get help, report a bug or send feedback.',
    href: '/settings/support',
  },
  {
    id: 'about',
    icon: Info,
    label: 'About',
    description: 'App version, Privacy Policy, Terms of Service.',
    href: '/settings/about',
  },
] as const;

export function SettingsPage() {
  const { settings } = useCollectionsSettings();

  const ubActiveCount = franchises.filter((f) => settings.collections[f.id]?.enabled).length;

  const getBadge = (id: string): number | undefined => {
    if (id === 'collections') return ubActiveCount || undefined;
    return undefined;
  };

  return (
    <div className="app-container-padded py-3 sm:py-4 min-h-screen">
      <div className="mb-4 sm:mb-5">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">Settings</h1>
      </div>

      <div className="flex flex-col gap-6">
        <section>
          <SectionHeading className="mb-2 px-1">Collections</SectionHeading>
          <div className="rounded-2xl bg-white overflow-hidden border border-surface-border divide-y divide-neutral-100">
            {COLLECTIONS_SECTIONS.map((section) => (
              <SettingsMenuItem
                key={section.id}
                icon={section.icon}
                label={section.label}
                description={section.description}
                href={section.href}
                badge={getBadge(section.id)}
              />
            ))}
          </div>
        </section>

        <section>
          <SectionHeading className="mb-2 px-1">General</SectionHeading>
          <div className="rounded-2xl bg-white overflow-hidden border border-surface-border divide-y divide-neutral-100">
            {GENERAL_SECTIONS.map((section) => (
              <SettingsMenuItem
                key={section.id}
                icon={section.icon}
                label={section.label}
                description={section.description}
                href={section.href}
                badge={getBadge(section.id)}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
