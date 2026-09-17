import { mergeRegistryRecords, RegistryRecord } from '../scan-marketplaces';

const NOW = '2026-09-18T00:00:00.000Z';
const YESTERDAY = '2026-09-17T00:00:00.000Z';

const record = (id: string, overrides: Partial<RegistryRecord> = {}): RegistryRecord => ({
  id,
  fullName: `owner/${id}`,
  firstSeen: YESTERDAY,
  lastSeen: YESTERDAY,
  discoverySource: 'topic-claude-plugins',
  ...overrides,
});

describe('mergeRegistryRecords', () => {
  it('adds new discoveries with firstSeen = now', () => {
    const records = mergeRegistryRecords(
      [],
      [{ id: 'a', fullName: 'o/a', discoverySource: 's' }],
      NOW
    );
    expect(records).toHaveLength(1);
    expect(records[0]).toEqual({
      id: 'a',
      fullName: 'o/a',
      firstSeen: NOW,
      lastSeen: NOW,
      discoverySource: 's',
    });
  });

  it('keeps original firstSeen and discoverySource for known marketplaces', () => {
    const existing = [
      record('a', { firstSeen: '2026-01-01T00:00:00.000Z', discoverySource: 'known-seed' }),
    ];
    const records = mergeRegistryRecords(
      existing,
      [{ id: 'a', fullName: 'o/a', discoverySource: 'topic-claude-plugins' }],
      NOW
    );
    expect(records[0].firstSeen).toBe('2026-01-01T00:00:00.000Z');
    expect(records[0].discoverySource).toBe('known-seed');
    expect(records[0].lastSeen).toBe(NOW);
  });

  it('keeps records for marketplaces missing from today’s discovery (self-healing)', () => {
    const existing = [record('a'), record('b')];
    const records = mergeRegistryRecords(
      existing,
      [{ id: 'a', fullName: 'o/a', discoverySource: 's' }],
      NOW
    );
    expect(records.map((r) => r.id).sort()).toEqual(['a', 'b']);
    expect(records.find((r) => r.id === 'b')?.lastSeen).toBe(YESTERDAY);
  });

  it('lets the caller drop removed (404) records via filter', () => {
    const existing = [record('a'), record('gone')];
    const merged = mergeRegistryRecords(
      existing,
      [{ id: 'a', fullName: 'o/a', discoverySource: 's' }],
      NOW
    );
    const records = merged.filter((r) => r.id !== 'gone');
    expect(records.map((r) => r.id)).toEqual(['a']);
  });
});
