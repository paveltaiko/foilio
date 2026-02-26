const MOBILE_BATCH_SIZE = 24;
const DESKTOP_BATCH_SIZE = 48;

export function getBatchSize(): number {
  if (typeof window === 'undefined') return DESKTOP_BATCH_SIZE;
  return window.matchMedia('(max-width: 767px)').matches ? MOBILE_BATCH_SIZE : DESKTOP_BATCH_SIZE;
}
