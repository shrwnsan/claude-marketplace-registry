/**
 * Display-value fallbacks for the detail pages' prerendered bodies.
 *
 * Precedence contract: the live client record wins once loaded, the
 * build-time record (baked into the static export) covers prerender and
 * no-JS crawlers, and the last-resort value keeps the page meaningful when
 * neither exists. Empty strings count as missing so a record with a blank
 * field falls through to the next source instead of rendering nothing.
 */

/** Text fields (name, description, author, ...). */
export function displayText(
  live: string | undefined,
  build: string | undefined,
  fallback: string
): string {
  return live || build || fallback;
}

/** Numeric fields (e.g. modsCount): first defined value, else 0. */
export function displayCount(live: number | undefined, build: number | undefined): number {
  return live ?? build ?? 0;
}
