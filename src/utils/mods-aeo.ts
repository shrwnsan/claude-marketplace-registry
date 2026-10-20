/**
 * SEO/AEO structured data for the /mods landing page.
 *
 * Pure builders so the JSON-LD is unit-testable and the page stays a thin
 * renderer. Everything here targets answer engines (Google AI Overviews,
 * Perplexity, ChatGPT browse) and rich results for "claude code mods"
 * queries: the FAQPage carries the extractable answers, the ItemList (built
 * from scan data at static-export time) proves the directory is real, and
 * the BreadcrumbList anchors sitelinks.
 */

// Site-wide SEO constants live in seo.ts since the #456 rollout; re-exported
// here so existing mods consumers and tests keep their import paths.
import { SITE_URL } from './seo';
export { SITE_URL };

/** Minimal mod shape the page needs for the ItemList (from build-time data). */
export interface ModSummary {
  id: string;
  name: string;
  description: string;
  modsCount: number;
  marketplaceName: string;
}

/** The queries people actually search after seeing mods on socials. */
export const MODS_FAQ: Array<{ question: string; answer: string }> = [
  {
    question: 'What are Claude Code mods?',
    answer:
      'Mods are small TypeScript hook modules that ship inside Claude Code plugins. They observe session events as they happen — guarding risky commands, metering token spend, and drawing live terminal UI. Mods are on by default in Claude Code v2.1.287 and later.',
  },
  {
    question: 'How do I install a Claude Code mod?',
    answer:
      'Mods install as plugins from a marketplace. In Claude Code, run /plugin marketplace add owner/repo, then /plugin install mod-name@marketplace. No separate install step exists — a mod is a plugin with a hook module.',
  },
  {
    question: 'Where can I find Claude Code mods?',
    answer:
      "The Claude Marketplace Registry scans GitHub nightly and indexes every marketplace plugin that ships mods. This page is that live directory — every listing links to the mod's source repository.",
  },
  {
    question: 'Are Claude Code mods safe?',
    answer:
      'Mods run with the same access as Claude Code itself and are not sandboxed: they can observe and rewrite tool calls. Vet the publisher and read the source before installing — every listing here links straight to it.',
  },
];

/** Page-level meta tuned to the head query and its long-tail. */
export const MODS_META = {
  title: 'Claude Code Mods: Browse, Vet & Install Hook Modules',
  description:
    'Browse Claude Code mods found by nightly GitHub scans — guards, spend meters, and terminal UI hooks that install as plugins. Source links for every mod.',
};

/** JSON-LD @graph for the /mods page. `mods` may be empty (gate hidden). */
export interface ModsJsonLd {
  '@context': string;
  '@graph': [
    {
      '@type': 'WebPage';
      name: string;
      description: string;
      url: string;
      isPartOf: { '@id': string };
      about: { '@type': string; name: string };
    },
    {
      '@type': 'FAQPage';
      mainEntity: Array<{
        '@type': 'Question';
        name: string;
        acceptedAnswer: { '@type': 'Answer'; text: string };
      }>;
    },
    {
      '@type': 'BreadcrumbList';
      itemListElement: Array<{
        '@type': 'ListItem';
        position: number;
        name: string;
        item: string;
      }>;
    },
    {
      '@type': 'ItemList';
      name: string;
      numberOfItems: number;
      itemListElement: Array<{
        '@type': 'ListItem';
        position: number;
        item: Record<string, string>;
      }>;
    },
  ];
}

export function buildModsJsonLd(mods: ModSummary[]): ModsJsonLd {
  const pageUrl = `${SITE_URL}/mods`;

  const faqPage: ModsJsonLd['@graph'][1] = {
    '@type': 'FAQPage',
    mainEntity: MODS_FAQ.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };

  const breadcrumb: ModsJsonLd['@graph'][2] = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Mods', item: pageUrl },
    ],
  };

  const itemList: ModsJsonLd['@graph'][3] = {
    '@type': 'ItemList',
    name: 'Claude Code mods',
    numberOfItems: mods.length,
    itemListElement: mods.slice(0, 30).map((mod, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'SoftwareApplication',
        name: mod.name,
        description: mod.description || `${mod.name} — Claude Code mod`,
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Claude Code',
        url: `${SITE_URL}/plugins/${mod.id}`,
      },
    })),
  };

  const webPage: ModsJsonLd['@graph'][0] = {
    '@type': 'WebPage',
    name: MODS_META.title,
    description: MODS_META.description,
    url: pageUrl,
    isPartOf: { '@id': `${SITE_URL}/` },
    about: { '@type': 'Thing', name: 'Claude Code mods' },
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [webPage, faqPage, breadcrumb, itemList],
  };
}
