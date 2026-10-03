import {
  selectFeaturedMarketplaces,
  featuredScore,
  hasEnoughHistory,
  GROWTH_LINE_MIN_POINTS,
  topicShare,
  FEATURED_ROTATION_STEP,
  shuffleSample,
} from '../stats';

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

  it('anchors the top-3 by score — flagships never rotate away', () => {
    for (let day = 1; day <= 30; day++) {
      const now = new Date(`2026-01-${String(day).padStart(2, '0')}T00:00:00Z`).getTime();
      const featured = selectFeaturedMarketplaces(marketplaces, 6, 12, now);
      expect(featured.slice(0, 3).map((m) => m.id)).toEqual(['0', '1', '2']);
    }
  });

  it('still varies the remaining slots day over day', () => {
    const jan1 = selectFeaturedMarketplaces(
      marketplaces,
      6,
      12,
      new Date('2026-01-01T00:00:00Z').getTime()
    ).slice(3);
    const feb1 = selectFeaturedMarketplaces(
      marketplaces,
      6,
      12,
      new Date('2026-02-01T00:00:00Z').getTime()
    ).slice(3);
    expect(jan1.map((m) => m.id)).not.toEqual(feb1.map((m) => m.id));
  });

  it('turns over FEATURED_ROTATION_STEP cards per day', () => {
    const jan1 = selectFeaturedMarketplaces(
      marketplaces,
      6,
      12,
      new Date('2026-01-01T00:00:00Z').getTime()
    );
    const jan2 = selectFeaturedMarketplaces(
      marketplaces,
      6,
      12,
      new Date('2026-01-02T00:00:00Z').getTime()
    );
    const jan1Ids = new Set(jan1.map((m) => m.id));
    const fresh = jan2.filter((m) => !jan1Ids.has(m.id)).length;
    expect(fresh).toBe(FEATURED_ROTATION_STEP);
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

describe('hasEnoughHistory', () => {
  it('stays on big-number deltas until the line-chart threshold', () => {
    expect(hasEnoughHistory(0)).toBe(false);
    expect(hasEnoughHistory(1)).toBe(false);
    expect(hasEnoughHistory(GROWTH_LINE_MIN_POINTS - 1)).toBe(false);
    expect(hasEnoughHistory(GROWTH_LINE_MIN_POINTS)).toBe(true);
    expect(hasEnoughHistory(30)).toBe(true);
  });
});

describe('topicShare', () => {
  it('computes share of catalog with one decimal', () => {
    expect(topicShare(1, 3)).toBe(33.3);
    expect(topicShare(1, 4)).toBe(25);
    expect(topicShare(0, 100)).toBe(0);
  });

  it('never divides by zero', () => {
    expect(topicShare(5, 0)).toBe(0);
  });
});

import { selectRotated } from '../stats';

describe('selectRotated', () => {
  const ranked = Array.from({ length: 20 }, (_, i) => ({ id: String(i) }));
  const day = (n: number) => new Date(`2026-02-${String(n).padStart(2, '0')}T00:00:00Z`).getTime();

  it('is deterministic for a given instant', () => {
    const a = selectRotated(ranked, 6, { poolSize: 12, anchorCount: 3, now: day(10) });
    const b = selectRotated(ranked, 6, { poolSize: 12, anchorCount: 3, now: day(10) });
    expect(a).toEqual(b);
  });

  it('anchors the top entries regardless of the day', () => {
    for (let d = 1; d <= 20; d++) {
      expect(
        selectRotated(ranked, 6, { poolSize: 12, anchorCount: 3, now: day(d) }).slice(0, 3)
      ).toEqual([{ id: '0' }, { id: '1' }, { id: '2' }]);
    }
  });

  it('advances the rotating window day over day', () => {
    const windows = [1, 2, 3, 4].map((d) =>
      selectRotated(ranked, 6, { poolSize: 12, anchorCount: 3, now: day(d) })
        .slice(3)
        .map((x) => x.id)
    );
    expect(new Set(windows.map((w) => w.join(','))).size).toBeGreaterThan(1);
  });

  it('stays inside the pool and never repeats within a day', () => {
    for (let d = 1; d <= 14; d++) {
      const out = selectRotated(ranked, 6, { poolSize: 12, anchorCount: 3, now: day(d) });
      const ids = out.map((x) => x.id);
      expect(ids).toHaveLength(new Set(ids).size);
      for (const id of ids) expect(Number(id)).toBeLessThan(12);
    }
  });

  it('returns the whole pool when count covers it', () => {
    expect(selectRotated(ranked, 20, { poolSize: 12, anchorCount: 3, now: day(5) })).toHaveLength(
      12
    );
  });

  it('steps multiple rotating cards per day when step > 1', () => {
    const day1 = selectRotated(ranked, 6, { poolSize: 12, anchorCount: 3, step: 2, now: day(1) });
    const day2 = selectRotated(ranked, 6, { poolSize: 12, anchorCount: 3, step: 2, now: day(2) });
    const day1Ids = new Set(day1.map((x) => x.id));
    expect(day2.filter((x) => !day1Ids.has(x.id))).toHaveLength(2);
  });
});

describe('shuffleSample', () => {
  const items = Array.from({ length: 12 }, (_, i) => i);

  it('returns distinct items drawn from the source', () => {
    for (let trial = 0; trial < 20; trial++) {
      const out = shuffleSample(items, 6);
      expect(out).toHaveLength(6);
      expect(new Set(out).size).toBe(6);
      for (const x of out) expect(items).toContain(x);
    }
  });

  it('covers the whole list when count reaches it', () => {
    const out = shuffleSample(items, 12);
    expect([...out].sort((a, b) => a - b)).toEqual(items);
  });

  it('degrades on short or empty input', () => {
    expect(shuffleSample([1, 2], 5)).toHaveLength(2);
    expect(shuffleSample([], 3)).toEqual([]);
  });
});
