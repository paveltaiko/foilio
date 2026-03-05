import { useState, useEffect, useRef, useCallback } from 'react';
import { getCachedCardById, getCachedSetCount, setCachedSetCount } from '../utils/scryfallCache';
import { fetchCardsByIds, fetchSetCardCount } from '../services/scryfall';
import { collectionSets } from '../config/collections';
import type { OwnedCard } from '../types/card';
import type { CollectionSettings } from '../utils/collectionsSettings';
import { getVisibleSets } from '../utils/collectionsSettings';

/**
 * Loads missing Scryfall card data and set counts for the dashboard.
 * Returns cacheVersion that increments each time new data arrives,
 * which allows useHomeStats (useMemo) to recompute.
 *
 * Waits for both ownedCards and settings to finish loading from Firestore
 * before starting the fetch, to avoid race conditions with stale data.
 *
 * Uses refs for ownedCards/settings so that unstable Firestore Map references
 * don't re-trigger the effect and abort in-flight fetches.
 */
export function useDashboardCardLoader(
  ownedCards: Map<string, OwnedCard>,
  settings: CollectionSettings,
  isOwnedCardsLoading: boolean,
  isSettingsLoading: boolean,
  refreshKey: number = 0,
  onRefreshConsumed?: () => void,
): { isLoading: boolean; cacheVersion: number; getRefreshPromise: () => Promise<void> } {
  const [isLoading, setIsLoading] = useState(false);
  const [cacheVersion, setCacheVersion] = useState(0);
  const loadingRef = useRef(false);

  // Refs for data – read inside effect but don't trigger it
  const ownedCardsRef = useRef(ownedCards);
  ownedCardsRef.current = ownedCards;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Stable trigger – changes only when cards are actually added/removed
  const ownedCardsSize = ownedCards.size;

  // Pull-to-refresh promise support
  const refreshResolveRef = useRef<(() => void) | null>(null);

  const getRefreshPromise = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      refreshResolveRef.current = resolve;
    });
  }, []);

  useEffect(() => {
    // Wait for stable Firestore data before starting any fetch
    if (isOwnedCardsLoading || isSettingsLoading) return;
    if (ownedCardsRef.current.size === 0) return;

    const forceRefresh = refreshKey > 0;

    // Consume the refresh token immediately so repeated Firestore updates
    // don't trigger another force-refresh while the fetch is still in flight.
    if (forceRefresh) onRefreshConsumed?.();

    // Skip if a fetch is already running (unless user explicitly pulled to refresh)
    if (loadingRef.current && !forceRefresh) return;

    const currentCards = ownedCardsRef.current;
    const currentSettings = settingsRef.current;

    const missingCardIds = Array.from(currentCards.keys()).filter(
      (id) => forceRefresh || !getCachedCardById(id)
    );

    const visibleSets = getVisibleSets(currentSettings, collectionSets);
    const COUNTED_TYPES = new Set(['main', 'commander', 'eternal']);
    const missingSets = visibleSets
      .filter((s) => COUNTED_TYPES.has(s.type) && (forceRefresh || getCachedSetCount(s.code) === null))
      .map((s) => s.code);

    if (!forceRefresh && missingCardIds.length === 0 && missingSets.length === 0) return;

    let cancelled = false;
    loadingRef.current = true;
    setIsLoading(true);

    const load = async () => {
      try {
        // Load card details (fills localStorage cache via setCachedCardById inside fetchCardsByIds)
        if (missingCardIds.length > 0) {
          await fetchCardsByIds(missingCardIds);
        }

        // Load missing set counts in parallel batches
        const BATCH_SIZE = 5;
        for (let i = 0; i < missingSets.length; i += BATCH_SIZE) {
          if (cancelled) return;
          const batch = missingSets.slice(i, i + BATCH_SIZE);
          const results = await Promise.all(batch.map((code) => fetchSetCardCount(code)));
          for (let j = 0; j < batch.length; j++) {
            if (results[j] !== null) {
              setCachedSetCount(batch[j], results[j]!);
            }
          }
        }

        // Trigger re-computation in useHomeStats
        if (!cancelled) {
          setCacheVersion((v) => v + 1);
        }
      } catch {
        // Partial data is fine – dashboard degrades gracefully
        if (!cancelled) {
          setCacheVersion((v) => v + 1);
        }
      } finally {
        loadingRef.current = false;
        // Resolve pull-to-refresh promise so PullToRefresh spinner can stop
        refreshResolveRef.current?.();
        refreshResolveRef.current = null;
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [ownedCardsSize, isOwnedCardsLoading, isSettingsLoading, refreshKey]);

  return { isLoading, cacheVersion, getRefreshPromise };
}
