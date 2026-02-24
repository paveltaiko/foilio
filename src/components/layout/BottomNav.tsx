import { LayoutGrid, Search, Settings } from 'lucide-react';
import { NavLink } from 'react-router';

interface BottomNavProps {
  isLoggedIn: boolean;
  onSearchClick?: () => void;
}

export function BottomNav({ isLoggedIn, onSearchClick }: BottomNavProps) {
  if (!isLoggedIn) return null;

  return (
    <nav
      className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-surface-primary border-t border-surface-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
    >
      <div className="flex items-stretch h-14">
        {/* Kolekce */}
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-1 transition-colors duration-150 ${
              isActive ? 'text-primary-500' : 'text-neutral-400 hover:text-neutral-600'
            }`
          }
          aria-label="Kolekce"
        >
          <LayoutGrid className="w-5 h-5" strokeWidth={2} />
          <span className="text-[10px] font-medium leading-none">Kolekce</span>
        </NavLink>

        {/* Hledat */}
        <button
          onClick={onSearchClick}
          disabled={!onSearchClick}
          className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors duration-150 ${
            onSearchClick
              ? 'text-neutral-400 hover:text-neutral-600 active:text-primary-500 cursor-pointer'
              : 'text-neutral-300 cursor-default'
          }`}
          aria-label="Hledat"
        >
          <Search className="w-5 h-5" strokeWidth={2} />
          <span className="text-[10px] font-medium leading-none">Hledat</span>
        </button>

        {/* Nastavení */}
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-1 transition-colors duration-150 ${
              isActive ? 'text-primary-500' : 'text-neutral-400 hover:text-neutral-600'
            }`
          }
          aria-label="Nastavení"
        >
          <Settings className="w-5 h-5" strokeWidth={2} />
          <span className="text-[10px] font-medium leading-none">Nastavení</span>
        </NavLink>
      </div>
    </nav>
  );
}
