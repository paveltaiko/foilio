import { useState, useEffect, useRef } from 'react';
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
 */
export function useDashboardCardLoader(
  ownedCards: Map<string, OwnedCard>,
  settings: CollectionSettings,
  isOwnedCardsLoading: boolean,
  isSettingsLoading: boolean,
  refreshKey: number = 0,
  onRefreshConsumed?: () => void,
): { isLoading: boolean; cacheVersion: number } {
  const [isLoading, setIsLoading] = useState(false);
  const [cacheVersion, setCacheVersion] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Wait for stable Firestore data before starting any fetch
    if (isOwnedCardsLoading || isSettingsLoading) return;
    if (ownedCards.size === 0) return;

    const forceRefresh = refreshKey > 0;

    // Consume the refresh token immediately so repeated Firestore updates
    // don't trigger another force-refresh while the fetch is still in flight.
    if (forceRefresh) onRefreshConsumed?.();

    const missingCardIds = Array.from(ownedCards.keys()).filter(
      (id) => forceRefresh || !getCachedCardById(id)
    );

    const visibleSets = getVisibleSets(settings, collectionSets);
    const COUNTED_TYPES = new Set(['main', 'commander', 'eternal']);
    const missingSets = visibleSets
      .filter((s) => COUNTED_TYPES.has(s.type) && (forceRefresh || getCachedSetCount(s.code) === null))
      .map((s) => s.code);

    if (!forceRefresh && missingCardIds.length === 0 && missingSets.length === 0) return;

    // Cancel any previous in-flight fetch (e.g. settings changed mid-fetch)
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);

    const load = async () => {
      try {
        // Load card details (fills localStorage cache via setCachedCardById inside fetchCardsByIds)
        if (missingCardIds.length > 0) {
          await fetchCardsByIds(missingCardIds);
        }

        // Load missing set counts
        for (const code of missingSets) {
          if (controller.signal.aborted) return;
          const count = await fetchSetCardCount(code);
          if (count !== null) {
            setCachedSetCount(code, count);
          }
        }

        // Trigger re-computation in useHomeStats
        if (!controller.signal.aborted) {
          setCacheVersion((v) => v + 1);
        }
      } catch {
        // Partial data is fine – dashboard degrades gracefully
        if (!controller.signal.aborted) {
          setCacheVersion((v) => v + 1);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    // Cleanup: cancel fetch on unmount or when dependencies change
    return () => {
      controller.abort();
      setIsLoading(false);
    };
  }, [ownedCards, settings, isOwnedCardsLoading, isSettingsLoading, refreshKey]);

  return { isLoading, cacheVersion };
}
