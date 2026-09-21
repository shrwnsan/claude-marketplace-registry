/**
 * Plugin Index/Shard Tests
 *
 * Tests the pure helpers behind plugins.json (compact index) and the
 * per-marketplace shard files in public/data/plugins/:
 * - toPluginIndexRecord: description truncation + skillsCount derivation
 * - groupPluginsByMarketplace: shard grouping
 * - computeStaleShardFiles: stale-shard cleanup list
 */

import {
  Plugin,
  toPluginIndexRecord,
  deriveSkillsCount,
  groupPluginsByMarketplace,
  computeStaleShardFiles,
} from '../generate-data';

const buildPlugin = (overrides: Partial<Plugin> = {}): Plugin => ({
  id: 'mp-1-alpha',
  name: 'alpha',
  description: 'A plugin',
  version: '1.0.0',
  author: 'someone',
  repository: 'https://github.com/someone/mp',
  manifestPath: 'alpha',
  isValid: true,
  errors: [],
  warnings: [],
  metadata: { marketplaceId: 'mp-1', marketplaceName: 'mp', skills: ['skills/alpha'] },
  ...overrides,
});

describe('toPluginIndexRecord', () => {
  it('keeps the identity and validity fields and drops the heavy ones', () => {
    const record = toPluginIndexRecord(buildPlugin());

    expect(record).toEqual({
      id: 'mp-1-alpha',
      name: 'alpha',
      author: 'someone',
      version: '1.0.0',
      isValid: true,
      description: 'A plugin',
      marketplaceId: 'mp-1',
      marketplaceName: 'mp',
      skillsCount: 1,
    });
    expect(Object.keys(record)).not.toContain('metadata');
    expect(Object.keys(record)).not.toContain('repository');
  });

  it('truncates descriptions longer than 160 characters', () => {
    const long = 'a'.repeat(200);
    const record = toPluginIndexRecord(buildPlugin({ description: long }));
    expect(record.description).toBe('a'.repeat(160));
    expect(record.description.length).toBe(160);
  });

  it('keeps a description of exactly 160 characters intact', () => {
    const exact = 'b'.repeat(160);
    expect(toPluginIndexRecord(buildPlugin({ description: exact })).description).toBe(exact);
  });

  it('normalizes a missing description to an empty string', () => {
    expect(toPluginIndexRecord(buildPlugin({ description: '' })).description).toBe('');
    expect(
      toPluginIndexRecord(buildPlugin({ description: undefined as unknown as string })).description
    ).toBe('');
  });
});

describe('deriveSkillsCount', () => {
  it('counts the skills array when present', () => {
    expect(deriveSkillsCount({ skills: ['a', 'b', 'c'] })).toBe(3);
    expect(deriveSkillsCount({ skills: [] })).toBe(0);
  });

  it('prefers the skills array over hasSkillMd', () => {
    expect(deriveSkillsCount({ skills: ['a'], hasSkillMd: false })).toBe(1);
  });

  it('maps the scanner hasSkillMd boolean to 1 or 0', () => {
    expect(deriveSkillsCount({ hasSkillMd: true })).toBe(1);
    expect(deriveSkillsCount({ hasSkillMd: false })).toBe(0);
  });

  it('returns 0 when neither signal exists', () => {
    expect(deriveSkillsCount({ marketplaceId: 'mp-1' })).toBe(0);
    expect(deriveSkillsCount(undefined)).toBe(0);
    expect(deriveSkillsCount(null)).toBe(0);
  });
});

describe('groupPluginsByMarketplace', () => {
  it('groups full records by metadata.marketplaceId in encounter order', () => {
    const groups = groupPluginsByMarketplace([
      buildPlugin({ id: 'mp-1-a', metadata: { marketplaceId: 'mp-1' } }),
      buildPlugin({ id: 'mp-2-a', metadata: { marketplaceId: 'mp-2' } }),
      buildPlugin({ id: 'mp-1-b', metadata: { marketplaceId: 'mp-1' } }),
    ]);

    expect(groups.size).toBe(2);
    expect(groups.get('mp-1')!.map((p) => p.id)).toEqual(['mp-1-a', 'mp-1-b']);
    expect(groups.get('mp-2')!.map((p) => p.id)).toEqual(['mp-2-a']);
  });

  it('skips records without a marketplaceId instead of creating an empty group', () => {
    const groups = groupPluginsByMarketplace([
      buildPlugin({ id: 'orphan', metadata: {} }),
      buildPlugin({ id: 'no-meta', metadata: undefined }),
      buildPlugin({ id: 'kept', metadata: { marketplaceId: 'mp-1' } }),
    ]);

    expect(groups.size).toBe(1);
    expect(groups.get('mp-1')!.map((p) => p.id)).toEqual(['kept']);
  });

  it('returns an empty map for no plugins', () => {
    expect(groupPluginsByMarketplace([]).size).toBe(0);
  });
});

describe('computeStaleShardFiles', () => {
  it('flags shard files whose marketplace is not among the current groups', () => {
    const stale = computeStaleShardFiles(['current.json', 'gone.json'], new Set(['current']));
    expect(stale).toEqual(['gone.json']);
  });

  it('ignores non-JSON files', () => {
    expect(computeStaleShardFiles(['README.md', 'data.json.bak'], new Set())).toEqual([]);
  });

  it('flags everything when there are no current groups', () => {
    expect(computeStaleShardFiles(['a.json', 'b.json'], new Set())).toEqual(['a.json', 'b.json']);
  });

  it('returns nothing for an empty shard directory', () => {
    expect(computeStaleShardFiles([], new Set(['mp-1']))).toEqual([]);
  });
});
