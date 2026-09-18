import React, { useMemo } from 'react';
import Head from 'next/head';
import MainLayout from '@/components/layout/MainLayout';
import SearchCombobox from '@/components/Search/SearchCombobox';
import PluginCard from '@/components/Marketplace/PluginCard';
import { EcosystemStats } from '@/components/EcosystemStats';
import { useRealMarketplaceData } from '@/hooks/useRealMarketplaceData';
import { usePluginData, topPluginsByStars } from '@/hooks/usePluginData';
import { useEcosystemStats } from '@/hooks/useEcosystemStats';
import LoadingState from '@/components/ui/LoadingState';
import { StatCard } from '@/components/ui/StatCard';
import FriendlyTimestamp from '@/components/ui/FriendlyTimestamp';
import { ChevronRight, Github, Package, ShieldCheck, Star, Store, Users } from 'lucide-react';
import Link from 'next/link';
import { handleAnchorClick } from '@/utils/scroll';
import { selectFeaturedMarketplaces } from '@/utils/stats';

const HomePage: React.FC = () => {
  const {
    data: marketplaceData,
    loading: marketplaceLoading,
    error: marketplaceError,
  } = useRealMarketplaceData();
  const { plugins: allPlugins, loading: pluginsLoading } = usePluginData();
  const { data: stats, loading: statsLoading, error: statsError } = useEcosystemStats();

  const marketplaces = marketplaceData?.marketplaces || [];

  // Real topic chips from generated stats (replaces the hardcoded mock taxonomy)
  const topics = useMemo(() => (stats?.categories || []).slice(0, 8).map((c) => c.name), [stats]);

  // Popular = top plugins by parent-marketplace stars (search lives in the combobox)
  const displayPlugins = useMemo(() => topPluginsByStars(allPlugins, 9), [allPlugins]);

  // Deterministic daily rotation over the highest-signal marketplaces
  const featured = useMemo(() => selectFeaturedMarketplaces(marketplaces, 6), [marketplaces]);

  return (
    <>
      <Head>
        <title>Claude Marketplace Registry — Discover Claude Code Plugins &amp; Marketplaces</title>
        <meta
          name='description'
          content='Discover and explore Claude Code plugins and marketplaces from across GitHub. Find the best tools to enhance your development workflow.'
        />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <link rel='icon' href={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/favicon.ico`} />
      </Head>

      <MainLayout>
        {/* Hero — search and the headline stats sit above the fold at 1440×900 */}
        <section
          id='ecosystem-at-a-glance'
          className='relative bg-gray-50 dark:bg-gray-900 overflow-hidden'
        >
          {/* Backdrop: faint dot grid + one warm glow, static (no motion cost) */}
          <div className='absolute inset-0 dot-grid' aria-hidden='true'>
            <div className='absolute -top-32 left-1/2 -translate-x-1/2 w-[42rem] h-[24rem] bg-primary-400/15 dark:bg-primary-400/10 rounded-full blur-3xl'></div>
          </div>

          <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14'>
            <div className='text-center'>
              {/* Main heading */}
              <div className='animate-fade-in'>
                <p className='eyebrow eyebrow-prompt mb-4'>claude marketplace registry</p>
                <h1 className='text-4xl sm:text-5xl font-bold text-gray-900 dark:text-gray-50 mb-4 leading-[1.1]'>
                  Discover Claude Code
                  <span className='block gradient-text'>
                    Marketplaces &amp; Plugins
                    <span className='hero-cursor' aria-hidden='true'></span>
                  </span>
                </h1>
                <p className='text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-6 max-w-3xl mx-auto leading-relaxed'>
                  An automated, open-source aggregator that discovers and curates Claude Code
                  marketplaces and plugins from across GitHub.
                </p>
              </div>

              {/* Search Bar */}
              <div className='animate-slide-in max-w-3xl mx-auto mb-8 sm:mb-10'>
                <SearchCombobox
                  placeholder='Search plugins and marketplaces…'
                  trending={topics.slice(0, 4)}
                  className='w-full'
                />
              </div>

              {/* Ecosystem at a Glance — compact label row, details one anchor away */}
              <div className='mb-4 flex items-baseline justify-center gap-2 sm:gap-3 flex-wrap'>
                <h2 className='eyebrow'>Ecosystem at a Glance</h2>
                <span className='text-gray-300 dark:text-gray-600' aria-hidden='true'>
                  {'//'}
                </span>
                <a
                  href='#analytics-dashboard'
                  onClick={handleAnchorClick}
                  className='font-mono text-xs text-primary-600 dark:text-primary-400 hover:underline cursor-pointer'
                >
                  full statistics ↓
                </a>
              </div>

              {/* Stats — same generated stats.json as the dashboard below */}
              {statsLoading || marketplaceLoading || pluginsLoading ? (
                <LoadingState variant='skeleton' className='max-w-4xl mx-auto' />
              ) : statsError && !stats ? (
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                  Metrics temporarily unavailable — please refresh.
                </p>
              ) : (
                <>
                  <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto'>
                    <StatCard
                      icon={Package}
                      value={stats?.overview.totalPlugins ?? 0}
                      label='Total Plugins'
                      iconColor='text-primary-500 dark:text-primary-400'
                    />
                    <StatCard
                      icon={Store}
                      value={stats?.overview.totalMarketplaces ?? 0}
                      label='Marketplaces'
                      iconColor='text-success-500 dark:text-success-400'
                    />
                    <StatCard
                      icon={Users}
                      value={stats?.overview.totalDevelopers ?? 0}
                      label='Developers'
                      iconColor='text-warning-500 dark:text-warning-400'
                    />
                    <StatCard
                      icon={Star}
                      value={stats?.overview.totalStars ?? 0}
                      label='GitHub Stars'
                      iconColor='text-cyan-500 dark:text-cyan-400'
                    />
                  </div>

                  {/* Quick Stats Note */}
                  <div className='text-center mt-4'>
                    <p className='text-xs font-mono text-gray-500 dark:text-gray-400'>
                      {(stats?.overview.totalPlugins ?? 0).toLocaleString()} plugins across{' '}
                      {(stats?.overview.totalMarketplaces ?? 0).toLocaleString()} marketplaces
                      {stats?.overview.lastUpdated ? (
                        <>
                          {' · updated '}
                          <FriendlyTimestamp iso={stats.overview.lastUpdated} />
                        </>
                      ) : (
                        ''
                      )}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Featured Marketplaces Section */}
        <section className='py-12 sm:py-16 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-850'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-3'>
              <div className='text-center sm:text-left'>
                <p className='eyebrow eyebrow-prompt mb-1'>ls ./featured</p>
                <h2 className='text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-50'>
                  Featured Marketplaces
                </h2>
                <p className='text-gray-600 dark:text-gray-400 text-sm sm:text-base mt-1'>
                  Top marketplaces by stars and activity — rotated daily
                </p>
              </div>
              <Link
                href='/marketplaces'
                className='inline-flex items-center justify-center px-4 py-2 font-mono text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 group transition-colors self-center sm:self-auto'
              >
                view all
                <span className='ml-1 transform transition-transform group-hover:translate-x-1'>
                  →
                </span>
              </Link>
            </div>

            {marketplaceLoading ? (
              <LoadingState variant='skeleton' className='max-w-5xl' />
            ) : featured.length === 0 ? (
              <p className='text-center text-gray-500 dark:text-gray-400 py-8'>
                {marketplaceError
                  ? 'Marketplace data is temporarily unavailable — please refresh.'
                  : 'No marketplaces indexed yet.'}
              </p>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5'>
                {featured.map((marketplace) => (
                  <div key={marketplace.id} className='card-interactive group h-full flex flex-col'>
                    <div className='flex items-start justify-between mb-3'>
                      <div className='flex-1 min-w-0'>
                        <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate'>
                          <Link
                            href={`/marketplaces/${marketplace.id}`}
                            className='hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded'
                            aria-label={`View details for ${marketplace.name}`}
                          >
                            {marketplace.name}
                          </Link>
                        </h3>
                        <p className='text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed mt-1'>
                          {marketplace.description}
                        </p>
                      </div>
                      {marketplace.hasManifest && (
                        <div className='flex-shrink-0 ml-2'>
                          <ShieldCheck
                            className='w-5 h-5 text-success-500'
                            aria-label='Validated marketplace manifest'
                          />
                        </div>
                      )}
                    </div>

                    <div className='flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-4'>
                      <span className='flex items-center gap-1.5 font-mono'>
                        <Star className='w-4 h-4' aria-hidden='true' />
                        {(marketplace.stars || 0).toLocaleString()}
                      </span>
                      {Array.isArray(marketplace.topics) && marketplace.topics[0] && (
                        <span className='badge badge-secondary text-xs'>
                          {marketplace.topics[0]}
                        </span>
                      )}
                    </div>

                    <div className='mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end'>
                      <Link
                        href={`/marketplaces/${marketplace.id}`}
                        className='cta group/cta'
                        aria-label={`Open ${marketplace.name} marketplace page`}
                      >
                        view details
                        <ChevronRight className='cta-arrow w-4 h-4' />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Plugins Grid Section */}
        <section className='py-12 sm:py-16 bg-gray-50 dark:bg-gray-850 border-t border-gray-200 dark:border-gray-800'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-3'>
              <div className='text-center sm:text-left'>
                <p className='eyebrow eyebrow-prompt mb-1'>cat popular.json</p>
                <h2 className='text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-50'>
                  Popular Plugins
                </h2>
                <p className='text-gray-600 dark:text-gray-400 text-sm sm:text-base mt-1'>
                  Popular picks from the most-starred marketplaces
                </p>
              </div>
              <Link
                href='/plugins'
                className='inline-flex items-center justify-center px-4 py-2 font-mono text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 group transition-colors self-center sm:self-auto'
              >
                view all
                <span className='ml-1 transform transition-transform group-hover:translate-x-1'>
                  →
                </span>
              </Link>
            </div>

            {marketplaceLoading || pluginsLoading ? (
              <LoadingState variant='skeleton' className='max-w-5xl' />
            ) : displayPlugins.length > 0 ? (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5'>
                {displayPlugins.slice(0, 9).map((plugin) => (
                  <PluginCard key={plugin.id} plugin={plugin} className='h-full' />
                ))}
              </div>
            ) : (
              <div className='text-center py-12 sm:py-16'>
                <div className='text-gray-400 dark:text-gray-500 mb-6'>
                  <Package className='w-16 h-16 sm:w-20 sm:h-20 mx-auto' />
                </div>
                <h3 className='text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3'>
                  No plugins found
                </h3>
                <p className='text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto'>
                  No plugins available at the moment.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Ecosystem Statistics Section */}
        <section
          id='analytics-dashboard'
          className='py-12 sm:py-16 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-850'
        >
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <EcosystemStats
              title='Ecosystem Statistics'
              subtitle='Live metrics from the daily marketplace scans'
              showRefreshButton={true}
              showLastUpdated={true}
              className='max-w-7xl mx-auto'
            />
          </div>
        </section>

        {/* CTA Section */}
        <section className='relative py-12 sm:py-16 bg-gray-900 dark:bg-gray-950 border-t border-primary-800/40 overflow-hidden'>
          {/* Background decoration */}
          <div className='absolute inset-0 dot-grid opacity-40' aria-hidden='true'>
            <div className='absolute -bottom-24 left-1/2 -translate-x-1/2 w-[36rem] h-[18rem] bg-primary-500/15 rounded-full blur-3xl'></div>
          </div>

          <div className='relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
            <div className='animate-fade-in'>
              <p className='eyebrow eyebrow-prompt mb-3 !text-gray-400'>./join --community</p>
              <h2 className='text-2xl sm:text-3xl font-bold text-gray-50 mb-4'>
                Join the Claude Code Community
              </h2>
              <p className='text-lg text-gray-300 mb-8 max-w-2xl mx-auto'>
                Share your plugins, discover new tools, and collaborate with developers worldwide.
              </p>
              <div className='flex flex-col sm:flex-row gap-4 justify-center items-center'>
                <a
                  href='https://github.com/shrwnsan/claude-marketplace-registry'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='btn bg-primary-500 text-white hover:bg-primary-400 font-medium px-6 py-3 group min-w-[200px] justify-center'
                  aria-label='Contribute on GitHub'
                >
                  <Github className='w-5 h-5 mr-2' />
                  Contribute on GitHub
                </a>
                <Link
                  href='/docs/api'
                  className='btn border border-gray-600 text-gray-200 hover:bg-gray-800 hover:text-white hover:border-gray-500 font-medium px-6 py-3 group min-w-[200px] justify-center'
                >
                  view_api_docs
                  <span className='ml-2 transform transition-transform group-hover:translate-x-1'>
                    →
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </MainLayout>
    </>
  );
};

export default HomePage;
