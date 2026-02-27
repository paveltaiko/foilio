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
 */
export function useDashboardCardLoader(
  ownedCards: Map<string, OwnedCard>,
  settings: CollectionSettings
): { isLoading: boolean; cacheVersion: number } {
  const [isLoading, setIsLoading] = useState(false);
  const [cacheVersion, setCacheVersion] = useState(0);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (ownedCards.size === 0) return;
    if (loadingRef.current) return;

    const missingCardIds = Array.from(ownedCards.keys()).filter(
      (id) => !getCachedCardById(id)
    );

    const visibleSets = getVisibleSets(settings, collectionSets);
    const COUNTED_TYPES = new Set(['main', 'commander', 'eternal']);
    const missingSets = visibleSets
      .filter((s) => COUNTED_TYPES.has(s.type) && getCachedSetCount(s.code) === null)
      .map((s) => s.code);

    if (missingCardIds.length === 0 && missingSets.length === 0) return;

    loadingRef.current = true;
    setIsLoading(true);

    const load = async () => {
      try {
        // Load card details (fills localStorage cache via setCachedCardById inside fetchCardsByIds)
        if (missingCardIds.length > 0) {
          await fetchCardsByIds(missingCardIds);
        }

        // Load missing set counts
        for (const code of missingSets) {
          const count = await fetchSetCardCount(code);
          if (count !== null) {
            setCachedSetCount(code, count);
          }
        }

        // Trigger re-computation in useHomeStats
        setCacheVersion((v) => v + 1);
      } catch {
        // Partial data is fine – dashboard degrades gracefully
        setCacheVersion((v) => v + 1);
      } finally {
        loadingRef.current = false;
        setIsLoading(false);
      }
    };

    void load();
  }, [ownedCards, settings]);

  return { isLoading, cacheVersion };
}
