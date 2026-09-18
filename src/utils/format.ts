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
  // The data source stores UTC; display the viewer's local clock with their
  // own offset. Date getters are already timezone-aware — no shifting needed.
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutes);
  const pad = (n: number) => String(n).padStart(2, '0');
  const date_ = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  const offset = `UTC${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
  return `${date_} ${time} ${offset}`;
}

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'June',
  'July',
  'Aug',
  'Sept',
  'Oct',
  'Nov',
  'Dec',
] as const;

/** English ordinal suffix for a day of month: 1st, 2nd, 3rd, 4th… */
export function ordinalFor(day: number): string {
  const tens = day % 100;
  if (tens >= 11 && tens <= 13) return 'th';
  switch (day % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

export interface FriendlyDateParts {
  month: string;
  day: number;
  ordinal: string;
  year: number;
  time: string;
  offset: string;
}

/**
 * Human-readable timestamp parts in the viewer's local clock, e.g.
 * "Sept 18th 2026, 14:36 UTC+08:00". The ordinal is returned separately so
 * callers can render it superscript. Null for invalid input.
 */
export function friendlyDateParts(iso: string): FriendlyDateParts | null {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return null;
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutes);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    month: MONTHS[date.getMonth()],
    day: date.getDate(),
    ordinal: ordinalFor(date.getDate()),
    year: date.getFullYear(),
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
    offset: `UTC${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`,
  };
}

/** Coarse relative age for scan metadata: "just now", "3d ago", "2mo ago". */
export function formatRelativeAge(iso: string, now: number = Date.now()): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '';
  const diffMs = now - date.getTime();
  if (diffMs < 0) return 'just now';
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 31) return `${days}d ago`;
  const months = Math.floor(days / 30.5);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(days / 365.25)}y ago`;
}
