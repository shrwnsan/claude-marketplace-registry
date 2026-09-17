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

/**
 * Format an ISO timestamp as `YYYY-MM-DD HH:MM:SS UTC±HH:MM` (local clock,
 * explicit offset). Used everywhere scan timestamps are shown.
 */
export function formatDateTimeWithOffset(iso: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return iso;
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutes);
  const local = new Date(date.getTime() + offsetMinutes * 60000);
  const pad = (n: number) => String(n).padStart(2, '0');
  const date_ = `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}`;
  const time = `${pad(local.getHours())}:${pad(local.getMinutes())}:${pad(local.getSeconds())}`;
  const offset = `UTC${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
  return `${date_} ${time} ${offset}`;
}
