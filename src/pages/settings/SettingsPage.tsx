import { Layers, LifeBuoy, Info, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router';
import { franchises } from '../../config/collections';
import { useCollectionsSettings } from '../../hooks/useCollectionsSettings';
import { useAuth } from '../../hooks/useAuth';
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
  const { user, logout, isFirebaseConfigured } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/dashboard');
  };

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

        {isFirebaseConfigured && user && (
          <section>
            <SectionHeading className="mb-2 px-1">Account</SectionHeading>
            <div className="rounded-2xl bg-white overflow-hidden border border-surface-border">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-neutral-50 active:bg-neutral-100 cursor-pointer"
              >
                <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-red-50 text-primary-500">
                  <LogOut className="h-5 w-5" strokeWidth={2.5} />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-sm font-medium text-neutral-900">Sign Out</p>
                  {user.email && <p className="mt-0.5 text-xs text-neutral-400 leading-snug">{user.email}</p>}
                </div>
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
