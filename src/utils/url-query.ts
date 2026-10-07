/**
 * Builds the next query record for a listing page's shallow router.replace.
 *
 * router.query carries whatever param names the visitor put in their own
 * URL, so copying it wholesale hands user-controlled property names to
 * computed-key writes (CodeQL js/remote-property-injection). Reading values
 * through a static allowlist keeps `__proto__`/`constructor`/junk params out
 * of the rebuilt query instead of round-tripping them forever.
 */
export function pickQueryParams(
  current: Record<string, string | string[] | undefined>,
  patch: Record<string, string>,
  allowedKeys: readonly string[]
): Record<string, string> {
  const merged: Record<string, string | string[] | undefined> = { ...current, ...patch };
  const query: Record<string, string> = {};
  for (const key of allowedKeys) {
    const value = merged[key];
    if (typeof value === 'string' && value) query[key] = value;
  }
  return query;
}
