/**
 * Shared SEO helper tests — the builders behind every page's JSON-LD and
 * canonical URLs (site-wide rollout of the #456 mods pattern).
 */

import {
  SITE_URL,
  canonicalUrl,
  buildWebPageJsonLd,
  buildBreadcrumbJsonLd,
  buildSoftwareApplicationJsonLd,
} from '../seo';

describe('canonicalUrl', () => {
  it('joins the site URL with the in-site path', () => {
    expect(canonicalUrl('/plugins')).toBe(`${SITE_URL}/plugins`);
    expect(canonicalUrl('/')).toBe(`${SITE_URL}/`);
  });
});

describe('buildWebPageJsonLd', () => {
  it('builds a WebPage node with the canonical URL', () => {
    expect(
      buildWebPageJsonLd({ name: 'All Plugins', description: 'Browse plugins.', path: '/plugins' })
    ).toEqual({
      '@type': 'WebPage',
      name: 'All Plugins',
      description: 'Browse plugins.',
      url: `${SITE_URL}/plugins`,
    });
  });
});

describe('buildBreadcrumbJsonLd', () => {
  it('numbers trail positions from 1 and canonicalizes each crumb', () => {
    const trail = buildBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Plugins', path: '/plugins' },
      { name: 'sn', path: '/plugins/1-sn' },
    ]);

    expect(trail['@type']).toBe('BreadcrumbList');
    expect(trail.itemListElement.map((c) => c.position)).toEqual([1, 2, 3]);
    expect(trail.itemListElement[2].item).toBe(`${SITE_URL}/plugins/1-sn`);
  });

  it('handles an empty trail', () => {
    expect(buildBreadcrumbJsonLd([]).itemListElement).toEqual([]);
  });
});

describe('buildSoftwareApplicationJsonLd', () => {
  it('types the plugin as a DeveloperApplication on Claude Code', () => {
    const node = buildSoftwareApplicationJsonLd({
      name: 'safety-guard',
      description: 'Guards risky commands.',
      pluginPath: '/plugins/mp-1-safety-guard',
    });

    expect(node).toEqual({
      '@type': 'SoftwareApplication',
      name: 'safety-guard',
      description: 'Guards risky commands.',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Claude Code',
      url: `${SITE_URL}/plugins/mp-1-safety-guard`,
    });
  });
});
