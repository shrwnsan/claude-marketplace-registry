import React, { useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import PluginCard from '@/components/Marketplace/PluginCard';
import { usePluginData, CatalogPlugin } from '@/hooks/usePluginData';
import { usePluginShard } from '@/hooks/usePluginShard';
import { useRealMarketplaceData } from '@/hooks/useRealMarketplaceData';
import LoadingState from '@/components/ui/LoadingState';
import { Star, Github, Copy, Check, Package, ArrowLeft } from 'lucide-react';
import fs from 'fs';
import path from 'path';

interface PluginDetailPageProps {
  pluginIds: string[];
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

export async function getStaticProps() {
  return { props: {} as PluginDetailPageProps };
}

const PluginDetailPage: React.FC = () => {
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
  const {
    plugins: shardPlugins,
    loading: shardLoading,
    error: shardError,
  } = usePluginShard(summary?.marketplaceId);

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

  if (indexLoading || (summary && shardLoading && !shardError)) {
    return (
      <MainLayout>
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
          <div className='container-detail py-12'>
            <LoadingState variant='skeleton' className='max-w-3xl' />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!plugin) {
    return (
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
    );
  }

  return (
    <>
      <Head>
        <title>{plugin.name} - Claude Marketplace Registry</title>
        <meta name='description' content={plugin.description} />
        <link rel='icon' href={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/favicon.ico`} />
      </Head>

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
            <div className='card p-6 sm:p-8 mb-6'>
              <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4'>
                <div className='flex-1 min-w-0'>
                  <h1 className='text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2'>
                    {plugin.name}
                  </h1>
                  <p className='text-gray-600 dark:text-gray-300 mb-4'>{plugin.description}</p>
                  <div className='flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400'>
                    <span>
                      by{' '}
                      <span className='font-medium text-gray-700 dark:text-gray-200'>
                        {plugin.author}
                      </span>
                    </span>
                    {plugin.version && <span className='font-mono text-xs'>v{plugin.version}</span>}
                    {plugin.marketplaceId && (
                      <Link
                        href={`/marketplaces/${plugin.marketplaceId}`}
                        className='badge badge-secondary text-xs hover:border-primary-300'
                      >
                        {plugin.marketplaceName}
                      </Link>
                    )}
                    {marketplace && (
                      <span className='flex items-center gap-1'>
                        <Star className='w-4 h-4 text-yellow-500' />
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
                  {(plugin.sourceUrl || plugin.repositoryUrl) && (
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

              {/* Skills */}
              {(plugin.skills?.length ?? 0) > 0 && (
                <div className='mt-5 pt-5 border-t border-gray-100 dark:border-gray-700'>
                  <h2 className='text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2'>
                    Skills ({plugin.skills!.length})
                  </h2>
                  <div className='flex flex-wrap gap-1.5'>
                    {plugin.skills!.map((skill) => (
                      <span key={skill} className='badge badge-secondary text-xs'>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Related plugins */}
            {relatedPlugins.length > 0 && (
              <section className='mt-10'>
                <h2 className='text-xl font-bold text-gray-900 dark:text-gray-100 mb-4'>
                  More from {plugin.marketplaceName}
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
