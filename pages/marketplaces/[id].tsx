import React, { useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import MainLayout from '@/components/layout/MainLayout';
import SearchBar from '@/components/Search/SearchBar';
import PluginCard from '@/components/Marketplace/PluginCard';
import { useRealMarketplaceData } from '@/hooks/useRealMarketplaceData';
import { usePluginData } from '@/hooks/usePluginData';
import LoadingState from '@/components/ui/LoadingState';
import { Star, ExternalLink, Github, Store, Package, ArrowLeft } from 'lucide-react';

import fs from 'fs';
import path from 'path';

// Generate one static page per marketplace at build time (static export has
// no server-side fallback — without this every /marketplaces/<id> URL 404s).
export async function getStaticPaths() {
  const ids: string[] = [];
  try {
    const raw = fs.readFileSync(
      path.join(process.cwd(), 'public', 'data', 'marketplaces.json'),
      'utf-8'
    );
    const entries = JSON.parse(raw);
    if (Array.isArray(entries)) {
      for (const entry of entries) {
        if (entry?.id !== undefined) ids.push(String(entry.id));
      }
    }
  } catch {
    /* no data at build time */
  }
  return {
    paths: ids.map((id) => ({ params: { id } })),
    fallback: false,
  };
}

export async function getStaticProps() {
  return { props: {} };
}

const MarketplaceDetailPage: React.FC = () => {
  const router = useRouter();
  const { id: rawId } = router.query;
  // Static-export direct loads can carry a .html suffix (e.g. /plugins/x.html)
  const id = (Array.isArray(rawId) ? rawId[0] : rawId)?.replace(/\.html$/, '');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: marketplaceData, loading: marketplaceLoading } = useRealMarketplaceData();
  const { plugins: allPlugins, loading: pluginsLoading } = usePluginData();

  const marketplace = useMemo(() => {
    if (!id || !marketplaceData?.marketplaces) return null;
    return marketplaceData.marketplaces.find((m: any) => String(m.id) === String(id)) || null;
  }, [id, marketplaceData]);

  const marketplacePlugins = useMemo(
    () => allPlugins.filter((p) => String(p.marketplaceId) === String(id)),
    [id, allPlugins]
  );

  const filteredPlugins = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const filtered = marketplacePlugins.filter(
      (p) =>
        q === '' ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.skills.some((skill) => skill.toLowerCase().includes(q))
    );
    return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  }, [marketplacePlugins, searchQuery]);

  const topics: string[] = Array.isArray(marketplace?.topics) ? marketplace.topics : [];

  if (marketplaceLoading || pluginsLoading) {
    return (
      <MainLayout>
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
            <LoadingState variant='skeleton' className='max-w-4xl' />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!marketplace) {
    return (
      <MainLayout>
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
          <div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center'>
            <Store className='w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4' />
            <h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3'>
              Marketplace not found
            </h1>
            <p className='text-gray-600 dark:text-gray-400 mb-8'>
              This marketplace may no longer be indexed.
            </p>
            <Link href='/marketplaces' className='btn btn-primary'>
              Browse all marketplaces
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <>
      <Head>
        <title>{marketplace.name} - Claude Marketplace Registry</title>
        <meta name='description' content={marketplace.description || ''} />
        <link rel='icon' href={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/favicon.ico`} />
      </Head>

      <MainLayout>
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
            <Link
              href='/marketplaces'
              className='inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 mb-6 group'
            >
              <ArrowLeft className='w-4 h-4 mr-1 transform transition-transform group-hover:-translate-x-1' />
              Back to marketplaces
            </Link>

            {/* Marketplace header */}
            <div className='card p-6 sm:p-8 mb-8'>
              <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4'>
                <div className='flex-1 min-w-0'>
                  <h1 className='text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2'>
                    {marketplace.name}
                  </h1>
                  <p className='text-gray-600 dark:text-gray-300 mb-4'>{marketplace.description}</p>
                  <div className='flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400'>
                    <span className='flex items-center gap-1'>
                      <Star className='w-4 h-4 text-yellow-500' />
                      {(marketplace.stars || 0).toLocaleString()}
                    </span>
                    <span>
                      {marketplace.forks ? `${marketplace.forks.toLocaleString()} forks` : ''}
                    </span>
                    {marketplace.language && <span>{marketplace.language}</span>}
                    {marketplace.hasManifest && (
                      <span className='badge badge-secondary text-xs'>marketplace.json ✓</span>
                    )}
                  </div>
                  {topics.length > 0 && (
                    <div className='flex flex-wrap gap-1.5 mt-3'>
                      {topics.slice(0, 6).map((topic) => (
                        <span key={topic} className='badge badge-secondary text-xs'>
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {marketplace.url && (
                  <a
                    href={marketplace.url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='btn btn-primary text-sm self-start'
                    aria-label={`Open ${marketplace.name} on GitHub`}
                  >
                    <Github className='w-4 h-4 mr-2' />
                    GitHub
                    <ExternalLink className='w-3.5 h-3.5 ml-1' />
                  </a>
                )}
              </div>

              {/* Plugin count stats */}
              <div className='mt-5 pt-5 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 sm:grid-cols-3 gap-4'>
                <div>
                  <div className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
                    {marketplacePlugins.length}
                  </div>
                  <div className='text-xs text-gray-500 dark:text-gray-400'>Plugins indexed</div>
                </div>
                <div>
                  <div className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
                    {new Set(marketplacePlugins.map((p) => p.author)).size}
                  </div>
                  <div className='text-xs text-gray-500 dark:text-gray-400'>Authors</div>
                </div>
                <div>
                  <div className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
                    {new Set(marketplacePlugins.flatMap((p) => p.skills)).size}
                  </div>
                  <div className='text-xs text-gray-500 dark:text-gray-400'>Skills</div>
                </div>
              </div>
            </div>

            {/* Plugins */}
            <section>
              <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4'>
                <h2 className='text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center'>
                  <Package className='w-5 h-5 mr-2 text-primary-500' />
                  Plugins ({filteredPlugins.length})
                </h2>
                <div className='max-w-sm w-full'>
                  <SearchBar
                    onSearch={setSearchQuery}
                    onFilterClick={() => {}}
                    className='w-full'
                  />
                </div>
              </div>

              {filteredPlugins.length > 0 ? (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                  {filteredPlugins.map((plugin) => (
                    <PluginCard key={plugin.id} plugin={plugin} />
                  ))}
                </div>
              ) : (
                <p className='text-center text-gray-500 dark:text-gray-400 py-10'>
                  {marketplacePlugins.length === 0
                    ? 'No plugins discovered in this marketplace yet.'
                    : 'No plugins match your search.'}
                </p>
              )}
            </section>
          </div>
        </div>
      </MainLayout>
    </>
  );
};

export default MarketplaceDetailPage;
