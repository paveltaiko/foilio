import { useState, useEffect, useRef } from 'react';
import { signInWithPopup, signOut, onAuthStateChanged, type User } from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../config/firebase';
import { createUserProfileIfNeeded } from '../services/userProfile';

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
  const profileCreatedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      // No Firebase — run in offline/local mode immediately
      setState({
        user: { uid: OFFLINE_USER_ID, displayName: 'Local user', photoURL: null } as unknown as User,
        loading: false,
        error: null,
      });
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setState({ user, loading: false, error: null });
      // Create/update user profile in Firestore on login
      if (user && profileCreatedRef.current !== user.uid) {
        profileCreatedRef.current = user.uid;
        createUserProfileIfNeeded(user).catch(() => {
          // Profile creation is non-critical, silently ignore errors
        });
      }
    });
    return unsubscribe;
  }, []);

  const login = async () => {
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      setState((prev) => ({
        ...prev,
        error: 'Firebase is not configured. Add API keys to .env file.',
      }));
      return;
    }
    try {
      setState((prev) => ({ ...prev, error: null }));
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Sign in failed',
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
        error: err instanceof Error ? err.message : 'Sign out failed',
      }));
    }
  };

  return { ...state, login, logout, isFirebaseConfigured };
}
