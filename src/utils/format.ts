/**
 * Number formatting utilities
 */

/**
 * Format large numbers with K, M, B suffixes
 */
export function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) {
    return '0';
  }

  const abs = Math.abs(num);

  if (abs >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1) + 'B';
  }
  if (abs >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M';
  }
  if (abs >= 1_000) {
    return (num / 1_000).toFixed(1) + 'K';
  }

  return num.toString();
}
