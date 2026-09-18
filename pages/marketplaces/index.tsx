import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import MainLayout from '@/components/layout/MainLayout';
import SearchBar from '@/components/Search/SearchBar';
import { useRealMarketplaceData } from '@/hooks/useRealMarketplaceData';
import { useEcosystemStats } from '@/hooks/useEcosystemStats';
import LoadingState from '@/components/ui/LoadingState';
import { Star, Github, ExternalLink, Shield, Filter, Grid, List } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const MarketplacesPage: React.FC = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Deep-link support: /marketplaces?q=term seeds the search
  useEffect(() => {
    const q = router.query.q;
    if (typeof q === 'string' && q) {
      setSearchQuery(q);
    }
  }, [router.query.q]);
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [sortBy, setSortBy] = useState<'stars' | 'name' | 'updated'>('stars');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [visibleCount, setVisibleCount] = useState(12);

  // Selections persist in the URL (shareable, survives back/forward).
  const updateQuery = React.useCallback(
    (patch: Record<string, string>) => {
      const query: Record<string, string> = {};
      for (const [key, value] of Object.entries({ ...router.query, ...patch })) {
        if (typeof value === 'string' && value) query[key] = value;
      }
      router.replace({ pathname: '/marketplaces', query }, undefined, { shallow: true });
    },
    [router]
  );

  useEffect(() => {
    const s = router.query.sort;
    if (s === 'stars' || s === 'name' || s === 'updated') setSortBy(s);
  }, [router.query.sort]);

  const { data: marketplaceData, loading, error } = useRealMarketplaceData();
  const { data: stats } = useEcosystemStats();
  const marketplaces = marketplaceData?.marketplaces || [];

  // Real topic chips from generated stats
  const topics = useMemo(() => (stats?.categories || []).slice(0, 8).map((c) => c.name), [stats]);

  // Deep-link support: /marketplaces?topic=tag (from the topic chart bars)
  // seeds the topic filter
  useEffect(() => {
    const t = router.query.topic;
    if (typeof t === 'string' && t && topics.includes(t)) {
      setSelectedTopic(t);
    }
  }, [router.query.topic, topics]);

  // Filter and sort marketplaces
  const filteredAndSortedMarketplaces = useMemo(() => {
    const filtered = marketplaces.filter((marketplace) => {
      const matchesSearch =
        searchQuery === '' ||
        marketplace.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        marketplace.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTopic =
        selectedTopic === 'All' ||
        (Array.isArray(marketplace.topics) && marketplace.topics.includes(selectedTopic));

      return matchesSearch && matchesTopic;
    });

    // Sort marketplaces
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'stars':
          return (b.stars || 0) - (a.stars || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'updated':
          // Sort by lastUpdated if available, otherwise by stars as fallback
          return (b.stars || 0) - (a.stars || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [marketplaces, searchQuery, selectedTopic, sortBy]);

  // Pagination
  const visibleMarketplaces = filteredAndSortedMarketplaces.slice(0, visibleCount);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setVisibleCount(12);
    updateQuery({ q: query });
  };

  const handleTopicChange = (topic: string) => {
    setSelectedTopic(topic);
    setVisibleCount(12);
    updateQuery({ topic: topic === 'All' ? '' : topic });
  };

  const handleSortChange = (sort: 'stars' | 'name' | 'updated') => {
    setSortBy(sort);
    setVisibleCount(12);
    updateQuery({ sort: sort === 'stars' ? '' : sort });
  };

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
              <h1 className='text-2xl font-bold text-red-600 mb-4'>Error Loading Marketplaces</h1>
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
        <title>All Marketplaces - Claude Marketplace Registry</title>
        <meta
          name='description'
          content='Browse all Claude Code marketplaces from across GitHub. Discover new plugins and tools for your development workflow.'
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
                  All Marketplaces
                </h1>
                <p className='text-lg text-gray-600 dark:text-gray-400 mb-8'>
                  Discover {filteredAndSortedMarketplaces.length} Claude Code marketplaces from
                  across GitHub
                </p>

                {/* Search Bar */}
                <div className='max-w-2xl mx-auto mb-8'>
                  <SearchBar
                    onSearch={handleSearch}
                    placeholder='Search marketplaces…'
                    ariaLabel='Search marketplaces'
                    showTrending={false}
                    className='w-full'
                  />
                </div>
              </div>

              {/* Filters and Controls */}
              <div className='flex flex-col lg:flex-row gap-4 items-center justify-between'>
                {/* Category Filter */}
                <div className='flex flex-wrap gap-2 justify-center lg:justify-start'>
                  {['All', ...topics].map((topic) => (
                    <button
                      key={topic}
                      onClick={() => handleTopicChange(topic)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
                        selectedTopic === topic
                          ? 'bg-primary-600 text-white shadow-md hover:bg-primary-700'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {topic}
                    </button>
                  ))}
                </div>

                {/* Sort and View Controls */}
                <div className='flex items-center gap-4'>
                  <div className='flex items-center gap-2'>
                    <label className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                      Sort by:
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) =>
                        handleSortChange(e.target.value as 'stars' | 'name' | 'updated')
                      }
                      className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent'
                    >
                      <option value='stars'>Stars</option>
                      <option value='name'>Name</option>
                      <option value='updated'>Updated</option>
                    </select>
                  </div>

                  <div className='flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1'>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
                      aria-label='Grid view'
                    >
                      <Grid className='w-4 h-4' />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
                      aria-label='List view'
                    >
                      <List className='w-4 h-4' />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Results Section */}
          <section className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
            {/* Results Count */}
            <div className='mb-6'>
              <p className='text-gray-600 dark:text-gray-400'>
                Showing {visibleMarketplaces.length} of {filteredAndSortedMarketplaces.length}{' '}
                marketplaces
              </p>
            </div>

            {/* Marketplaces Grid/List */}
            {visibleMarketplaces.length > 0 ? (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                    : 'space-y-4'
                }
              >
                {visibleMarketplaces.map((marketplace) => (
                  <div
                    key={marketplace.id}
                    className={
                      viewMode === 'grid'
                        ? 'card group hover:shadow-lg dark:hover:shadow-gray-900/30 transition-all duration-300 hover:-translate-y-1'
                        : 'card flex items-center gap-4 p-6 hover:shadow-lg dark:hover:shadow-gray-900/30 transition-all duration-300'
                    }
                  >
                    {viewMode === 'grid' ? (
                      // Grid View
                      <>
                        <div className='flex items-start justify-between mb-4'>
                          <div className='flex-1 min-w-0'>
                            <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate'>
                              <Link href={`/marketplaces/${marketplace.id}`}>
                                {marketplace.name}
                              </Link>
                            </h3>
                            <p className='text-sm text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed'>
                              {marketplace.description}
                            </p>
                          </div>
                          {marketplace.verified && (
                            <div className='flex-shrink-0 ml-2'>
                              <Shield
                                className='w-5 h-5 text-success-500'
                                aria-label='Verified marketplace'
                              />
                            </div>
                          )}
                        </div>

                        <div className='flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4'>
                          <div className='flex items-center space-x-4'>
                            <div className='flex items-center space-x-1 group'>
                              <Star className='w-4 h-4 group-hover:fill-current group-hover:text-yellow-500 transition-colors' />
                              <span className='font-medium'>
                                {marketplace.stars.toLocaleString()}
                              </span>
                            </div>
                            <span className='badge badge-secondary text-xs'>
                              {(Array.isArray(marketplace.topics) && marketplace.topics[0]) || ''}
                            </span>
                            {marketplace.plugins !== undefined && (
                              <span className='text-xs'>{marketplace.plugins} plugins</span>
                            )}
                          </div>
                        </div>

                        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700'>
                          <a
                            href={marketplace.url}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='btn btn-primary text-sm w-full sm:w-auto justify-center group'
                            aria-label={`Visit ${marketplace.name} marketplace`}
                          >
                            Visit Marketplace
                            <ExternalLink className='w-4 h-4 ml-2 transform transition-transform group-hover:scale-110' />
                          </a>
                          <a
                            href={marketplace.url}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='btn-ghost p-2 sm:p-3 group'
                            aria-label={`View ${marketplace.name} repository`}
                          >
                            <Github className='w-4 h-4 sm:w-5 sm:h-5 transform transition-transform group-hover:scale-110' />
                          </a>
                        </div>
                      </>
                    ) : (
                      // List View
                      <>
                        <div className='flex-1'>
                          <div className='flex items-center gap-3 mb-2'>
                            <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                              <Link href={`/marketplaces/${marketplace.id}`}>
                                {marketplace.name}
                              </Link>
                            </h3>
                            {marketplace.verified && (
                              <Shield
                                className='w-5 h-5 text-success-500'
                                aria-label='Verified marketplace'
                              />
                            )}
                            <span className='badge badge-secondary text-xs'>
                              {(Array.isArray(marketplace.topics) && marketplace.topics[0]) || ''}
                            </span>
                          </div>
                          <p className='text-gray-600 dark:text-gray-300 mb-3 line-clamp-2'>
                            {marketplace.description}
                          </p>
                          <div className='flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400'>
                            <div className='flex items-center space-x-1'>
                              <Star className='w-4 h-4' />
                              <span>{marketplace.stars.toLocaleString()}</span>
                            </div>
                            {marketplace.plugins !== undefined && (
                              <span>{marketplace.plugins} plugins</span>
                            )}
                          </div>
                        </div>
                        <div className='flex items-center gap-2'>
                          <a
                            href={marketplace.url}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='btn-ghost p-2 group'
                            aria-label={`View ${marketplace.name} repository`}
                          >
                            <Github className='w-5 h-5 transform transition-transform group-hover:scale-110' />
                          </a>
                          <a
                            href={marketplace.url}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='btn btn-primary text-sm px-4 py-2 group'
                            aria-label={`Visit ${marketplace.name} marketplace`}
                          >
                            Visit
                            <ExternalLink className='w-4 h-4 ml-2 transform transition-transform group-hover:scale-110' />
                          </a>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-center py-16'>
                <div className='text-gray-400 dark:text-gray-500 mb-6'>
                  <Filter className='w-16 h-16 mx-auto' />
                </div>
                <h3 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3'>
                  No marketplaces found
                </h3>
                <p className='text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto'>
                  {searchQuery || selectedTopic !== 'All'
                    ? `No marketplaces found matching your criteria. Try different filters or search terms.`
                    : 'No marketplaces available at the moment.'}
                </p>
                {(searchQuery || selectedTopic !== 'All') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedTopic('All');
                    }}
                    className='btn btn-primary'
                    aria-label='Clear all filters'
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}

            {/* Load more */}
            {visibleMarketplaces.length < filteredAndSortedMarketplaces.length && (
              <div className='flex flex-col items-center gap-3 mt-12'>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                  Showing {visibleMarketplaces.length} of {filteredAndSortedMarketplaces.length}
                </p>
                <button
                  onClick={() => setVisibleCount((c) => c + 12)}
                  className='btn btn-secondary px-6 py-2.5'
                  aria-label={`Load 12 more marketplaces (${filteredAndSortedMarketplaces.length - visibleMarketplaces.length} remaining)`}
                >
                  Load 12 more
                </button>
              </div>
            )}
          </section>
        </div>
      </MainLayout>
    </>
  );
};

export default MarketplacesPage;
