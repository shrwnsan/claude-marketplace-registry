import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import MainLayout from '@/components/layout/MainLayout';
import SearchBar from '@/components/Search/SearchBar';
import PluginCard from '@/components/Marketplace/PluginCard';
import { usePluginData } from '@/hooks/usePluginData';
import { useEcosystemStats } from '@/hooks/useEcosystemStats';
import LoadingState from '@/components/ui/LoadingState';
import SortSelect from '@/components/ui/SortSelect';
import { Grid, List, Package, ArrowUp, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';

/** How many more plugins the Load-more button reveals per click. */
const LOAD_CHUNK = 24;

const PluginsPage: React.FC = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Deep-link support: /plugins?q=term seeds the search
  useEffect(() => {
    const q = router.query.q;
    if (typeof q === 'string' && q) {
      setSearchQuery(q);
    }
  }, [router.query.q]);
  const [sortBy, setSortBy] = useState<'stars' | 'name'>('stars');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [visibleCount, setVisibleCount] = useState(12);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Selections persist in the URL (shareable, survives back/forward).
  const updateQuery = React.useCallback(
    (patch: Record<string, string>) => {
      const query: Record<string, string> = {};
      for (const [key, value] of Object.entries({ ...router.query, ...patch })) {
        if (typeof value === 'string' && value) query[key] = value;
      }
      router.replace({ pathname: '/plugins', query }, undefined, { shallow: true });
    },
    [router]
  );

  useEffect(() => {
    const s = router.query.sort;
    if (s === 'stars' || s === 'name') setSortBy(s);
  }, [router.query.sort]);

  const { plugins, loading, error, totalCount } = usePluginData();
  const { data: stats } = useEcosystemStats();

  const filteredAndSortedPlugins = useMemo(() => {
    const filtered = plugins.filter((plugin) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        q === '' ||
        plugin.name.toLowerCase().includes(q) ||
        plugin.description.toLowerCase().includes(q) ||
        plugin.author.toLowerCase().includes(q) ||
        plugin.marketplaceName.toLowerCase().includes(q);
      return matchesSearch;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'stars':
          return (b.stars || 0) - (a.stars || 0) || a.name.localeCompare(b.name);
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [plugins, searchQuery, sortBy]);

  const visiblePlugins = filteredAndSortedPlugins.slice(0, visibleCount);
  const hasMore = visiblePlugins.length < filteredAndSortedPlugins.length;

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setVisibleCount(12);
    updateQuery({ q: query });
  };

  const handleSortChange = (sort: 'stars' | 'name') => {
    setSortBy(sort);
    setVisibleCount(12);
    updateQuery({ sort: sort === 'stars' ? '' : sort });
  };

  // Back-to-top visibility
  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 800);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (loading) {
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

  if (error) {
    return (
      <MainLayout>
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
            <div className='text-center'>
              <h1 className='text-2xl font-bold text-red-600 mb-4'>Error Loading Plugins</h1>
              <p className='text-gray-600 dark:text-gray-400'>{error}</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <>
      <Head>
        <title>All Plugins - Claude Marketplace Registry</title>
        <meta
          name='description'
          content='Browse all Claude Code plugins from marketplaces across GitHub. Find tools to enhance your development workflow.'
        />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <link rel='icon' href={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/favicon.ico`} />
      </Head>

      <MainLayout>
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
          {/* Header Section */}
          <section className='bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700'>
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
              <div className='text-center mb-8'>
                <h1 className='text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4'>
                  All Plugins
                </h1>
                <p className='text-lg text-gray-600 dark:text-gray-400 mb-8'>
                  {totalCount.toLocaleString()} plugins discovered across{' '}
                  {(stats?.overview.totalMarketplaces ?? 0).toLocaleString()} marketplaces
                </p>

                <div className='max-w-2xl mx-auto mb-8'>
                  <SearchBar
                    onSearch={handleSearch}
                    placeholder='Search plugins…'
                    ariaLabel='Search plugins'
                    showTrending={false}
                    className='w-full'
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Results Section */}
          <section className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
            {/* Results header — count left, sort + view right */}
            <div className='mb-6 flex flex-wrap items-center justify-between gap-3'>
              <p className='text-gray-600 dark:text-gray-400'>
                Showing {visiblePlugins.length} of {filteredAndSortedPlugins.length} plugins
                {searchQuery && ` matching "${searchQuery}"`}
              </p>
              <div className='flex items-center gap-3 flex-nowrap flex-shrink-0'>
                <SortSelect
                  id='plugin-sort'
                  label='Sort by:'
                  value={sortBy}
                  onChange={(v) => handleSortChange(v as 'stars' | 'name')}
                  options={[
                    { value: 'stars', label: 'Parent stars' },
                    { value: 'name', label: 'Name' },
                  ]}
                />

                <div className='h-6 w-px bg-gray-200 dark:bg-gray-700' aria-hidden='true' />

                <div className='flex items-center gap-1 h-9 bg-gray-100 dark:bg-gray-750 rounded-lg p-1 px-1'>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`h-7 w-7 inline-flex items-center justify-center rounded ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
                    aria-label='Grid view'
                    aria-pressed={viewMode === 'grid'}
                  >
                    <Grid className='w-4 h-4' />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`h-7 w-7 inline-flex items-center justify-center rounded ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
                    aria-label='List view'
                    aria-pressed={viewMode === 'list'}
                  >
                    <List className='w-4 h-4' />
                  </button>
                </div>
              </div>
            </div>

            {visiblePlugins.length > 0 ? (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                    : 'space-y-4'
                }
              >
                {visiblePlugins.map((plugin) => (
                  <div key={plugin.id}>
                    {viewMode === 'grid' ? (
                      <PluginCard plugin={plugin} />
                    ) : (
                      <div className='card flex items-center gap-4'>
                        <div className='flex-1'>
                          <div className='flex items-center gap-3 mb-2'>
                            <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                              <Link href={`/plugins/${plugin.id}`}>{plugin.name}</Link>
                            </h3>
                            <span className='badge badge-secondary text-xs'>
                              {plugin.marketplaceName}
                            </span>
                          </div>
                          <p className='text-gray-600 dark:text-gray-300 mb-3 line-clamp-2'>
                            {plugin.description}
                          </p>
                          <div className='flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400'>
                            <span>by {plugin.author}</span>
                            <span>•</span>
                            <span>{plugin.skillsCount} skills</span>
                            {plugin.version && <span className='text-xs'>v{plugin.version}</span>}
                          </div>
                        </div>
                        <Link
                          href={`/plugins/${plugin.id}`}
                          className='cta group/cta flex-shrink-0'
                          aria-label={`View details for ${plugin.name}`}
                        >
                          view details
                          <ChevronRight className='cta-arrow w-4 h-4' />
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-center py-16'>
                <div className='text-gray-400 dark:text-gray-500 mb-6'>
                  <Package className='w-16 h-16 mx-auto' />
                </div>
                <h3 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3'>
                  No plugins found
                </h3>
                <p className='text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto'>
                  {searchQuery
                    ? 'No plugins found matching your search. Try different keywords.'
                    : 'No plugins available at the moment.'}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setVisibleCount(12);
                    }}
                    className='btn btn-primary'
                    aria-label='Clear search'
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}

            {/* Load more — manual pacing keeps the button reachable */}
            {hasMore && (
              <div className='flex flex-col items-center gap-3 mt-12'>
                <p className='text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap'>
                  Showing {visiblePlugins.length} of {filteredAndSortedPlugins.length}
                </p>
                <button
                  onClick={() => setVisibleCount((c) => c + LOAD_CHUNK)}
                  className='btn btn-secondary px-6 py-2.5'
                  aria-label={`Load ${LOAD_CHUNK} more plugins (${filteredAndSortedPlugins.length - visiblePlugins.length} remaining)`}
                >
                  Load {LOAD_CHUNK} more
                </button>
              </div>
            )}
          </section>

          {/* Back to top */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className={`fixed bottom-6 right-6 z-40 btn-ghost bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-medium rounded-full p-3 transition-all duration-300 ${
              showBackToTop
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-4 pointer-events-none'
            }`}
            aria-label='Back to top'
            tabIndex={showBackToTop ? 0 : -1}
          >
            <ArrowUp className='w-5 h-5' />
          </button>
        </div>
      </MainLayout>
    </>
  );
};

export default PluginsPage;
