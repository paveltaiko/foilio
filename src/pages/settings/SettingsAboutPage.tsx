import { FileText, Shield } from 'lucide-react';
import { SettingsLayout } from '../../components/settings/SettingsLayout';
import { SettingsMenuItem } from '../../components/settings/SettingsMenuItem';

const APP_VERSION = '1.0.0';

export function SettingsAboutPage() {
  const currentYear = new Date().getFullYear();

  return (
    <SettingsLayout title="About">
      {/* Description */}
      <p className="mb-6 text-sm text-neutral-600 leading-relaxed">
        Foilio is a collection tracker for Magic: The Gathering crossover cards — Universes Beyond and Secret Lair drops. Track which cards you own, monitor foil and non-foil versions, and see how close you are to completing each set.
      </p>

      {/* Legal links */}
      <div className="rounded-2xl bg-white overflow-hidden border border-surface-border divide-y divide-neutral-100">
        <SettingsMenuItem icon={Shield} label="Privacy Policy" href="/privacy" />
        <SettingsMenuItem icon={FileText} label="Terms of Service" href="/terms" />
      </div>

      {/* Version & Copyright */}
      <div className="mt-6 flex flex-col items-center gap-1">
        <p className="text-xs text-neutral-400">Version {APP_VERSION}</p>
        <p className="text-xs text-neutral-400">© {currentYear} Foilio. All rights reserved.</p>
        <p className="mt-2 text-center text-xs text-neutral-400">
          Wizards of the Coast, Magic: The Gathering, and their logos are trademarks of Wizards of the Coast LLC.
          This app is not affiliated with or endorsed by Wizards of the Coast.
        </p>
      </div>
    </SettingsLayout>
  );
}
