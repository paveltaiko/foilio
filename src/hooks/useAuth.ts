import { useState, useEffect } from 'react';
import { signInWithPopup, signOut, onAuthStateChanged, type User } from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../config/firebase';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// Offline mode — no Firebase configured
const OFFLINE_USER_ID = 'local-user';

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      // No Firebase — run in offline/local mode immediately
      setState({
        user: { uid: OFFLINE_USER_ID, displayName: 'Lokální uživatel', photoURL: null } as unknown as User,
        loading: false,
        error: null,
      });
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setState({ user, loading: false, error: null });
    });
    return unsubscribe;
  }, []);

  const login = async () => {
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      setState((prev) => ({
        ...prev,
        error: 'Firebase není nakonfigurován. Přidej API klíče do .env souboru.',
      }));
      return;
    }
    try {
      setState((prev) => ({ ...prev, error: null }));
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Chyba při přihlášení',
      }));
    }
  };

  const logout = async () => {
    if (!isFirebaseConfigured || !auth) {
      return;
    }
    try {
      await signOut(auth);
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Chyba při odhlášení',
      }));
    }
  };

  return { ...state, login, logout, isFirebaseConfigured };
}
