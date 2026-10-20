/**
 * Mods SEO/AEO Tests
 *
 * The JSON-LD @graph is the page's answer-engine surface: the FAQ answers the
 * real "claude code mods" queries, the ItemList proves the directory is real,
 * and the graph must stay valid schema.org — these tests pin the structure.
 */

import { buildModsJsonLd, MODS_FAQ, MODS_META, ModSummary, SITE_URL } from '../mods-aeo';

const mod = (overrides: Partial<ModSummary> = {}): ModSummary => ({
  id: 'mp-1-safety-guard',
  name: 'safety-guard',
  description: 'Holds risky shell commands behind a confirmation pane.',
  modsCount: 2,
  marketplaceName: 'ecc',
  ...overrides,
});

describe('buildModsJsonLd', () => {
  it('builds a valid @graph with WebPage, FAQPage, BreadcrumbList, and ItemList', () => {
    const graph = buildModsJsonLd([mod()]);

    expect(graph['@context']).toBe('https://schema.org');
    const types = graph['@graph'].map((node) => node['@type']);
    expect(types).toEqual(['WebPage', 'FAQPage', 'BreadcrumbList', 'ItemList']);
  });

  it('anchors the WebPage and breadcrumbs at the /mods canonical URL', () => {
    const graph = buildModsJsonLd([]);
    const [webPage, , breadcrumb] = graph['@graph'];

    expect(webPage.url).toBe(`${SITE_URL}/mods`);
    expect(breadcrumb.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Mods', item: `${SITE_URL}/mods` },
    ]);
  });

  it('maps each mod to a SoftwareApplication list item with a plugin-page URL', () => {
    const graph = buildModsJsonLd([mod(), mod({ id: 'mp-2-sn', name: 'sn' })]);
    const itemList = graph['@graph'][3];

    expect(itemList.numberOfItems).toBe(2);
    const [first, second] = itemList.itemListElement;
    expect(first.item['@type']).toBe('SoftwareApplication');
    expect(first.item.name).toBe('safety-guard');
    expect(first.item.url).toBe(`${SITE_URL}/plugins/mp-1-safety-guard`);
    expect(second.position).toBe(2);
  });

  it('caps the ItemList at 30 entries so the HTML stays lean on a big corpus', () => {
    const many = Array.from({ length: 45 }, (_, i) => mod({ id: `mp-${i}-x`, name: `mod-${i}` }));
    const itemList = buildModsJsonLd(many)['@graph'][3];

    expect(itemList.itemListElement).toHaveLength(30);
    expect(itemList.numberOfItems).toBe(45);
  });

  it('carries every FAQ as a Question with an acceptedAnswer', () => {
    const faqPage = buildModsJsonLd([])['@graph'][1];

    expect(faqPage.mainEntity).toHaveLength(MODS_FAQ.length);
    for (const entry of faqPage.mainEntity) {
      expect(entry['@type']).toBe('Question');
      expect(entry.acceptedAnswer['@type']).toBe('Answer');
      expect(entry.acceptedAnswer.text.length).toBeGreaterThan(40);
    }
  });

  it('serializes to JSON without throwing (Head renders it via JSON.stringify)', () => {
    expect(() => JSON.stringify(buildModsJsonLd([mod()]))).not.toThrow();
  });
});

describe('MODS_META', () => {
  it('targets the head query without exceeding ~60/160 char limits', () => {
    expect(MODS_META.title).toMatch(/Claude Code Mods/i);
    expect(MODS_META.title.length).toBeLessThanOrEqual(60);
    expect(MODS_META.description.length).toBeLessThanOrEqual(160);
    expect(MODS_META.description).toMatch(/mods/i);
  });
});
