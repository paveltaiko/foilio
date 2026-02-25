import { useState, useCallback } from 'react';

const STORAGE_KEY = 'foilio-sld-settings-v1';

function loadEnabledDropIds(): Set<string> {
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

function saveEnabledDropIds(ids: Set<string>): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

export function useSecretLairDropSettings() {
  const [enabledDropIds, setEnabledDropIds] = useState<Set<string>>(loadEnabledDropIds);

  const toggleDrop = useCallback((dropId: string, enabled: boolean) => {
    setEnabledDropIds((prev) => {
      const next = new Set(prev);
      if (enabled) {
        next.add(dropId);
      } else {
        next.delete(dropId);
      }
      saveEnabledDropIds(next);
      return next;
    });
  }, []);

  return { enabledDropIds, toggleDrop };
}
