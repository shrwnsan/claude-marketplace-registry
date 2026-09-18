import {
  formatDateTimeWithOffset,
  ordinalFor,
  friendlyDateParts,
  formatRelativeAge,
} from '../format';

describe('formatDateTimeWithOffset', () => {
  it('renders the viewer-local time (no double offset shift)', () => {
    const iso = '2026-09-17T23:51:35Z';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    // Expected built from the same Date's local getters — catches any
    // accidental second offset application.
    const expectedDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const expectedTime = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    const out = formatDateTimeWithOffset(iso);
    expect(out).toBe(
      `${expectedDate} ${expectedTime} ${out.match(/UTC[+-]\d{2}:\d{2}/)?.[0] ?? ''}`
    );
    // and the date portion must match true local date
    expect(out.startsWith(expectedDate)).toBe(true);
  });

  it('formats the offset suffix as UTC±HH:MM', () => {
    const out = formatDateTimeWithOffset('2026-09-17T23:51:35Z');
    expect(out).toMatch(/UTC[+-]\d{2}:\d{2}$/);
  });

  it('returns the input unchanged when it is not a valid date', () => {
    expect(formatDateTimeWithOffset('not-a-date')).toBe('not-a-date');
  });
});

describe('ordinalFor', () => {
  it('handles the special -teen family', () => {
    expect(ordinalFor(11)).toBe('th');
    expect(ordinalFor(12)).toBe('th');
    expect(ordinalFor(13)).toBe('th');
  });

  it('handles 1st/2nd/3rd and teens correctly', () => {
    expect(ordinalFor(1)).toBe('st');
    expect(ordinalFor(2)).toBe('nd');
    expect(ordinalFor(3)).toBe('rd');
    expect(ordinalFor(4)).toBe('th');
    expect(ordinalFor(18)).toBe('th');
    expect(ordinalFor(21)).toBe('st');
    expect(ordinalFor(22)).toBe('nd');
    expect(ordinalFor(23)).toBe('rd');
    expect(ordinalFor(30)).toBe('th');
    expect(ordinalFor(31)).toBe('st');
  });
});

describe('friendlyDateParts', () => {
  it('splits a timestamp into friendly local parts', () => {
    const iso = '2026-09-18T06:02:57Z';
    const parts = friendlyDateParts(iso);
    expect(parts).not.toBeNull();
    expect(parts?.month).toBe('Sept');
    expect(parts?.day).toBe(new Date(iso).getDate());
    expect(parts?.ordinal).toBe(ordinalFor(new Date(iso).getDate()));
    expect(parts?.year).toBe(new Date(iso).getFullYear());
    expect(parts?.time).toMatch(/^\d{2}:\d{2}$/);
    expect(parts?.offset).toMatch(/^UTC[+-]\d{2}:\d{2}$/);
  });

  it('returns null for invalid input', () => {
    expect(friendlyDateParts('nope')).toBeNull();
  });
});

describe('formatRelativeAge', () => {
  const now = new Date('2026-09-18T12:00:00Z').getTime();

  it('buckets coarse ages', () => {
    expect(formatRelativeAge('2026-09-18T11:59:30Z', now)).toBe('just now');
    expect(formatRelativeAge('2026-09-18T11:50:00Z', now)).toBe('10m ago');
    expect(formatRelativeAge('2026-09-18T10:00:00Z', now)).toBe('2h ago');
    expect(formatRelativeAge('2026-09-15T12:00:00Z', now)).toBe('3d ago');
    expect(formatRelativeAge('2026-07-01T12:00:00Z', now)).toBe('2mo ago');
    expect(formatRelativeAge('2024-06-18T12:00:00Z', now)).toBe('2y ago');
  });

  it('treats future timestamps as just now and invalid as empty', () => {
    expect(formatRelativeAge('2026-09-18T13:00:00Z', now)).toBe('just now');
    expect(formatRelativeAge('nope', now)).toBe('');
  });
});
