export function formatPrice(price: number | string | null | undefined): string {
  if (price === null || price === undefined || price === '') return '—';
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return '—';
  return `€${num.toFixed(2)}`;
}

export function parsePrice(price: string | null | undefined): number | null {
  if (price === null || price === undefined || price === '') return null;
  const num = parseFloat(price);
  return isNaN(num) ? null : num;
}
