import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { isFirebaseConfigured } from '../config/firebase';
import { subscribeToSecretLairSettings, saveSecretLairSettings } from '../services/firestore';

// ─── Context ──────────────────────────────────────────────────────────────────

export interface SecretLairDropSettingsContextValue {
  enabledDropIds: Set<string>;
  toggleDrop: (dropId: string, enabled: boolean) => void;
}

export const SecretLairDropSettingsContext =
  createContext<SecretLairDropSettingsContextValue | null>(null);

// ─── localStorage helpers ─────────────────────────────────────────────────────

const STORAGE_KEY = 'foilio-sld-settings-v1';

function loadFromLocalStorage(): Set<string> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return new Set(parsed as string[]);
    return new Set();
  } catch {
    return new Set();
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

interface SecretLairDropSettingsProviderProps {
  userId: string | null;
  children: ReactNode;
}

export function SecretLairDropSettingsProvider({
  userId,
  children,
}: SecretLairDropSettingsProviderProps) {
  const [enabledDropIds, setEnabledDropIds] = useState<Set<string>>(() =>
    isFirebaseConfigured ? new Set() : loadFromLocalStorage()
  );

  useEffect(() => {
    if (!userId || !isFirebaseConfigured) return;

    const unsubscribe = subscribeToSecretLairSettings(userId, (ids) => {
      if (ids === null) {
        // Firestore nemá data — migruj z localStorage pokud existuje
        const local = loadFromLocalStorage();
        if (local.size > 0) {
          saveSecretLairSettings(userId, [...local]).catch((err) => {
            console.error('[SecretLairSettings] Migrace z localStorage selhala:', err);
          });
          setEnabledDropIds(local);
        } else {
          setEnabledDropIds(new Set());
        }
      } else {
        setEnabledDropIds(new Set(ids));
      }
    });

    return unsubscribe;
  }, [userId]);

  const persist = useCallback((next: Set<string>) => {
    setEnabledDropIds(next);
    if (isFirebaseConfigured && userId) {
      saveSecretLairSettings(userId, [...next]).catch((err) => {
        console.error('[SecretLairSettings] Uložení do Firestore selhalo:', err);
      });
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
    }
  }, [userId]);

  const value = useMemo<SecretLairDropSettingsContextValue>(
    () => ({
      enabledDropIds,
      toggleDrop: (dropId: string, enabled: boolean) => {
        const next = new Set(enabledDropIds);
        if (enabled) next.add(dropId);
        else next.delete(dropId);
        persist(next);
      },
    }),
    [enabledDropIds, persist]
  );

  return (
    <SecretLairDropSettingsContext.Provider value={value}>
      {children}
    </SecretLairDropSettingsContext.Provider>
  );
}
