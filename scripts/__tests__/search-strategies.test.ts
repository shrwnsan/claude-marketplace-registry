import {
  buildSearchStrategies,
  SEARCH_STRATEGIES,
  STAR_BAND_STRATEGIES,
} from '../scan-marketplaces';

/** Star-band strategies carry their band in the name, e.g. 'topic-claude-skills-0-5'. */
const isStarBand = (name: string) => /^topic-claude-(skills|code)-[\d>]/.test(name);

describe('buildSearchStrategies', () => {
  const strategies = buildSearchStrategies();

  it('assembles core strategies first and star bands last', () => {
    expect(strategies).toEqual([...SEARCH_STRATEGIES, ...STAR_BAND_STRATEGIES]);
  });

  it('places every star band after every pre-existing strategy', () => {
    const firstBandIndex = strategies.findIndex((s) => isStarBand(s.name));
    expect(firstBandIndex).toBeGreaterThan(0);

    const coreNames = strategies.slice(0, firstBandIndex).map((s) => s.name);
    const bandNames = strategies.slice(firstBandIndex).map((s) => s.name);

    expect(coreNames.every((name) => !isStarBand(name))).toBe(true);
    expect(bandNames.every((name) => isStarBand(name))).toBe(true);
    // The core prefix is exactly the pre-existing list, untouched and in order.
    expect(coreNames).toEqual(SEARCH_STRATEGIES.map((s) => s.name));
  });

  it('keeps discovery source names unique across the assembled list', () => {
    const names = strategies.map((s) => s.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('STAR_BAND_STRATEGIES', () => {
  it('contains the expected bands for the high-volume topics', () => {
    expect(STAR_BAND_STRATEGIES.map((s) => [s.name, s.query])).toEqual([
      ['topic-claude-skills-0-5', 'topic:claude-skills stars:0..5'],
      ['topic-claude-skills-6-20', 'topic:claude-skills stars:6..20'],
      ['topic-claude-skills-21-100', 'topic:claude-skills stars:21..100'],
      ['topic-claude-skills-101-plus', 'topic:claude-skills stars:>100'],
      ['topic-claude-code-0-10', 'topic:claude-code-plugin stars:0..10'],
    ]);
  });

  it('pairs each band topic with exactly one well-formed stars range', () => {
    for (const strategy of STAR_BAND_STRATEGIES) {
      expect(strategy.query).toMatch(/topic:claude-[a-z-]+/);

      const starsQualifiers = strategy.query.match(/stars:\S+/g) ?? [];
      expect(starsQualifiers).toHaveLength(1);
      expect(starsQualifiers[0]).toMatch(/^stars:(>\d+|\d+\.\.\d+)$/);

      // Banding relies on the stars: qualifier, which only repo search honors.
      expect(strategy.type).toBe('repo');
    }
  });

  it('covers the claude-skills pool with disjoint, ascending star ranges', () => {
    const skillsBands = STAR_BAND_STRATEGIES.filter((s) =>
      s.name.startsWith('topic-claude-skills-')
    );
    expect(skillsBands.map((s) => s.query.match(/stars:(\S+)/)?.[1])).toEqual([
      '0..5',
      '6..20',
      '21..100',
      '>100',
    ]);
  });

  it('never adds a stars: qualifier to a code-search strategy', () => {
    // GitHub code search silently ignores stars: (0 rows, no error).
    for (const strategy of buildSearchStrategies()) {
      if (strategy.type === 'code') {
        expect(strategy.query).not.toContain('stars:');
      }
    }
  });
});
