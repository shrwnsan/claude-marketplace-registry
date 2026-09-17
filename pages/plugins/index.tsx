import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import MainLayout from '@/components/layout/MainLayout';
import SearchBar from '@/components/Search/SearchBar';
import PluginCard from '@/components/Marketplace/PluginCard';
import { usePluginData } from '@/hooks/usePluginData';
import { useEcosystemStats } from '@/hooks/useEcosystemStats';
import LoadingState from '@/components/ui/LoadingState';
import { Star, Grid, List, Package } from 'lucide-react';
import Link from 'next/link';

const PluginsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'stars' | 'name'>('stars');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const { plugins, loading, error, totalCount } = usePluginData();
  const { data: stats } = useEcosystemStats();

  const filteredAndSortedPlugins = useMemo(() => {
    const filtered = plugins.filter((plugin) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        q === '' ||
        plugin.name.toLowerCase().includes(q) ||
        plugin.description.toLowerCase().includes(q) ||
        plugin.skills.some((skill) => skill.toLowerCase().includes(q)) ||
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

  const totalPages = Math.ceil(filteredAndSortedPlugins.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPlugins = filteredAndSortedPlugins.slice(startIndex, startIndex + itemsPerPage);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleSortChange = (sort: 'stars' | 'name') => {
    setSortBy(sort);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        <title>All Plugins - Claude Marketplace Aggregator</title>
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
                  <SearchBar onSearch={handleSearch} onFilterClick={() => {}} className='w-full' />
                </div>
              </div>

              {/* Sort and View Controls */}
              <div className='flex flex-col lg:flex-row gap-4 items-center justify-between'>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                  Sorted by {sortBy === 'stars' ? 'parent marketplace stars' : 'name'}
                </p>
                <div className='flex items-center gap-4'>
                  <div className='flex items-center gap-2'>
                    <label className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                      Sort by:
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => handleSortChange(e.target.value as 'stars' | 'name')}
                      className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent'
                    >
                      <option value='stars'>Stars</option>
                      <option value='name'>Name</option>
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
            <div className='mb-6'>
              <p className='text-gray-600 dark:text-gray-400'>
                Showing {paginatedPlugins.length} of {filteredAndSortedPlugins.length} plugins
                {searchQuery && ` matching "${searchQuery}"`}
              </p>
            </div>

            {paginatedPlugins.length > 0 ? (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                    : 'space-y-4'
                }
              >
                {paginatedPlugins.map((plugin) => (
                  <div key={plugin.id}>
                    {viewMode === 'grid' ? (
                      <PluginCard plugin={plugin} />
                    ) : (
                      <div className='card flex items-center gap-4 p-6 hover:shadow-lg dark:hover:shadow-gray-900/30 transition-all duration-300'>
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
                            <div className='flex items-center space-x-1'>
                              <Star className='w-4 h-4' />
                              <span>{plugin.stars.toLocaleString()}</span>
                            </div>
                            {plugin.version && <span className='text-xs'>v{plugin.version}</span>}
                          </div>
                        </div>
                        <div className='flex flex-col gap-2'>
                          {plugin.repositoryUrl && (
                            <Link
                              href={plugin.repositoryUrl}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='btn btn-primary text-sm px-4 py-2 group'
                              aria-label={`View ${plugin.name} repository`}
                            >
                              View Plugin
                            </Link>
                          )}
                          <Link
                            href={`/marketplaces/${plugin.marketplaceId}`}
                            className='btn-ghost text-sm px-4 py-2 text-center'
                            aria-label={`Visit ${plugin.marketplaceName}`}
                          >
                            {plugin.marketplaceName}
                          </Link>
                        </div>
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
                      setCurrentPage(1);
                    }}
                    className='btn btn-primary'
                    aria-label='Clear search'
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className='flex justify-center items-center gap-2 mt-12'>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className='btn btn-secondary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed'
                  aria-label='Previous page'
                >
                  Previous
                </button>

                <div className='flex gap-1'>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-primary-600 text-white'
                            : 'btn btn-secondary'
                        }`}
                        aria-label={`Go to page ${pageNum}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className='btn btn-secondary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed'
                  aria-label='Next page'
                >
                  Next
                </button>
              </div>
            )}
          </section>
        </div>
      </MainLayout>
    </>
  );
};

export default PluginsPage;
