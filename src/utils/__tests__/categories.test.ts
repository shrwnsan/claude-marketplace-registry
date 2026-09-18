import {
  MARKETPLACE_CATEGORIES,
  categoryForTopics,
  matchesCategory,
  countByCategory,
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
