/**
 * Stats selection utilities
 *
 * All ecosystem metrics come from the generated stats.json — these helpers
 * only handle client-side selection (e.g. daily featured rotation).
 */

interface FeaturedMarketplace {
  id: string | number;
  name?: string;
  description?: string;
  url?: string;
  stars?: number;
  updatedAt?: string;
  hasManifest?: boolean;
  topics?: string[];
}

/**
 * Score a marketplace for featuring: star weight (log-scaled so a 170k-star
 * repo doesn't crowd out everything), plus recency and manifest bonuses.
 */
export function featuredScore(m: FeaturedMarketplace): number {
  const stars = m.stars || 0;
  const recencyBonus = m.updatedAt
    ? Date.now() - new Date(m.updatedAt).getTime() < 90 * 24 * 60 * 60 * 1000
      ? 1
      : 0
    : 0;
  return Math.log10(stars + 1) * 2 + recencyBonus + (m.hasManifest ? 0.5 : 0);
}

/**
 * Deterministic daily rotation: rank by score, take a rotating window over the
 * top `poolSize`, so the featured set changes every day without a server.
 */
export function selectFeaturedMarketplaces<T extends FeaturedMarketplace>(
  marketplaces: T[],
  count = 6,
  poolSize = 12
): T[] {
  const ranked = [...marketplaces].sort(
    (a, b) => featuredScore(b) - featuredScore(a) || String(a.id).localeCompare(String(b.id))
  );
  const pool = ranked.slice(0, Math.min(poolSize, ranked.length));
  if (pool.length <= count) return pool;
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  const offset = dayOfYear % pool.length;
  return Array.from({ length: count }, (_, i) => pool[(offset + i) % pool.length]);
}

/**
 * A 2-point "line" reads as noise, so the growth chart stays on big-number
 * deltas until this many daily snapshots exist.
 */
export const GROWTH_LINE_MIN_POINTS = 5;

export function hasEnoughHistory(pointCount: number): boolean {
  return pointCount >= GROWTH_LINE_MIN_POINTS;
}

/** Share of the catalog a topic covers, in percent with one decimal. */
export function topicShare(count: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((count / total) * 1000) / 10;
}
