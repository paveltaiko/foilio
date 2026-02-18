import type { ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { PreviewLoginLandingPage } from '../../pages/PreviewLoginLandingPage';

interface AuthGuardProps {
  user: User | null;
  loading: boolean;
  onLogin: () => void;
  children: ReactNode;
}

export function AuthGuard({ user, loading, onLogin, children }: AuthGuardProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <PreviewLoginLandingPage onLogin={onLogin} isLoggedIn={false} />;
  }

  return <>{children}</>;
}
