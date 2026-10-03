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
 *
 * `step` is how many rotating cards turn over per day — the window slides
 * `step` positions daily so the refresh is actually visible (a step of 1
 * swaps just one card and reads as a static page to returning visitors).
 */
export function selectRotated<T>(
  ranked: T[],
  count: number,
  options: { poolSize?: number; anchorCount?: number; step?: number; now?: number } = {}
): T[] {
  const { poolSize = ranked.length, anchorCount = 3, step = 1, now = Date.now() } = options;
  const pool = ranked.slice(0, Math.min(poolSize, ranked.length));
  if (pool.length <= count) return pool;

  const anchors = pool.slice(0, Math.min(anchorCount, count));
  const rotators = pool.slice(anchors.length);
  const slots = count - anchors.length;
  if (slots <= 0 || rotators.length === 0) return anchors;

  const start = (dayOfYear(now) * step) % rotators.length;
  return [
    ...anchors,
    ...Array.from({ length: slots }, (_, i) => rotators[(start + i) % rotators.length]),
  ];
}

/** 1-based local day of year — the rotation clock (flips at the visitor's local midnight). */
function dayOfYear(now: number): number {
  return Math.floor(
    (now - new Date(new Date(now).getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
}

/**
 * Featured Marketplaces rotation knobs: 6 cards, 3 anchored flagships, and 2
 * of the 3 rotating slots turn over daily through the top-12 pool. The
 * homepage subtitle reads FEATURED_ROTATION_STEP, so the copy stays in sync
 * with the mechanism.
 */
export const FEATURED_ROTATION_STEP = 2;

/**
 * Shuffle pool for the homepage's Featured Marketplaces section: twice the
 * rotation pool, so a shuffle mostly shows cards the daily rotation isn't
 * showing.
 */
export const FEATURED_SHUFFLE_POOL = 24;

/** Rank marketplaces for featuring — the order the rotation and shuffle draw from. */
export function rankFeaturedMarketplaces<T extends FeaturedMarketplace>(marketplaces: T[]): T[] {
  return [...marketplaces].sort(
    (a, b) => featuredScore(b) - featuredScore(a) || String(a.id).localeCompare(String(b.id))
  );
}

/**
 * Deterministic daily rotation: the top-3 highest-scoring marketplaces are
 * anchored (flagships should not rotate away below mid-tier repos), and
 * FEATURED_ROTATION_STEP of the remaining slots rotate through the rest of
 * the top `poolSize` day by day.
 */
export function selectFeaturedMarketplaces<T extends FeaturedMarketplace>(
  marketplaces: T[],
  count = 6,
  poolSize = 12,
  now: number = Date.now()
): T[] {
  return selectRotated(rankFeaturedMarketplaces(marketplaces), count, {
    poolSize,
    anchorCount: 3,
    step: FEATURED_ROTATION_STEP,
    now,
  });
}

/**
 * Uniform random sample of `count` items via partial Fisher-Yates; the
 * returned order is shuffled. Backs the homepage shuffle affordance — an
 * explicit user action, so Math.random (non-deterministic) is fine here.
 */
export function shuffleSample<T>(items: T[], count: number): T[] {
  const pool = items.slice();
  const take = Math.min(Math.max(count, 0), pool.length);
  for (let i = 0; i < take; i++) {
    const j = i + Math.floor(Math.random() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, take);
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
