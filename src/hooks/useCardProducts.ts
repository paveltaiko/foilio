import { useQuery } from '@tanstack/react-query';
import type { CardProduct } from '../types/card';
import { fetchCardProducts } from '../services/mtgjson';

const STALE_TIME = 7 * 24 * 60 * 60 * 1000; // 7 days

export function useCardProducts(setCode: string, collectorNumber: string) {
  return useQuery<CardProduct[]>({
    queryKey: ['mtgjson-products', setCode, collectorNumber],
    queryFn: () => fetchCardProducts(setCode, collectorNumber),
    staleTime: STALE_TIME,
    gcTime: STALE_TIME,
    refetchOnWindowFocus: false,
    enabled: !!setCode && !!collectorNumber,
  });
}
