import {
  selectPopularPlugins,
  topPluginsByStars,
  POPULAR_PLUGINS_POOL,
  CatalogPlugin,
} from '../usePluginData';

const plugin = (id: string, stars: number, marketplaceId: string): CatalogPlugin => ({
  id,
  name: `plugin-${id}`,
  description: '',
  version: '1.0.0',
  author: 'a',
  repositoryUrl: 'https://github.com/a/b',
  sourceUrl: 'https://github.com/a/b',
  skillsCount: 1,
  marketplaceId,
  marketplaceName: marketplaceId,
  stars,
});

const day = (n: number) => new Date(`2026-03-${String(n).padStart(2, '0')}T00:00:00Z`).getTime();

/** 24 plugins across 12 marketplaces — two per marketplace, stars descending. */
const plugins = Array.from({ length: 24 }, (_, i) =>
  plugin(String(i), 1200 - i * 50, `mp-${Math.floor(i / 2)}`)
);

describe('selectPopularPlugins', () => {
  it('shows the requested count', () => {
    expect(selectPopularPlugins(plugins, 9, day(5))).toHaveLength(9);
  });

  it('anchors the top two diversified picks on every day', () => {
    for (let d = 1; d <= 15; d++) {
      const top = selectPopularPlugins(plugins, 9, day(d)).slice(0, 2);
      expect(top.map((p) => p.id)).toEqual(['0', '2']);
    }
  });

  it('keeps the per-marketplace diversity pass in the pool', () => {
    for (let d = 1; d <= 15; d++) {
      const picked = selectPopularPlugins(plugins, 9, day(d));
      const marketplaceCounts = new Map<string, number>();
      for (const p of picked) {
        marketplaceCounts.set(p.marketplaceId, (marketplaceCounts.get(p.marketplaceId) || 0) + 1);
      }
      // Worst-case rotating window: 6 second-plugins (mp-0..mp-5) + 1
      // first-plugin that may overlap one of them → 6 distinct marketplaces
      // beyond... anchors mp-0/mp-1 add none new. Floor is 6.
      expect(marketplaceCounts.size).toBeGreaterThanOrEqual(6);
    }
  });

  it('rotates the non-anchored slots day over day', () => {
    const windows = [1, 2, 3, 4].map((d) =>
      selectPopularPlugins(plugins, 9, day(d))
        .slice(2)
        .map((p) => p.id)
    );
    expect(new Set(windows.map((w) => w.join(','))).size).toBeGreaterThan(1);
  });

  it('never draws from beyond the pool', () => {
    const poolIds = new Set(topPluginsByStars(plugins, POPULAR_PLUGINS_POOL).map((p) => p.id));
    for (let d = 1; d <= 15; d++) {
      for (const p of selectPopularPlugins(plugins, 9, day(d))) {
        expect(poolIds.has(p.id)).toBe(true);
      }
    }
  });

  it('degrades to the whole (diversified) pool when count covers it', () => {
    expect(selectPopularPlugins(plugins, 24, day(5))).toHaveLength(POPULAR_PLUGINS_POOL);
  });
});
