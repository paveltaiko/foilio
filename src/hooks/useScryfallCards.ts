import { useQuery } from '@tanstack/react-query';
import { fetchCardsForSet } from '../services/scryfall';
import type { ScryfallCard, SetCode } from '../types/card';

const STALE_TIME = 24 * 60 * 60 * 1000; // 24 hours

export function useScryfallCards(setCode: SetCode) {
  return useQuery<ScryfallCard[]>({
    queryKey: ['scryfall-cards', setCode],
    queryFn: () => fetchCardsForSet(setCode),
    staleTime: STALE_TIME,
    gcTime: STALE_TIME,
    refetchOnWindowFocus: false,
  });
}
