import { LogOut } from 'lucide-react';
import { Button } from '../ui/Button';
import { SearchInput } from '../filters/SearchInput';

interface HeaderProps {
  userName?: string | null;
  userPhoto?: string | null;
  onLogin: () => void;
  onLogout: () => void;
  isLoggedIn: boolean;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
}

export function Header({ userName, userPhoto, onLogin, onLogout, isLoggedIn, searchQuery = '', onSearchChange }: HeaderProps) {
  return (
    <header className="bg-surface-primary border-b border-surface-border sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-12 sm:h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center shrink-0">
          <span className="text-lg sm:text-xl font-extrabold text-neutral-900 tracking-tight">Foilio</span>
        </div>

        {/* Search + User area */}
        <div className="flex items-center gap-10">
          {isLoggedIn && onSearchChange && (
            <div className="w-56 hidden sm:block">
              <SearchInput value={searchQuery} onChange={onSearchChange} />
            </div>
          )}

          {/* User area */}
          {isLoggedIn ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {userPhoto && (
                <img
                  src={userPhoto}
                  alt={userName ?? 'Avatar'}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full"
                  referrerPolicy="no-referrer"
                />
              )}
              <span className="hidden sm:block text-sm text-neutral-600 max-w-[120px] truncate">{userName}</span>
              <Button variant="ghost" size="sm" onClick={onLogout}>
                <span className="hidden sm:inline">Odhlásit</span>
                <LogOut className="w-4 h-4 sm:hidden" />
              </Button>
            </div>
          ) : (
            <Button variant="primary" size="sm" onClick={onLogin}>
              <span className="hidden sm:inline">Přihlásit se</span>
              <span className="sm:hidden">Přihlásit</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
