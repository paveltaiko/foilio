import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import type { LucideIcon } from 'lucide-react';

interface SettingsMenuItemProps {
  icon: LucideIcon;
  label: string;
  description?: string;
  href: string;
  badge?: number;
}

export function SettingsMenuItem({ icon: Icon, label, description, href, badge }: SettingsMenuItemProps) {
  return (
    <Link
      to={href}
      className="flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-neutral-50 active:bg-neutral-100"
    >
      <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-red-50 text-primary-500">
        <Icon className="h-5 w-5" strokeWidth={2.5} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-neutral-900">{label}</p>
        {description && <p className="mt-0.5 text-xs text-neutral-400 leading-snug">{description}</p>}
      </div>

      {badge !== undefined && (
        <span className="shrink-0 min-w-[20px] text-center px-1.5 py-0.5 text-xs font-semibold bg-primary-50 text-primary-600 rounded-full">
          {badge}
        </span>
      )}

      <ChevronRight className="h-5 w-5 shrink-0 text-neutral-600" strokeWidth={2.5} />
    </Link>
  );
}
