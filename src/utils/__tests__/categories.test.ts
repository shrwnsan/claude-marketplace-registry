import {
  MARKETPLACE_CATEGORIES,
  categoryForTopics,
  matchesCategory,
  marketplaceMatchesCategory,
  categoryForMarketplace,
  countByCategory,
  MIN_INFERRED_CONFIDENCE,
} from '../categories';

describe('categoryForTopics', () => {
  it('maps raw topics onto functional categories', () => {
    expect(categoryForTopics(['mcp', 'claude-code'])?.id).toBe('mcp');
    expect(categoryForTopics(['agent-skills'])?.id).toBe('skills');
    expect(categoryForTopics(['ai-agents', 'anthropic'])?.id).toBe('agents');
    expect(categoryForTopics(['workflow-automation'])?.id).toBe('automation');
    expect(categoryForTopics(['developer-tools'])?.id).toBe('devtools');
    expect(categoryForTopics(['llm', 'prompts'])?.id).toBe('llm');
  });

  it('is case-insensitive and null for unmatched sets', () => {
    expect(categoryForTopics(['MCP'])?.id).toBe('mcp');
    expect(categoryForTopics(['cursor', 'memory'])).toBeNull();
    expect(categoryForTopics([])).toBeNull();
    expect(categoryForTopics(undefined)).toBeNull();
  });
});

describe('matchesCategory', () => {
  const topics = ['mcp', 'claude-code'];

  it('matches category ids through their aliases', () => {
    expect(matchesCategory(topics, 'mcp')).toBe(true);
    expect(matchesCategory(topics, 'skills')).toBe(false);
  });

  it('still supports raw topic deep links (?topic=)', () => {
    expect(matchesCategory(topics, 'claude-code')).toBe(true);
    expect(matchesCategory(topics, 'MCP')).toBe(true);
    expect(matchesCategory(topics, 'skills')).toBe(false);
  });

  it('treats All as match-everything', () => {
    expect(matchesCategory(undefined, 'All')).toBe(true);
    expect(matchesCategory([], 'All')).toBe(true);
  });
});

describe('countByCategory', () => {
  it('counts each marketplace once, under its first matching category', () => {
    const items = [
      { topics: ['mcp', 'ai-agents'] },
      { topics: ['mcp'] },
      { topics: ['agent-skills'] },
      { topics: ['cursor'] },
    ];
    const counts = countByCategory(items);
    expect(counts['mcp']).toBe(2);
    expect(counts['skills']).toBe(1);
    expect(counts['agents']).toBe(0);
  });

  it('initialises every category to zero', () => {
    const counts = countByCategory([]);
    expect(Object.keys(counts)).toHaveLength(MARKETPLACE_CATEGORIES.length);
    expect(Object.values(counts).every((c) => c === 0)).toBe(true);
  });
});

describe('categoryForMarketplace', () => {
  it('prefers topic aliases over the Jev-inferred hint', () => {
    expect(
      categoryForMarketplace({
        topics: ['mcp'],
        inferredCategory: { id: 'skills', confidence: 0.99 },
      })?.id
    ).toBe('mcp');
  });

  it('falls back to the inferred category when no alias matches', () => {
    expect(
      categoryForMarketplace({ topics: ['cursor'], inferredCategory: { id: 'devtools' } })?.id
    ).toBe('devtools');
  });

  it('ignores low-confidence inferences', () => {
    const below = MIN_INFERRED_CONFIDENCE - 0.01;
    expect(
      categoryForMarketplace({
        topics: ['cursor'],
        inferredCategory: { id: 'llm', confidence: below },
      })
    ).toBeNull();
  });

  it('ignores unknown category ids and missing hints', () => {
    expect(categoryForMarketplace({ topics: [], inferredCategory: { id: 'crypto' } })).toBeNull();
    expect(categoryForMarketplace({ topics: [] })).toBeNull();
    expect(categoryForMarketplace({ topics: [], inferredCategory: {} })).toBeNull();
  });
});

describe('marketplaceMatchesCategory', () => {
  const marketplace = {
    topics: ['cursor'],
    inferredCategory: { id: 'automation', confidence: 0.8 },
  };

  it('matches a curated category through the inferred hint', () => {
    expect(marketplaceMatchesCategory(marketplace, 'automation')).toBe(true);
    expect(marketplaceMatchesCategory(marketplace, 'mcp')).toBe(false);
  });

  it('still supports raw topic deep links (?topic=)', () => {
    expect(marketplaceMatchesCategory(marketplace, 'cursor')).toBe(true);
    expect(marketplaceMatchesCategory(marketplace, 'Cursor')).toBe(true);
    expect(marketplaceMatchesCategory(marketplace, 'docker')).toBe(false);
  });

  it('treats All as match-everything', () => {
    expect(marketplaceMatchesCategory({ topics: [] }, 'All')).toBe(true);
  });
});

describe('countByCategory with inferred categories', () => {
  it('counts Jev-only marketplaces into their category', () => {
    const counts = countByCategory([
      { topics: ['mcp'] },
      { topics: ['cursor'], inferredCategory: { id: 'skills', confidence: 0.9 } },
      { topics: ['other'], inferredCategory: { id: 'llm', confidence: 0.2 } },
    ]);
    expect(counts['skills']).toBe(1);
    expect(counts['llm']).toBe(0);
  });
});
