import { useQuery } from '@tanstack/react-query';
import { fetchBoosterMap } from '../services/mtgjson';
import type { BoosterMap } from '../services/mtgjson';
import { collectionSets } from '../config/collections';

const STALE_TIME = 7 * 24 * 60 * 60 * 1000; // 7 days

export function useBoosterMap() {
  return useQuery<BoosterMap>({
    queryKey: ['mtgjson-booster-map'],
    queryFn: () => fetchBoosterMap(collectionSets),
    staleTime: STALE_TIME,
    gcTime: STALE_TIME,
    refetchOnWindowFocus: false,
  });
}
