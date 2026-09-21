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
