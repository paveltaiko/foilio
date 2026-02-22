import { LoginButton } from '../components/auth/LoginButton';

interface LoginPageProps {
  onLogin: () => void;
  error: string | null;
}

export function LoginPage({ onLogin, error }: LoginPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
      <h1 className="text-3xl font-bold text-neutral-800 tracking-tight mb-2">
        <span className="text-primary-500">MTG</span> Universes Beyond
      </h1>
      <p className="text-neutral-500 mb-8 max-w-sm">
        Track your Universes Beyond card collections.
        Sign in to sync across devices.
      </p>
      <LoginButton onLogin={onLogin} />
      {error && (
        <p className="mt-4 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
