import { selectFeaturedMarketplaces, featuredScore } from '../stats';

// Freeze time-sensitive bonuses at a fixed date
const recent = new Date().toISOString();
const old = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString();

describe('featuredScore', () => {
  it('weights stars logarithmically', () => {
    const low = featuredScore({ id: 'a', stars: 10 });
    const mid = featuredScore({ id: 'b', stars: 1000 });
    const high = featuredScore({ id: 'c', stars: 100000 });
    expect(mid).toBeGreaterThan(low);
    expect(high).toBeGreaterThan(mid);
    // Diminishing returns: 10x stars does not mean 10x score
    expect(high - mid).toBeLessThan(mid - low + 5);
  });

  it('bonuses recency and manifest presence', () => {
    const base = featuredScore({ id: 'a', stars: 1000, updatedAt: old });
    const withRecency = featuredScore({ id: 'a', stars: 1000, updatedAt: recent });
    const withManifest = featuredScore({ id: 'a', stars: 1000, updatedAt: old, hasManifest: true });
    expect(withRecency).toBeGreaterThan(base);
    expect(withManifest).toBeGreaterThan(base);
  });
});

describe('selectFeaturedMarketplaces', () => {
  const marketplaces = Array.from({ length: 30 }, (_, i) => ({
    id: String(i),
    name: `market-${i}`,
    stars: (30 - i) * 100,
    updatedAt: recent,
    hasManifest: true,
    topics: ['claude-code'],
  }));

  it('returns the requested count', () => {
    expect(selectFeaturedMarketplaces(marketplaces, 6)).toHaveLength(6);
  });

  it('only selects from the high-score pool', () => {
    const featured = selectFeaturedMarketplaces(marketplaces, 6, 10);
    for (const item of featured) {
      expect(Number(item.id)).toBeLessThan(10);
    }
  });

  it('rotates deterministically day over day (stable within a day)', () => {
    const a = selectFeaturedMarketplaces(marketplaces, 6);
    const b = selectFeaturedMarketplaces(marketplaces, 6);
    expect(a.map((m) => m.id)).toEqual(b.map((m) => m.id));
  });

  it('handles fewer marketplaces than the requested count', () => {
    const few = marketplaces.slice(0, 3);
    expect(selectFeaturedMarketplaces(few, 6)).toHaveLength(3);
  });

  it('handles an empty list', () => {
    expect(selectFeaturedMarketplaces([], 6)).toEqual([]);
  });
});
