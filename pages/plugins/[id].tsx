import React, { useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import PluginCard from '@/components/Marketplace/PluginCard';
import { usePluginData, CatalogPlugin } from '@/hooks/usePluginData';
import { usePluginShard } from '@/hooks/usePluginShard';
import {
  buildBreadcrumbJsonLd,
  buildSoftwareApplicationJsonLd,
  buildWebPageJsonLd,
} from '@/utils/seo';
import { useRealMarketplaceData } from '@/hooks/useRealMarketplaceData';
import { Star, Github, Copy, Check, Package, ArrowLeft, Zap } from 'lucide-react';
import { pathBasename } from '@/utils/format';
import { displayCount, displayText } from '@/utils/display-values';
import fs from 'fs';
import path from 'path';

interface PluginDetailPageProps {
  id: string;
  /** Build-time truth from the generated index — bakes unique titles,
   *  descriptions, canonicals, and JSON-LD into each exported page, and
   *  prerenders the header body (name, description, byline) so non-JS
   *  crawlers see real content instead of a loading skeleton. */
  name?: string;
  description?: string;
  author?: string;
  version?: string;
  marketplaceId?: string;
  marketplaceName?: string;
  modsCount?: number;
}

// Generate one static page per plugin at build time (static export has no
// server-side fallback — without this every /plugins/<id> URL is a 404).
export async function getStaticPaths() {
  const ids: string[] = [];
  try {
    const raw = fs.readFileSync(
      path.join(process.cwd(), 'public', 'data', 'plugins.json'),
      'utf-8'
    );
    const entries = JSON.parse(raw);
    if (Array.isArray(entries)) {
      for (const [index, entry] of entries.entries()) {
        ids.push(entry?.id || `plugin-${index}`);
      }
    }
  } catch {
    /* no data at build time — pages render client-side and show not-found */
  }
  return {
    paths: ids.map((id) => ({ params: { id } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }: { params: { id: string } }) {
  let summary: Omit<PluginDetailPageProps, 'id'> = {};
  try {
    const raw = fs.readFileSync(
      path.join(process.cwd(), 'public', 'data', 'plugins.json'),
      'utf-8'
    );
    const entries = JSON.parse(raw) as Array<{
      id?: string;
      name?: string;
      description?: string;
      author?: string;
      version?: string;
      marketplaceId?: string;
      marketplaceName?: string;
      modsCount?: number;
    }>;
    const entry = entries.find((e) => e.id === params.id);
    if (entry) {
      summary = {
        name: entry.name,
        description: entry.description,
        author: entry.author,
        version: entry.version,
        marketplaceId: entry.marketplaceId,
        marketplaceName: entry.marketplaceName,
        modsCount: entry.modsCount,
      };
    }
  } catch {
    /* no data at build time — page still renders from the client index */
  }
  return { props: { id: params.id, ...summary } };
}

const PluginDetailPage: React.FC<PluginDetailPageProps> = ({
  id: buildId,
  name: buildName,
  description: buildDescription,
  author: buildAuthor,
  version: buildVersion,
  marketplaceId: buildMarketplaceId,
  marketplaceName: buildMarketplaceName,
  modsCount: buildModsCount,
}) => {
  const router = useRouter();
  const { id: rawId } = router.query;
  // Static-export direct loads can carry a .html suffix (e.g. /plugins/x.html)
  const id = (Array.isArray(rawId) ? rawId[0] : rawId)?.replace(/\.html$/, '');
  const [copied, setCopied] = useState(false);

  // Summary from the compact index resolves the plugin's marketplace; the
  // full record (skills, source URLs, untruncated description) comes from
  // that marketplace's shard. The page renders from the summary if the
  // shard is unavailable.
  const { plugins, loading: indexLoading } = usePluginData();
  const { data: marketplaceData } = useRealMarketplaceData();

  const summary = useMemo(() => plugins.find((p) => p.id === id) || null, [id, plugins]);
  const { plugins: shardPlugins } = usePluginShard(summary?.marketplaceId);

  const full = useMemo(() => shardPlugins.find((p) => p.id === id) || null, [id, shardPlugins]);
  const plugin: CatalogPlugin | null = full || summary;

  const marketplace = useMemo(() => {
    if (!plugin) return null;
    return (
      (marketplaceData?.marketplaces || []).find(
        (m: any) => String(m.id) === String(plugin.marketplaceId)
      ) || null
    );
  }, [plugin, marketplaceData]);

  // Related = other plugins from the same marketplace (the shard's scope)
  const relatedPlugins = useMemo(() => {
    if (!plugin) return [];
    return shardPlugins.filter((p) => p.id !== plugin.id).slice(0, 3);
  }, [plugin, shardPlugins]);

  const copySource = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  // SEO surface — build-time truth first (baked into the export), the live
  // client record wins once it lands. Rendered in EVERY return path: the
  // static export bakes the prerender-time head, and prerender sees loading.
  const seoId = id || buildId;
  const seoName = plugin?.name || buildName || 'Claude Code Plugin';
  const seoDescription =
    (plugin?.description || buildDescription || '').slice(0, 155) ||
    `${seoName} — a Claude Code plugin discovered by the Claude Marketplace Registry.`;
  // Body display values — same precedence as the SEO surface: the live client
  // record wins once loaded, the build-time record prerenders the header so
  // non-JS crawlers see real content, generic copy is the last resort.
  // Client-only enrichments (stars join, skill names, related plugins) stay
  // gated on their data and are simply absent from the prerendered HTML.
  const displayName = seoName;
  const displayDescription = displayText(
    plugin?.description,
    buildDescription,
    `${displayName} — a Claude Code plugin discovered by the Claude Marketplace Registry.`
  );
  const displayAuthor = displayText(plugin?.author, buildAuthor, '');
  const displayVersion = displayText(plugin?.version, buildVersion, '');
  const displayMarketplaceId = displayText(plugin?.marketplaceId, buildMarketplaceId, '');
  const displayMarketplaceName = displayText(plugin?.marketplaceName, buildMarketplaceName, '');
  const displayModsCount = displayCount(plugin?.modsCount, buildModsCount);
  const pageHead = (
    <Head>
      <title>{`${seoName} — Claude Code Plugin`}</title>
      <meta name='description' content={seoDescription} />
      <link
        rel='canonical'
        href={`https://shrwnsan.github.io/claude-marketplace-registry/plugins/${seoId ?? ''}`}
      />
      <meta property='og:type' content='website' />
      <meta
        property='og:url'
        content={`https://shrwnsan.github.io/claude-marketplace-registry/plugins/${seoId ?? ''}`}
      />
      <meta property='og:title' content={`${seoName} — Claude Code Plugin`} />
      <meta property='og:description' content={seoDescription} />
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              buildWebPageJsonLd({
                name: `${seoName} — Claude Code Plugin`,
                description: seoDescription,
                path: `/plugins/${seoId ?? ''}`,
              }),
              buildBreadcrumbJsonLd([
                { name: 'Home', path: '/' },
                { name: 'Plugins', path: '/plugins' },
                { name: seoName, path: `/plugins/${seoId ?? ''}` },
              ]),
              buildSoftwareApplicationJsonLd({
                name: seoName,
                description: seoDescription,
                pluginPath: `/plugins/${seoId ?? ''}`,
              }),
            ],
          }),
        }}
      />
      <meta name='viewport' content='width=device-width, initial-scale=1' />
      <link rel='icon' href={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/favicon.ico`} />
    </Head>
  );

  // Definite not-found only: the client catalog has settled, the plugin is
  // absent from it, and the build-time record has nothing to show either.
  // While loading — and always at prerender, where buildName exists — the
  // main body renders below with whatever truth is available so far.
  if (!plugin && !buildName && !indexLoading) {
    return (
      <>
        {pageHead}
        <MainLayout>
          <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
            <div className='container-detail py-20 text-center'>
              <Package className='w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4' />
              <h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3'>
                Plugin not found
              </h1>
              <p className='text-gray-600 dark:text-gray-400 mb-8'>
                This plugin may have been removed from its marketplace catalog.
              </p>
              <Link href='/plugins' className='btn btn-primary'>
                Browse all plugins
              </Link>
            </div>
          </div>
        </MainLayout>
      </>
    );
  }

  return (
    <>
      {pageHead}

      <MainLayout>
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
          <div className='container-detail py-8'>
            <Link
              href='/plugins'
              className='inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 mb-6 group'
            >
              <ArrowLeft className='w-4 h-4 mr-1 transform transition-transform group-hover:-translate-x-1' />
              Back to plugins
            </Link>

            {/* Header */}
            <div className='card p-6 sm:p-8 mb-8'>
              <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4'>
                <div className='flex-1 min-w-0'>
                  <h1 className='text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2'>
                    {displayName}
                  </h1>
                  <p className='text-gray-600 dark:text-gray-300 mb-4'>{displayDescription}</p>
                  <div className='flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-gray-500 dark:text-gray-400'>
                    {displayAuthor && (
                      <span>
                        by{' '}
                        <span className='font-medium text-gray-700 dark:text-gray-200'>
                          {displayAuthor}
                        </span>
                      </span>
                    )}
                    {displayVersion && <span className='font-mono text-xs'>v{displayVersion}</span>}
                    {displayMarketplaceId && (
                      <Link
                        href={`/marketplaces/${displayMarketplaceId}`}
                        className='badge badge-secondary text-xs hover:border-primary-300 dark:hover:border-primary-600 transition-colors'
                      >
                        {displayMarketplaceName}
                      </Link>
                    )}
                    {displayModsCount > 0 && (
                      <span
                        className='flex items-center gap-1 text-primary-600 dark:text-primary-400'
                        title='Ships Claude Code mods (hook modules)'
                      >
                        <Zap className='w-4 h-4' aria-hidden='true' />
                        {displayModsCount} mod{displayModsCount === 1 ? '' : 's'}
                      </span>
                    )}
                    {marketplace && (
                      <span className='flex items-center gap-1' title='Stars — parent marketplace'>
                        <Star className='w-4 h-4 text-yellow-500' aria-hidden='true' />
                        {(marketplace.stars || 0).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions — share this page's permalink; the source repo is one click out */}
                <div className='flex items-center gap-2 flex-shrink-0'>
                  <button
                    onClick={() => copySource(window.location.href)}
                    className='btn-ghost p-2.5 rounded-lg border border-gray-200 dark:border-gray-700'
                    title='Copy page permalink'
                    aria-label='Copy page permalink'
                  >
                    {copied ? (
                      <Check className='w-5 h-5 text-success-500' />
                    ) : (
                      <Copy className='w-5 h-5' />
                    )}
                  </button>
                  {plugin && (plugin.sourceUrl || plugin.repositoryUrl) && (
                    <a
                      href={plugin.sourceUrl || plugin.repositoryUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='btn-ghost p-2.5 rounded-lg border border-gray-200 dark:border-gray-700'
                      title={`${plugin.name} on GitHub`}
                      aria-label='View source on GitHub (opens in new tab)'
                    >
                      <Github className='w-5 h-5' />
                    </a>
                  )}
                </div>
              </div>

              {/* Skills — full skill names only exist on the shard record,
                  so this section is absent from the prerendered HTML */}
              {plugin && (plugin.skills?.length ?? 0) > 0 && (
                <div className='mt-5 pt-5 border-t border-gray-100 dark:border-gray-700'>
                  <p className='eyebrow'>ls skills/ ({plugin.skills!.length})</p>
                  <div className='mt-3 flex flex-wrap gap-1.5'>
                    {plugin.skills!.map((skill) => (
                      <span
                        key={skill}
                        className='badge badge-secondary font-mono text-xs'
                        title={skill}
                      >
                        {pathBasename(skill)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Related plugins */}
            {relatedPlugins.length > 0 && (
              <section className='mt-10'>
                <h2 className='text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center'>
                  <Package className='w-5 h-5 mr-2 text-primary-500' />
                  More from {displayMarketplaceName}
                </h2>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  {relatedPlugins.map((related) => (
                    <PluginCard key={related.id} plugin={related} />
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </MainLayout>
    </>
  );
};

export default PluginDetailPage;
