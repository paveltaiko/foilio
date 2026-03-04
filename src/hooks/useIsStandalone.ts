import { useSyncExternalStore } from 'react';

const query = '(display-mode: standalone)';

function subscribe(onStoreChange: () => void) {
  const mql = window.matchMedia(query);
  mql.addEventListener('change', onStoreChange);
  return () => mql.removeEventListener('change', onStoreChange);
}

function getSnapshot() {
  return window.matchMedia(query).matches;
}

function getServerSnapshot() {
  return false;
}

/** Whether the app is running in PWA standalone mode. SSR-safe. */
export function useIsStandalone(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
