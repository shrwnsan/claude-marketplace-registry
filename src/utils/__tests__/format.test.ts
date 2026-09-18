import { formatDateTimeWithOffset } from '../format';

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
