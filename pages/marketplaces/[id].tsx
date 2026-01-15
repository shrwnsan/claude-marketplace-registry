import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import PluginCard from '@/components/Marketplace/PluginCard';
import {
  Star,
  Github,
  ExternalLink,
  Package,
  Shield,
  Code,
  Book,
  Filter,
  Search,
  ArrowLeft,
  Copy,
  Check,
  Share2,
} from 'lucide-react';
import { MarketplacePlugin } from '@/data/mock-data';
import { useRealMarketplaceData } from '@/hooks/useRealMarketplaceData';

interface _MarketplaceDetailProps {
  marketplace: MarketplacePlugin['marketplace'] & {
    owner: string;
    repositoryUrl: string;
    stars: number;
    category: string;
    verified: boolean;
    featured: boolean;
    plugins: MarketplacePlugin[];
  };
}

const MarketplaceDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'name' | 'stars' | 'updated'>('stars');
  const [copied, setCopied] = useState(false);
  const [rating, setRating] = useState(0);
  const [userRating, setUserRating] = useState(0);

  // Get real marketplace data
  const { data: marketplaceData } = useRealMarketplaceData();

  // Find marketplace by ID
  const marketplace = useMemo(() => {
    if (!id || !marketplaceData?.marketplaces) return null;
    return marketplaceData.marketplaces.find((m) => m.id === id);
  }, [id, marketplaceData]);

  // Get plugins for this marketplace
  const marketplacePlugins = useMemo(() => {
    if (!marketplace) return [];
    if (!marketplace.manifest || !marketplace.manifest.plugins) return [];

    // Transform manifest plugins to MarketplacePlugin format
    return marketplace.manifest.plugins.map((plugin: any) => ({
      id: plugin.name,
      name: plugin.name,
      description: plugin.description || '',
      category: plugin.category || 'development',
      tags: [plugin.category || 'development'],
      author: plugin.author || marketplace.name,
      authorUrl: `https://github.com/${marketplace.name}`,
      repositoryUrl: marketplace.url,
      stars: marketplace.stars,
      downloads: 0,
      lastUpdated: marketplace.updatedAt,
      version: plugin.version || '1.0.0',
      license: marketplace.license,
      marketplace: marketplace.name,
      marketplaceUrl: marketplace.url,
      featured: true,
      verified: true,
    }));
  }, [marketplace]);

  // Filter and sort plugins
  const filteredPlugins = useMemo(() => {
    const filtered = marketplacePlugins.filter((plugin: any) => {
      const matchesSearch =
        searchQuery === '' ||
        plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plugin.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plugin.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        plugin.author.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === 'All' || plugin.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    // Sort plugins
    filtered.sort((a: any, b: any) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'stars':
          return b.stars - a.stars;
        case 'updated':
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [marketplacePlugins, searchQuery, selectedCategory, sortBy]);

  // Get unique categories from plugins
  const categories = useMemo((): string[] => {
    const uniqueCats = new Set<string>(
      marketplacePlugins.map((p: any) => p.category).filter((cat: any) => cat)
    );
    const cats = ['All', ...Array.from(uniqueCats)];
    return cats;
  }, [marketplacePlugins]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!marketplace) return { totalDownloads: 0, totalStars: 0, verifiedPlugins: 0 };

    return {
      totalDownloads: marketplacePlugins.reduce(
        (sum: number, plugin: any) => sum + plugin.downloads,
        0
      ),
      totalStars:
        marketplacePlugins.reduce((sum: number, plugin: any) => sum + plugin.stars, 0) +
        marketplace.stars,
      verifiedPlugins: marketplacePlugins.filter((plugin: any) => plugin.verified).length,
    };
  }, [marketplace, marketplacePlugins]);

  // Load saved rating from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && marketplace) {
      const savedRating = localStorage.getItem(`rating-marketplace-${marketplace.id}`);
      if (savedRating) {
        setUserRating(parseInt(savedRating));
      }

      // Load average rating (mock data for now)
      const avgRating = localStorage.getItem(`avg-rating-marketplace-${marketplace.id}`);
      if (avgRating) {
        setRating(parseFloat(avgRating));
      } else {
        // Mock average rating
        const mockRating = 3.5 + Math.random() * 1.5;
        setRating(mockRating);
        localStorage.setItem(`avg-rating-marketplace-${marketplace.id}`, mockRating.toString());
      }
    }
  }, [marketplace]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleRating = (newRating: number) => {
    setUserRating(newRating);
    if (typeof window !== 'undefined' && marketplace) {
      localStorage.setItem(`rating-marketplace-${marketplace.id}`, newRating.toString());

      // Update average rating (simple calculation)
      const newAvgRating = (rating + newRating) / 2;
      setRating(newAvgRating);
      localStorage.setItem(`avg-rating-marketplace-${marketplace.id}`, newAvgRating.toString());
    }
  };

  const shareMarketplace = async () => {
    if (navigator.share && marketplace) {
      try {
        await navigator.share({
          title: marketplace.name,
          text: marketplace.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      copyToClipboard(window.location.href);
    }
  };

  if (!marketplace) {
    return (
      <MainLayout>
        <div className='min-h-screen flex items-center justify-center'>
          <div className='text-center'>
            <div className='text-gray-400 dark:text-gray-500 mb-6'>
              <Package className='w-16 h-16 mx-auto' />
            </div>
            <h1 className='text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3'>
              Marketplace not found
            </h1>
            <p className='text-gray-600 dark:text-gray-400 mb-8'>
              The marketplace you're looking for doesn't exist or has been removed.
            </p>
            <Link href='/' className='btn btn-primary'>
              <ArrowLeft className='w-4 h-4 mr-2' />
              Back to Home
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <>
      <Head>
        <title>{marketplace.name} - Claude Marketplace Aggregator</title>
        <meta name='description' content={marketplace.description} />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <link rel='icon' href='/favicon.ico' />

        {/* Open Graph tags */}
        <meta property='og:title' content={marketplace.name} />
        <meta property='og:description' content={marketplace.description} />
        <meta property='og:type' content='website' />
        <meta
          property='og:url'
          content={typeof window !== 'undefined' ? window.location.href : ''}
        />
        <meta
          property='og:image'
          content={`${process.env.NEXT_PUBLIC_SITE_URL}/images/og-image.png`}
        />

        {/* Twitter Card tags */}
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:title' content={marketplace.name} />
        <meta name='twitter:description' content={marketplace.description} />
        <meta
          name='twitter:image'
          content={`${process.env.NEXT_PUBLIC_SITE_URL}/images/og-image.png`}
        />
      </Head>

      <MainLayout>
        {/* Header Section */}
        <section className='bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12'>
            {/* Breadcrumb */}
            <nav className='mb-6'>
              <ol className='flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400'>
                <li>
                  <Link
                    href='/'
                    className='hover:text-primary-600 dark:hover:text-primary-400 transition-colors'
                  >
                    Home
                  </Link>
                </li>
                <li className='flex items-center space-x-2'>
                  <span>/</span>
                  <Link
                    href='/marketplaces'
                    className='hover:text-primary-600 dark:hover:text-primary-400 transition-colors'
                  >
                    Marketplaces
                  </Link>
                </li>
                <li className='flex items-center space-x-2'>
                  <span>/</span>
                  <span className='text-gray-900 dark:text-gray-100 truncate'>
                    {marketplace.name}
                  </span>
                </li>
              </ol>
            </nav>

            {/* Marketplace Header */}
            <div className='flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6'>
              <div className='flex-1'>
                <div className='flex items-center space-x-3 mb-4'>
                  <h1 className='text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100'>
                    {marketplace.name}
                  </h1>
                  <div className='flex items-center space-x-2'>
                    {marketplace.verified && (
                      <div className='flex items-center space-x-1'>
                        <Shield className='w-5 h-5 text-blue-500' />
                        <span className='text-sm text-blue-500 font-medium'>Verified</span>
                      </div>
                    )}
                    {marketplace.featured && <span className='badge badge-warning'>Featured</span>}
                  </div>
                </div>

                <p className='text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed'>
                  {marketplace.description}
                </p>

                {/* Rating and Stats */}
                <div className='flex flex-wrap items-center gap-4 mb-6'>
                  <div className='flex items-center space-x-1'>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRating(star)}
                        className='transition-colors'
                        aria-label={`Rate ${star} stars`}
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= rating
                              ? 'fill-current text-yellow-500'
                              : star <= userRating
                                ? 'fill-current text-yellow-400'
                                : 'text-gray-300 dark:text-gray-600'
                          } hover:text-yellow-400`}
                        />
                      </button>
                    ))}
                    <span className='ml-2 text-sm text-gray-600 dark:text-gray-400'>
                      {rating.toFixed(1)} ({marketplacePlugins.length} reviews)
                    </span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className='grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6'>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
                      {marketplacePlugins.length}
                    </div>
                    <div className='text-sm text-gray-600 dark:text-gray-400'>Plugins</div>
                  </div>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
                      {marketplace.stars.toLocaleString()}
                    </div>
                    <div className='text-sm text-gray-600 dark:text-gray-400'>Stars</div>
                  </div>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
                      {stats.totalDownloads.toLocaleString()}
                    </div>
                    <div className='text-sm text-gray-600 dark:text-gray-400'>Downloads</div>
                  </div>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
                      {stats.verifiedPlugins}
                    </div>
                    <div className='text-sm text-gray-600 dark:text-gray-400'>Verified</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className='flex flex-col space-y-3 lg:w-64'>
                <a
                  href={marketplace.url}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='btn btn-primary group justify-center'
                >
                  Visit Marketplace
                  <ExternalLink className='w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform' />
                </a>

                <div className='flex space-x-2'>
                  <a
                    href={marketplace.repositoryUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='btn-ghost p-3 group flex-1 justify-center'
                    title='View on GitHub'
                  >
                    <Github className='w-5 h-5 group-hover:scale-110 transition-transform' />
                  </a>

                  <button
                    onClick={() => copyToClipboard(marketplace.repositoryUrl)}
                    className='btn-ghost p-3 group flex-1 justify-center'
                    title='Copy repository URL'
                  >
                    {copied ? (
                      <Check className='w-5 h-5 text-green-500' />
                    ) : (
                      <Copy className='w-5 h-5 group-hover:scale-110 transition-transform' />
                    )}
                  </button>

                  <button
                    onClick={shareMarketplace}
                    className='btn-ghost p-3 group flex-1 justify-center'
                    title='Share marketplace'
                  >
                    <Share2 className='w-5 h-5 group-hover:scale-110 transition-transform' />
                  </button>
                </div>

                <div className='text-xs text-gray-500 dark:text-gray-400 text-center'>
                  <span className='badge badge-secondary'>{marketplace.category}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Filters and Search */}
        <section className='bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 py-6'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='flex flex-col lg:flex-row gap-4'>
              {/* Search */}
              <div className='flex-1'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
                  <input
                    type='text'
                    placeholder='Search plugins...'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className='w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent'
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className='flex items-center space-x-2'>
                <Filter className='w-5 h-5 text-gray-500' />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent'
                >
                  {categories.map((category: string) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div className='flex items-center space-x-2'>
                <span className='text-sm text-gray-600 dark:text-gray-400'>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'stars' | 'updated')}
                  className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent'
                >
                  <option value='stars'>Stars</option>
                  <option value='name'>Name</option>
                  <option value='updated'>Last Updated</option>
                </select>
              </div>

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setSortBy('stars');
                }}
                className='btn-ghost px-4 py-2'
              >
                Clear
              </button>
            </div>

            {/* Results Count */}
            <div className='mt-4 text-sm text-gray-600 dark:text-gray-400'>
              Showing {filteredPlugins.length} of {marketplacePlugins.length} plugins
            </div>
          </div>
        </section>

        {/* Plugins Grid */}
        <section className='py-12 bg-white dark:bg-gray-900'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            {filteredPlugins.length > 0 ? (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {filteredPlugins.map((plugin: any) => (
                  <PluginCard key={plugin.id} plugin={plugin} />
                ))}
              </div>
            ) : (
              <div className='text-center py-12'>
                <div className='text-gray-400 dark:text-gray-500 mb-6'>
                  <Package className='w-16 h-16 mx-auto' />
                </div>
                <h3 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3'>
                  No plugins found
                </h3>
                <p className='text-gray-600 dark:text-gray-400 mb-8'>
                  Try adjusting your filters or search terms.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                  }}
                  className='btn btn-primary'
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Installation Instructions */}
        <section className='py-12 bg-gray-50 dark:bg-gray-800/50'>
          <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
            <h2 className='text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6'>
              How to Use This Marketplace
            </h2>

            <div className='space-y-6'>
              <div className='card'>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3'>
                  <Code className='w-5 h-5 inline mr-2' />
                  Installation
                </h3>
                <div className='space-y-3'>
                  <p className='text-gray-600 dark:text-gray-300'>
                    To use plugins from this marketplace, you need to add the marketplace URL to
                    your Claude configuration:
                  </p>
                  <div className='bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm'>
                    <div className='flex items-center justify-between mb-2'>
                      <span className='text-gray-400'># Add to your claude config</span>
                      <button
                        onClick={() => copyToClipboard(marketplace.url)}
                        className='text-gray-400 hover:text-white transition-colors'
                      >
                        {copied ? <Check className='w-4 h-4' /> : <Copy className='w-4 h-4' />}
                      </button>
                    </div>
                    <code>marketplace_url: "{marketplace.url}"</code>
                  </div>
                </div>
              </div>

              <div className='card'>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3'>
                  <Book className='w-5 h-5 inline mr-2' />
                  Usage Examples
                </h3>
                <div className='space-y-3'>
                  <p className='text-gray-600 dark:text-gray-300'>
                    Once configured, you can use plugins from this marketplace in your Claude Code
                    sessions:
                  </p>
                  <div className='bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm'>
                    <code>
                      # Install a plugin from the marketplace
                      <br />
                      /install{' '}
                      {marketplacePlugins[0]?.name.toLowerCase().replace(/\s+/g, '-') ||
                        'plugin-name'}
                      <br />
                      <br />
                      # List available plugins
                      <br />
                      /plugins
                      <br />
                      <br />
                      # Use a plugin
                      <br />/
                      {marketplacePlugins[0]?.name.toLowerCase().replace(/\s+/g, '-') ||
                        'plugin-name'}{' '}
                      --help
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Related Marketplaces */}
        {marketplaceData?.marketplaces &&
          marketplaceData.marketplaces.filter(
            (m) => m.id !== marketplace.id && m.category === marketplace.category
          ).length > 0 && (
            <section className='py-12 bg-white dark:bg-gray-900'>
              <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                <h2 className='text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6'>
                  Related Marketplaces
                </h2>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                  {marketplaceData.marketplaces
                    .filter((m) => m.id !== marketplace.id && m.category === marketplace.category)
                    .slice(0, 3)
                    .map((relatedMarketplace) => (
                      <div
                        key={relatedMarketplace.id}
                        className='card group hover:shadow-lg transition-all'
                      >
                        <div className='flex items-start justify-between mb-4'>
                          <div className='flex-1'>
                            <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors'>
                              <Link
                                href={`/marketplaces/${relatedMarketplace.id}`}
                                className='hover:underline'
                              >
                                {relatedMarketplace.name}
                              </Link>
                            </h3>
                            <p className='text-sm text-gray-600 dark:text-gray-300 line-clamp-2'>
                              {relatedMarketplace.description}
                            </p>
                          </div>
                          {relatedMarketplace.verified && (
                            <Shield className='w-5 h-5 text-blue-500 flex-shrink-0 ml-2' />
                          )}
                        </div>

                        <div className='flex items-center justify-between text-sm text-gray-500 dark:text-gray-400'>
                          <div className='flex items-center space-x-3'>
                            <div className='flex items-center space-x-1'>
                              <Star className='w-4 h-4' />
                              <span>{relatedMarketplace.stars.toLocaleString()}</span>
                            </div>
                            <span className='badge badge-secondary text-xs'>
                              {relatedMarketplace.category}
                            </span>
                          </div>
                        </div>

                        <div className='mt-4 pt-4 border-t border-gray-100 dark:border-gray-700'>
                          <Link
                            href={`/marketplaces/${relatedMarketplace.id}`}
                            className='text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium text-sm group'
                          >
                            View marketplace
                            <span className='ml-1 transform transition-transform group-hover:translate-x-1 inline-block'>
                              →
                            </span>
                          </Link>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </section>
          )}
      </MainLayout>
    </>
  );
};

export default MarketplaceDetailPage;
