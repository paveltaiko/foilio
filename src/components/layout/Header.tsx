import { LogOut, Search } from 'lucide-react';
import { Button } from '../ui/Button';

interface HeaderProps {
  userName?: string | null;
  userPhoto?: string | null;
  onLogin: () => void;
  onLogout: () => void;
  isLoggedIn: boolean;
  onSearchClick?: () => void;
}

export function Header({ userName, userPhoto, onLogin, onLogout, isLoggedIn, onSearchClick }: HeaderProps) {
  return (
    <header className="bg-surface-primary border-b border-surface-border sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-2 sm:px-0 h-12 sm:h-14 flex items-center justify-between relative">
        {/* Logo */}
        <div className="flex items-center shrink-0 absolute left-1/2 -translate-x-1/2 sm:static sm:translate-x-0">
          <span className="text-xl sm:text-2xl text-neutral-900 tracking-tight" style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontStyle: 'italic' }}>Foilio</span>
        </div>

        {/* User area */}
        <div className="flex items-center gap-10 ml-auto">
          {isLoggedIn ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {onSearchClick && (
                <button
                  onClick={onSearchClick}
                  className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-primary-100 text-primary-500 hover:bg-primary-200 transition-colors cursor-pointer"
                  aria-label="Search"
                >
                  <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              )}
              {userPhoto && (
                <img
                  src={userPhoto}
                  alt={userName ?? 'Avatar'}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full"
                  referrerPolicy="no-referrer"
                />
              )}

              <button
                onClick={onLogout}
                className="sm:hidden w-7 h-7 flex items-center justify-center text-neutral-500 hover:text-red-500 transition-colors cursor-pointer"
                aria-label="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
              <div className="hidden sm:block">
                <Button variant="danger-ghost" size="sm" onClick={onLogout}>
                  Sign out
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="primary" size="sm" onClick={onLogin}>
              <span className="hidden sm:inline">Sign in</span>
              <span className="sm:hidden">Sign in</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
