import { countStarredMarketplaces, TRACTION_STAR_THRESHOLD } from '../generate-data';

describe('countStarredMarketplaces', () => {
  const marketplaces = [
    { stars: 0 },
    { stars: 5 },
    { stars: 9 },
    { stars: 10 },
    { stars: 150 },
    {}, // missing stars counts as zero
  ];

  it('counts marketplaces at or above the traction threshold', () => {
    expect(countStarredMarketplaces(marketplaces)).toBe(2); // 10 and 150
  });

  it('is threshold-parameterizable', () => {
    expect(countStarredMarketplaces(marketplaces, 50)).toBe(1);
    expect(countStarredMarketplaces(marketplaces, 1)).toBe(4); // 5, 9, 10, 150
  });

  it('matches the shipped threshold constant', () => {
    expect(TRACTION_STAR_THRESHOLD).toBe(10);
  });

  it('handles empty and zero catalogs', () => {
    expect(countStarredMarketplaces([])).toBe(0);
    expect(countStarredMarketplaces([{ stars: 0 }])).toBe(0);
  });
});
