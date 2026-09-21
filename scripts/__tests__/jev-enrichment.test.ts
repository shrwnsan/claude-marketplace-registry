import {
  NONE_CATEGORY,
  applyJevEnrichment,
  buildCategoryCriteria,
  buildQuestions,
  buildState,
} from '../jev-categorize';
import { MARKETPLACE_CATEGORIES } from '../../src/utils/categories';

describe('buildCategoryCriteria', () => {
  it('stays in lockstep with the curated frontend categories', () => {
    const keys = Object.keys(buildCategoryCriteria());
    expect(keys).toEqual([...MARKETPLACE_CATEGORIES.map((c) => c.id), NONE_CATEGORY]);
  });

  it('describes every criterion', () => {
    for (const description of Object.values(buildCategoryCriteria())) {
      expect(description.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('buildQuestions', () => {
  it('asks one category choice and one marketplace-triage noul', () => {
    const questions = buildQuestions();
    expect(questions.category.type).toBe('choice');
    expect(questions.isMarketplace.type).toBe('noul');
    expect(Object.keys(questions.category.criteria)).toHaveLength(
      MARKETPLACE_CATEGORIES.length + 1
    );
  });
});

describe('buildState', () => {
  it('carries the fields Jev needs and trims long descriptions', () => {
    const state = buildState({
      id: '1',
      name: 'sample',
      description: 'x'.repeat(2000),
      url: 'https://github.com/a/sample',
      stars: 12,
      forks: 3,
      language: 'TypeScript',
      topics: ['t1', 't2'],
      hasManifest: true,
    });
    expect((state.description as string).length).toBe(600);
    expect(state.topics).toEqual(['t1', 't2']);
    expect(state.language).toBe('TypeScript');
    expect(state.hasManifest).toBe(true);
  });

  it('omits absent optional fields', () => {
    const state = buildState({
      id: '2',
      name: 'bare',
      description: '',
      url: 'https://github.com/a/bare',
      stars: 0,
      forks: 0,
    });
    expect('language' in state).toBe(false);
    expect('topics' in state).toBe(false);
  });
});

describe('applyJevEnrichment', () => {
  const marketplaces = [
    { id: '1', name: 'aliased', topics: ['mcp'] },
    { id: '2', name: 'jev-mcp', topics: ['random'] },
    { id: '3', name: 'jev-none', topics: [] },
    { id: '4', name: 'stale-id', topics: [] },
    { id: '5', name: 'unclassified', topics: [] },
  ];

  const enrichment = {
    model: 'jev-1.13.0',
    generatedAt: '2026-09-22T00:00:00Z',
    entries: {
      '2': { category: 'mcp', categoryConfidence: 0.91, isMarketplace: 0.97 },
      '3': { category: NONE_CATEGORY, categoryConfidence: 0.6, isMarketplace: 0.4 },
      '4': { category: 'category-that-no-longer-exists', categoryConfidence: 0.9 },
    },
  };

  it('attaches inferred categories only for valid curated ids', () => {
    const [aliased, jevMcp, jevNone, stale, untouched] = applyJevEnrichment(
      marketplaces,
      enrichment
    );
    expect(aliased.inferredCategory).toBeUndefined();
    expect(jevMcp.inferredCategory).toEqual({
      id: 'mcp',
      confidence: 0.91,
      model: 'jev-1.13.0',
    });
    expect(jevNone.inferredCategory).toBeUndefined();
    expect(stale.inferredCategory).toBeUndefined();
    expect(untouched.inferredCategory).toBeUndefined();
  });

  it('is a no-op without enrichment data', () => {
    const result = applyJevEnrichment(marketplaces, null);
    expect(result).toEqual(marketplaces);
  });
});
