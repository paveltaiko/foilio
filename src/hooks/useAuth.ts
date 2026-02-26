import { useState, useEffect, useRef } from 'react';
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../config/firebase';
import { createUserProfileIfNeeded } from '../services/userProfile';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// Offline mode — no Firebase configured
const OFFLINE_USER_ID = 'local-user';

function shouldUseRedirectLogin() {
  if (typeof window === 'undefined') {
    return false;
  }

  const userAgent = navigator.userAgent ?? '';
  const isMobileUA = /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);
  const isCoarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false;

  return isMobileUA || isCoarsePointer;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });
  const profileCreatedRef = useRef<string | null>(null);

  const syncUserProfile = (user: User | null) => {
    if (!user || profileCreatedRef.current === user.uid) {
      return;
    }
    profileCreatedRef.current = user.uid;
    createUserProfileIfNeeded(user).catch(() => {
      // Profile creation is non-critical, silently ignore errors
    });
  };

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
    const firebaseAuth = auth;

    let isMounted = true;

    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      if (!isMounted) return;
      setState({ user, loading: false, error: null });
      syncUserProfile(user);
    });

    // Resolve pending redirect result once during app init.
    getRedirectResult(firebaseAuth).catch((err) => {
      if (!isMounted) return;
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Sign in redirect failed',
      }));
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
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
      if (shouldUseRedirectLogin()) {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      const code = typeof err === 'object' && err !== null && 'code' in err ? String(err.code) : '';
      const shouldFallbackToRedirect = code === 'auth/popup-blocked' || code === 'auth/cancelled-popup-request';

      if (shouldFallbackToRedirect) {
        await signInWithRedirect(auth, googleProvider);
        return;
      }

      setState((prev) => ({
        ...prev,
        error: message,
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
