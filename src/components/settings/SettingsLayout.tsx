import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';
import type { ReactNode } from 'react';

interface SettingsLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function SettingsLayout({ title, description, children }: SettingsLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="app-container-padded py-3 sm:py-4 min-h-screen">
      <div className="mb-4 flex items-center gap-2 sm:mb-5">
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 cursor-pointer"
          aria-label="Back to Settings"
          title="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">{title}</h1>
      </div>

      <div className="rounded-2xl border border-surface-border bg-white p-4 sm:p-6">
        {description && (
          <p className="mb-5 text-sm text-neutral-500">{description}</p>
        )}
        {children}
      </div>
    </div>
  );
}
