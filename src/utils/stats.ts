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
 * Deterministic daily rotation core: anchor the top entries (flagships don't
 * rotate away), rotate the remaining slots through the rest of the pool day
 * by day. Shared by the homepage's Featured Marketplaces and Popular Plugins
 * sections so both rotate on the same tested code path.
 */
export function selectRotated<T>(
  ranked: T[],
  count: number,
  options: { poolSize?: number; anchorCount?: number; now?: number } = {}
): T[] {
  const { poolSize = ranked.length, anchorCount = 3, now = Date.now() } = options;
  const pool = ranked.slice(0, Math.min(poolSize, ranked.length));
  if (pool.length <= count) return pool;

  const anchors = pool.slice(0, Math.min(anchorCount, count));
  const rotators = pool.slice(anchors.length);
  const slots = count - anchors.length;
  if (slots <= 0 || rotators.length === 0) return anchors;

  const dayOfYear = Math.floor(
    (now - new Date(new Date(now).getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  const offset = dayOfYear % rotators.length;
  return [
    ...anchors,
    ...Array.from({ length: slots }, (_, i) => rotators[(offset + i) % rotators.length]),
  ];
}

/**
 * Deterministic daily rotation: the top-3 highest-scoring marketplaces are
 * anchored (flagships should not rotate away below mid-tier repos), and the
 * remaining slots rotate through the rest of the top `poolSize` day by day.
 */
export function selectFeaturedMarketplaces<T extends FeaturedMarketplace>(
  marketplaces: T[],
  count = 6,
  poolSize = 12,
  now: number = Date.now()
): T[] {
  const ranked = [...marketplaces].sort(
    (a, b) => featuredScore(b) - featuredScore(a) || String(a.id).localeCompare(String(b.id))
  );
  return selectRotated(ranked, count, { poolSize, anchorCount: 3, now });
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
