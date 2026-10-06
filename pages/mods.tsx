import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import MainLayout from '@/components/layout/MainLayout';
import SearchBar from '@/components/Search/SearchBar';
import PluginCard from '@/components/Marketplace/PluginCard';
import { usePluginData } from '@/hooks/usePluginData';
import { useEcosystemStats } from '@/hooks/useEcosystemStats';
import LoadingState from '@/components/ui/LoadingState';
import SortSelect from '@/components/ui/SortSelect';
import { Zap, Package, Terminal, ShieldAlert, ArrowUp } from 'lucide-react';

/**
 * The mods surface is days old — the "new" pill self-expires instead of
 * lingering as a stale badge on a mature section (deploys are daily, so the
 * static HTML drops it on the first build past this date).
 */
const MODS_NEW_UNTIL = '2026-11-15';
const isModsSectionNew = () => Date.now() < new Date(`${MODS_NEW_UNTIL}T23:59:59Z`).getTime();

/**
 * Mods landing — a pre-filtered view over the plugin index (modsCount > 0).
 * Mods are a pattern, not a category: the listing shares the plugins plumbing
 * and this page adds only the explainer + install flow around it.
 */
const ModsPage: React.FC = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Deep-link support: /mods?q=term seeds the search
  useEffect(() => {
    const q = router.query.q;
    if (typeof q === 'string' && q) {
      setSearchQuery(q);
    }
  }, [router.query.q]);
  const [sortBy, setSortBy] = useState<'stars' | 'name'>('stars');
  const [showBackToTop, setShowBackToTop] = useState(false);

  const { plugins, loading, error } = usePluginData();
  const { data: stats } = useEcosystemStats();

  const mods = useMemo(() => plugins.filter((p) => (p.modsCount ?? 0) > 0), [plugins]);
  const marketplacesWithMods = useMemo(
    () => new Set(mods.map((p) => p.marketplaceId).filter(Boolean)).size,
    [mods]
  );

  const filteredAndSortedMods = useMemo(() => {
    const filtered = mods.filter((plugin) => {
      const q = searchQuery.toLowerCase();
      return (
        q === '' ||
        plugin.name.toLowerCase().includes(q) ||
        plugin.description.toLowerCase().includes(q) ||
        plugin.author.toLowerCase().includes(q) ||
        plugin.marketplaceName.toLowerCase().includes(q)
      );
    });
    filtered.sort((a, b) => (b.stars || 0) - (a.stars || 0) || a.name.localeCompare(b.name));
    return filtered;
  }, [mods, searchQuery]);

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
              <h1 className='text-2xl font-bold text-red-600 mb-4'>Error Loading Mods</h1>
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
        <title>Claude Code Mods — Hook Modules Shipped as Plugins</title>
        <meta
          name='description'
          content='Browse Claude Code mods: TypeScript hook modules that ship inside plugins. Guard risky commands, meter spend, and draw live terminal UI. Nightly-scanned directory of mod-carrying plugins.'
        />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <link rel='icon' href={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/favicon.ico`} />
      </Head>

      <MainLayout>
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
          {/* Header + explainer */}
          <section className='bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700'>
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
              <div className='text-center mb-8'>
                <p className='eyebrow eyebrow-prompt mb-2'>mods --hook-modules</p>
                <h1 className='text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4'>
                  Claude Code Mods
                  {isModsSectionNew() && (
                    <span
                      className='ml-3 inline-flex translate-y-[-0.15em] items-center gap-1 rounded-full border border-primary-500/40 bg-primary-500/10 px-2.5 py-1 align-middle text-[11px] sm:text-xs font-mono font-semibold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400'
                      title='Mods shipped via Claude Code plugins — surfaced here as of October 2026'
                    >
                      <Zap className='w-3 h-3' aria-hidden='true' />
                      new
                    </span>
                  )}
                </h1>
                <p className='text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto'>
                  Small TypeScript hook modules that ride inside Claude Code plugins — they watch
                  session events, guard risky commands, meter spend, and draw live terminal UI.
                  Distributed through the same marketplaces as plugins.
                </p>
              </div>

              <div className='max-w-3xl mx-auto grid gap-4 sm:grid-cols-2 mb-6'>
                {/* Install flow */}
                <div className='card p-5'>
                  <p className='flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3'>
                    <Terminal
                      className='w-4 h-4 text-primary-500 dark:text-primary-400'
                      aria-hidden='true'
                    />
                    Install a mod
                  </p>
                  <pre className='font-mono text-xs leading-relaxed text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 rounded-lg p-3 overflow-x-auto'>
                    <span className='text-primary-500 dark:text-primary-400'>/plugin</span>{' '}
                    marketplace add owner/repo{'\n'}
                    <span className='text-primary-500 dark:text-primary-400'>/plugin</span> install
                    mod-name@owner
                  </pre>
                  <p className='text-xs text-gray-500 dark:text-gray-400 mt-3'>
                    Requires Claude Code v2.1.287+ · mods are on by default
                  </p>
                </div>

                {/* Safety note */}
                <div className='card p-5'>
                  <p className='flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3'>
                    <ShieldAlert
                      className='w-4 h-4 text-warning-500 dark:text-warning-400'
                      aria-hidden='true'
                    />
                    Vet before you install
                  </p>
                  <p className='text-sm text-gray-600 dark:text-gray-400 leading-relaxed'>
                    Mods run with the same access as Claude Code itself: they can observe and
                    rewrite tool calls. Check the publisher, the source repo, and what events a mod
                    subscribes to before trusting it — every listing below links straight to the
                    source.
                  </p>
                </div>
              </div>

              <p className='text-center text-sm font-mono text-gray-500 dark:text-gray-400'>
                {(stats?.overview.totalMods ?? mods.length).toLocaleString()} mods across{' '}
                {(stats?.overview.marketplacesWithMods ?? marketplacesWithMods).toLocaleString()}{' '}
                marketplaces
              </p>
            </div>
          </section>

          {/* Listing */}
          <section className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
            {mods.length === 0 ? (
              <div className='text-center py-16'>
                <div className='text-gray-400 dark:text-gray-500 mb-6'>
                  <Zap className='w-16 h-16 mx-auto' />
                </div>
                <h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3'>
                  No mods indexed yet
                </h2>
                <p className='text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-8'>
                  The scanner stamps mod counts on every nightly scan and the directory refreshes
                  automatically — check back after the next data update.
                </p>
                <Link href='/plugins' className='btn btn-secondary px-6 py-2.5'>
                  Browse all plugins
                </Link>
              </div>
            ) : (
              <>
                <div className='mb-6 flex flex-wrap items-center justify-between gap-3'>
                  <p className='text-gray-600 dark:text-gray-400'>
                    Showing {filteredAndSortedMods.length} of {mods.length} mods
                    {searchQuery && ` matching "${searchQuery}"`}
                  </p>
                  <div className='flex items-center gap-3 flex-shrink-0'>
                    <SearchBar
                      onSearch={setSearchQuery}
                      placeholder='Search mods…'
                      ariaLabel='Search mods'
                      showTrending={false}
                      className='w-56'
                    />
                    <SortSelect
                      id='mod-sort'
                      label='Sort by:'
                      value={sortBy}
                      onChange={(v) => setSortBy(v as 'stars' | 'name')}
                      options={[
                        { value: 'stars', label: 'Parent stars' },
                        { value: 'name', label: 'Name' },
                      ]}
                    />
                  </div>
                </div>

                {filteredAndSortedMods.length > 0 ? (
                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                    {filteredAndSortedMods.map((plugin) => (
                      <PluginCard key={plugin.id} plugin={plugin} />
                    ))}
                  </div>
                ) : (
                  <div className='text-center py-16'>
                    <div className='text-gray-400 dark:text-gray-500 mb-6'>
                      <Package className='w-16 h-16 mx-auto' />
                    </div>
                    <h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3'>
                      No mods found
                    </h2>
                    <p className='text-gray-600 dark:text-gray-400 mb-8'>
                      No mods found matching your search. Try different keywords.
                    </p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className='btn btn-primary'
                      aria-label='Clear search'
                    >
                      Clear search
                    </button>
                  </div>
                )}
              </>
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

export default ModsPage;
