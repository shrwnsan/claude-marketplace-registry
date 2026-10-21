/**
 * Shared SEO/AEO helpers for every page.
 *
 * Conventions established in #456 (mods) and rolled out site-wide:
 * - Each page declares its OWN canonical in its <Head> — there is no
 *   document-level canonical (it marked every deep page a duplicate of `/`).
 * - Page <Head> must render in ALL return paths (loading/error included):
 *   the static export bakes whatever head exists at prerender time, and
 *   prerender usually sees the loading state.
 * - SITE_URL already contains the GitHub Pages repo path — never append
 *   NEXT_PUBLIC_BASE_PATH to it (double path in CI builds).
 */

export const SITE_URL = 'https://shrwnsan.github.io/claude-marketplace-registry';

/** Canonical absolute URL for an in-site path ('/plugins', '/mods', …). */
export function canonicalUrl(path: string): string {
  return `${SITE_URL}${path}`;
}

/** Compact JSON-LD WebPage node. */
export function buildWebPageJsonLd(params: { name: string; description: string; path: string }): {
  '@type': 'WebPage';
  name: string;
  description: string;
  url: string;
} {
  return {
    '@type': 'WebPage',
    name: params.name,
    description: params.description,
    url: canonicalUrl(params.path),
  };
}

/** BreadcrumbList from Home → the given trail. */
export function buildBreadcrumbJsonLd(trail: Array<{ name: string; path: string }>): {
  '@type': 'BreadcrumbList';
  itemListElement: Array<{ '@type': 'ListItem'; position: number; name: string; item: string }>;
} {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: canonicalUrl(crumb.path),
    })),
  };
}

/** SoftwareApplication node for a plugin (or mod-carrying plugin) page. */
export function buildSoftwareApplicationJsonLd(params: {
  name: string;
  description: string;
  pluginPath: string;
}): {
  '@type': 'SoftwareApplication';
  name: string;
  description: string;
  applicationCategory: string;
  operatingSystem: string;
  url: string;
} {
  return {
    '@type': 'SoftwareApplication',
    name: params.name,
    description: params.description,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Claude Code',
    url: canonicalUrl(params.pluginPath),
  };
}
