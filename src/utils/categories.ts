/**
 * Curated marketplace categories.
 *
 * Raw GitHub topics are noisy as filters ("claude-code" matches 70% of the
 * catalog, "anthropic" says nothing about function). These buckets map the
 * real topic distribution onto a small set of functional categories. Counts
 * are always computed from loaded marketplace data — nothing is invented.
 */

export interface MarketplaceCategory {
  id: string;
  label: string;
  /** Raw GitHub topics that satisfy this category (lowercase). */
  aliases: string[];
}

export const MARKETPLACE_CATEGORIES: MarketplaceCategory[] = [
  {
    id: 'mcp',
    label: 'MCP servers',
    aliases: ['mcp', 'mcp-server', 'mcp-servers', 'model-context-protocol'],
  },
  {
    id: 'skills',
    label: 'Skill collections',
    aliases: ['skills', 'skill', 'agent-skills', 'claude-skills', 'claude-skill', 'skill-library'],
  },
  {
    id: 'agents',
    label: 'AI agents',
    aliases: ['ai-agents', 'agents', 'agent', 'autonomous-agents'],
  },
  {
    id: 'automation',
    label: 'Workflow & automation',
    aliases: ['automation', 'workflow', 'workflow-automation', 'productivity'],
  },
  {
    id: 'devtools',
    label: 'Dev tools',
    aliases: ['developer-tools', 'devtools', 'tooling', 'cli', 'terminal'],
  },
  {
    id: 'llm',
    label: 'LLM & prompting',
    aliases: ['llm', 'prompts', 'prompt', 'prompt-engineering', 'generative-ai'],
  },
];

/** The category a topic set belongs to, or null when it matches none. */
export function categoryForTopics(topics: string[] | undefined): MarketplaceCategory | null {
  if (!Array.isArray(topics) || topics.length === 0) return null;
  const lower = new Set(topics.map((t) => String(t).toLowerCase()));
  return MARKETPLACE_CATEGORIES.find((c) => c.aliases.some((a) => lower.has(a))) ?? null;
}

/** True when the topic set satisfies the category (raw topic ids included). */
export function matchesCategory(topics: string[] | undefined, categoryIdOrTopic: string): boolean {
  if (categoryIdOrTopic === 'All') return true;
  const category = MARKETPLACE_CATEGORIES.find((c) => c.id === categoryIdOrTopic);
  if (category) return categoryForTopics(topics)?.id === category.id;
  return (
    Array.isArray(topics) && topics.some((t) => t.toLowerCase() === categoryIdOrTopic.toLowerCase())
  );
}

/** Marketplace count per category id, from real data. */
export function countByCategory<T extends { topics?: string[]; inferredCategory?: CategoryHint }>(
  items: T[]
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const category of MARKETPLACE_CATEGORIES) counts[category.id] = 0;
  for (const item of items) {
    const match = categoryForMarketplace(item);
    if (match) counts[match.id] += 1;
  }
  return counts;
}

/** The pipeline-attached Jev verdict for marketplaces no topic alias classifies. */
export interface CategoryHint {
  id?: string;
  confidence?: number;
}

/**
 * Below this confidence a Jev-inferred category is ignored entirely — the
 * marketplace simply stays uncategorized. Topic aliases always win, so this
 * only ever fills gaps, never overrides a deterministic match.
 */
export const MIN_INFERRED_CONFIDENCE = 0.6;

/**
 * Resolve a marketplace's curated category: topic aliases first (the
 * deterministic path), then the pipeline's Jev-inferred category when it is
 * confident enough and still names a known category id.
 */
export function categoryForMarketplace<
  T extends { topics?: string[]; inferredCategory?: CategoryHint },
>(marketplace: T): MarketplaceCategory | null {
  const byTopic = categoryForTopics(marketplace.topics);
  if (byTopic) return byTopic;
  const hint = marketplace.inferredCategory;
  if (!hint || typeof hint.id !== 'string') return null;
  if (typeof hint.confidence === 'number' && hint.confidence < MIN_INFERRED_CONFIDENCE) {
    return null;
  }
  return MARKETPLACE_CATEGORIES.find((c) => c.id === hint.id) ?? null;
}

/**
 * Filter predicate for the marketplaces list: category ids (via aliases or
 * inference) and raw GitHub topic deep links (?topic=) alike.
 */
export function marketplaceMatchesCategory<
  T extends { topics?: string[]; inferredCategory?: CategoryHint },
>(marketplace: T, categoryIdOrTopic: string): boolean {
  if (categoryIdOrTopic === 'All') return true;
  const category = MARKETPLACE_CATEGORIES.find((c) => c.id === categoryIdOrTopic);
  if (category) return categoryForMarketplace(marketplace)?.id === category.id;
  const topics = marketplace.topics;
  return (
    Array.isArray(topics) && topics.some((t) => t.toLowerCase() === categoryIdOrTopic.toLowerCase())
  );
}
