import { triageSkipIds } from '../scan-marketplaces';

describe('triageSkipIds', () => {
  it('collects ids scored below the non-marketplace threshold', () => {
    const ids = triageSkipIds({
      '109': { isMarketplace: 0.02 },
      '110': { isMarketplace: 0.29 },
      '111': { isMarketplace: 0.3 },
      '112': { isMarketplace: 0.97 },
      '113': {},
    });
    expect(ids).toEqual(new Set(['109', '110']));
  });

  it('tolerates absent or malformed entries', () => {
    expect(triageSkipIds({})).toEqual(new Set());
    expect(triageSkipIds({ '1': undefined, '2': { isMarketplace: Number.NaN } })).toEqual(
      new Set()
    );
  });
});

import { retireTriagedEntries } from '../scan-marketplaces';

describe('retireTriagedEntries', () => {
  const skipIds = new Set(['109', '110']);

  it('retires triaged entries that have no verified manifest', () => {
    const repoMap = new Map([
      ['109', { id: '109', manifest: undefined }],
      ['110', { id: '110' }],
      ['111', { id: '111' }],
    ]);
    const retired = retireTriagedEntries(repoMap, skipIds);
    expect(retired).toEqual(['109', '110']);
    expect(repoMap.has('111')).toBe(true);
    expect(repoMap.size).toBe(1);
  });

  it('never retires entries with a verified manifest', () => {
    const repoMap = new Map([
      ['109', { id: '109', manifest: { plugins: [] } }],
      ['110', { id: '110', manifest: { plugins: [{ name: 'x' }] } }],
    ]);
    const retired = retireTriagedEntries(repoMap, skipIds);
    expect(retired).toEqual([]);
    expect(repoMap.size).toBe(2);
  });

  it('ignores entries outside the skip-list', () => {
    const repoMap = new Map([['999', { id: '999' }]]);
    expect(retireTriagedEntries(repoMap, skipIds)).toEqual([]);
    expect(repoMap.size).toBe(1);
  });
});
