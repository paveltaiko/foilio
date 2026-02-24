import { LayoutGrid, Search, Settings } from 'lucide-react';
import { NavLink } from 'react-router';

interface BottomNavProps {
  isLoggedIn: boolean;
  onSearchClick?: () => void;
}

const isStandalone = window.matchMedia('(display-mode: standalone)').matches

export function BottomNav({ isLoggedIn, onSearchClick }: BottomNavProps) {
  if (!isLoggedIn || !isStandalone) return null;

  return (
    <nav
      className="sm:hidden fixed bottom-0 inset-x-0 z-40 pointer-events-none"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)' }}
    >
      <div className="flex justify-center p-3 pointer-events-none">
        <div className="pointer-events-auto flex items-center justify-between gap-2 bg-white/80 backdrop-blur-md rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-2 w-full max-w-sm">

          {/* Navigační položky — seskupené vlevo */}
          <div className="flex items-center gap-1">
            {/* Collection */}
            <NavLink to="/" end>
              {({ isActive }) => (
                <div className={`flex flex-col items-center justify-center gap-1 rounded-full px-4 h-11 transition-all duration-200 ${isActive ? 'bg-neutral-300' : ''}`}>
                  <LayoutGrid
                    className={`w-5 h-5 shrink-0 transition-colors duration-200 ${isActive ? 'text-primary-500' : 'text-neutral-600'}`}
                    strokeWidth={2.2}
                  />
                  <span className={`text-[10px] font-medium leading-none transition-colors duration-200 ${isActive ? 'text-primary-500' : 'text-neutral-600'}`}>
                    Collection
                  </span>
                </div>
              )}
            </NavLink>

            {/* Settings */}
            <NavLink to="/settings">
              {({ isActive }) => (
                <div className={`flex flex-col items-center justify-center gap-1 rounded-full px-4 h-11 transition-all duration-200 ${isActive ? 'bg-neutral-300' : ''}`}>
                  <Settings
                    className={`w-[22px] h-[22px] shrink-0 transition-colors duration-200 ${isActive ? 'text-primary-500' : 'text-neutral-600'}`}
                    strokeWidth={2.2}
                  />
                  <span className={`text-[10px] font-medium leading-none transition-colors duration-200 ${isActive ? 'text-primary-500' : 'text-neutral-600'}`}>
                    Settings
                  </span>
                </div>
              )}
            </NavLink>
          </div>

          {/* Search — samostatné kulaté tlačítko vpravo */}
          <button
            onClick={onSearchClick}
            disabled={!onSearchClick}
            className={`w-11 h-11 flex items-center justify-center rounded-full transition-colors duration-200 ${
              onSearchClick
                ? 'bg-neutral-300 text-primary-500 active:bg-neutral-400 cursor-pointer'
                : 'bg-neutral-300 text-neutral-400 cursor-default'
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
