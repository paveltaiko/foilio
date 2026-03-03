import { LayoutGrid, Search, Settings, Home } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router';

interface BottomNavProps {
  isLoggedIn: boolean;
  onSearchClick?: () => void;
}

interface NavItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
  iconSize?: string;
}

const isStandalone = window.matchMedia('(display-mode: standalone)').matches

function NavItem({ to, icon: Icon, label, iconSize = 'w-5 h-5' }: NavItemProps) {
  return (
    <NavLink to={to}>
      {({ isActive }) => (
        <div className={`flex flex-col items-center justify-center gap-1 rounded-full px-4 h-11 transition-all duration-200 ${isActive ? 'bg-primary-50' : ''}`}>
          <Icon
            className={`${iconSize} shrink-0 transition-colors duration-200 ${isActive ? 'text-primary-500' : 'text-neutral-600'}`}
            strokeWidth={2.2}
          />
          <span className={`text-[10px] font-medium leading-none transition-colors duration-200 ${isActive ? 'text-primary-500' : 'text-neutral-600'}`}>
            {label}
          </span>
        </div>
      )}
    </NavLink>
  );
}

export function BottomNav({ isLoggedIn, onSearchClick }: BottomNavProps) {
  if (!isLoggedIn || !isStandalone) return null;

  return (
    <nav
      className="sm:hidden fixed inset-x-0 z-40 pointer-events-none"
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + var(--bottom-nav-offset-mobile))',
      }}
    >
      <div className="flex justify-center px-3 pointer-events-none">
        <div className="pointer-events-auto flex items-center justify-between gap-2 bg-white rounded-full shadow-[0_6px_20px_rgba(0,0,0,0.08)] p-2 h-[60px] w-full max-w-sm">

          {/* Navigační položky — seskupené vlevo */}
          <div className="flex items-center gap-2">
            <NavItem to="/dashboard" icon={Home} label="Home" />
            <NavItem to="/collection" icon={LayoutGrid} label="Collection" />
            <NavItem to="/settings" icon={Settings} label="Settings" iconSize="w-[21px] h-[21px]" />
          </div>

          {/* Search — samostatné kulaté tlačítko vpravo */}
          <button
            onClick={onSearchClick}
            disabled={!onSearchClick}
            className={`w-11 h-11 flex items-center justify-center rounded-full transition-colors duration-200 ${
              onSearchClick
                ? 'bg-primary-50 text-primary-500 active:bg-primary-100 cursor-pointer'
                : 'bg-neutral-200 text-neutral-400 cursor-default'
            }`}
            aria-label="Hledat"
          >
            <Search className="w-5 h-5" strokeWidth={2.5} />
          </button>

        </div>
      </div>
    </nav>
  );
}
