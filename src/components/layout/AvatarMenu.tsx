import { useEffect, useRef, useState } from 'react';
import { Home, LayoutGrid, LogOut, Settings, UserCircle2, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';

interface AvatarMenuProps {
  userName?: string | null;
  userPhoto?: string | null;
  onOpenSettings: () => void;
  onLogout: () => void;
}

export function AvatarMenu({ userName, userPhoto, onOpenSettings, onLogout }: AvatarMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex h-[44px] w-[44px] sm:h-[34px] sm:w-[34px] cursor-pointer items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 ${
          isOpen
            ? 'bg-neutral-100 text-neutral-700'
            : 'bg-white hover:bg-neutral-50'
        }`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Close user menu' : 'Open user menu'}
      >
        {isOpen ? (
          <X className="h-5 w-5 sm:h-4.5 sm:w-4.5" />
        ) : userPhoto ? (
          <img
            src={userPhoto}
            alt={userName ?? 'Avatar'}
            className="h-[44px] w-[44px] sm:h-[34px] sm:w-[34px] rounded-full"
            referrerPolicy="no-referrer"
          />
        ) : (
          <UserCircle2 className="h-6 w-6 sm:h-5 sm:w-5 text-neutral-500" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-56 sm:w-48 origin-top-right rounded-xl border border-neutral-200 bg-white p-2 sm:p-1.5 shadow-[0_14px_32px_rgba(0,0,0,0.14)] animate-scale-in" role="menu">
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              navigate('/dashboard');
            }}
            className={`flex w-full cursor-pointer items-center gap-3 sm:gap-2 rounded-lg px-4 py-3.5 sm:px-3 sm:py-2 text-base sm:text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 ${pathname === '/dashboard' ? 'bg-red-50 text-primary-500' : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'}`}
            role="menuitem"
          >
            <Home className={`h-5 w-5 sm:h-4 sm:w-4 ${pathname === '/dashboard' ? 'text-primary-500' : 'text-neutral-700'}`} />
            Home
          </button>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              navigate('/collection');
            }}
            className={`flex w-full cursor-pointer items-center gap-3 sm:gap-2 rounded-lg px-4 py-3.5 sm:px-3 sm:py-2 text-base sm:text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 ${pathname === '/collection' ? 'bg-red-50 text-primary-500' : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'}`}
            role="menuitem"
          >
            <LayoutGrid className={`h-5 w-5 sm:h-4 sm:w-4 ${pathname === '/collection' ? 'text-primary-500' : 'text-neutral-700'}`} />
            Collection
          </button>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onOpenSettings();
            }}
            className={`flex w-full cursor-pointer items-center gap-3 sm:gap-2 rounded-lg px-4 py-3.5 sm:px-3 sm:py-2 text-base sm:text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 ${pathname === '/settings' ? 'bg-red-50 text-primary-500' : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'}`}
            role="menuitem"
          >
            <Settings className={`h-5 w-5 sm:h-4 sm:w-4 ${pathname === '/settings' ? 'text-primary-500' : 'text-neutral-700'}`} />
            Settings
          </button>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
            className="flex w-full cursor-pointer items-center gap-3 sm:gap-2 rounded-lg px-4 py-3.5 sm:px-3 sm:py-2 text-base sm:text-sm font-medium text-neutral-700 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
            role="menuitem"
          >
            <LogOut className="h-5 w-5 sm:h-4 sm:w-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
