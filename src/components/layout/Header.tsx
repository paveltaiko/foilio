import { Search } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '../ui/Button';
import { AvatarMenu } from './AvatarMenu';

interface HeaderProps {
  userName?: string | null;
  userPhoto?: string | null;
  onLogin: () => void;
  onLogout: () => void;
  onOpenSettings: () => void;
  isLoggedIn: boolean;
  onSearchClick?: () => void;
}

export function Header({ userName, userPhoto, onLogin, onLogout, onOpenSettings, isLoggedIn, onSearchClick }: HeaderProps) {
  return (
    <header className="bg-surface-primary border-b border-surface-border sticky top-0 z-40">
      <div className="app-container-padded h-16 sm:h-14 flex items-center justify-between relative">
        {/* Logo */}
        <div className="flex items-center shrink-0 absolute left-1/2 -translate-x-1/2 sm:static sm:translate-x-0">
          <Link to="/" className="inline-flex items-center" aria-label="Go to homepage">
            <span className="text-2xl sm:text-2xl text-neutral-900 tracking-tight" style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontStyle: 'italic' }}>Foilio</span>
          </Link>
        </div>

        {/* User area */}
        <div className="flex items-center gap-10 ml-auto">
          {isLoggedIn ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {onSearchClick && (
                <button
                  onClick={onSearchClick}
                  className="w-[44px] h-[44px] sm:w-[34px] sm:h-[34px] flex items-center justify-center rounded-full bg-red-50 text-primary-500 hover:bg-red-100 transition-colors duration-150 cursor-pointer"
                  aria-label="Search"
                >
                  <Search className="w-4.5 h-4.5 sm:w-4 sm:h-4" strokeWidth={2.5} />
                </button>
              )}
              <AvatarMenu
                userName={userName}
                userPhoto={userPhoto}
                onOpenSettings={onOpenSettings}
                onLogout={onLogout}
              />
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
