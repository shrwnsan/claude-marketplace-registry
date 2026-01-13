import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import MainLayout from '../components/layout/MainLayout';
import SearchBar from '../components/Search/SearchBar';
import PluginCard from '../components/Marketplace/PluginCard';
import { EcosystemStats } from '../components/EcosystemStats';
import { useRealMarketplaceData } from '../hooks/useRealMarketplaceData';
import { usePluginData } from '../hooks/usePluginData';
import { mockMarketplaces, categories } from '../data/mock-data';
import LoadingState from '../components/ui/LoadingState';
import { Star, Download, Github, ExternalLink, TrendingUp, Users, Package, BarChart, Shield, Store } from 'lucide-react';
import Link from 'next/link';
import { handleAnchorClick } from '../utils/scroll';

const HomePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  // Use real marketplace data with fallback to mock data
  const { data: marketplaceData, loading: marketplaceLoading, error: _marketplaceError } = useRealMarketplaceData();
  const { plugins: allPlugins, loading: pluginsLoading, error: _pluginsError } = usePluginData();

  // Get marketplaces from real data or fall back to mock data
  const marketplaces = marketplaceData?.marketplaces || mockMarketplaces;

  // Filter plugins based on search query and category
  const filteredPlugins = useMemo(() => {
    return allPlugins.filter((plugin) => {
      const matchesSearch = searchQuery === '' ||
        plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plugin.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plugin.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        plugin.author.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === 'All' || plugin.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [allPlugins, searchQuery, selectedCategory]);

  // Calculate stats dynamically from real data using same logic as ecosystem statistics
  const dynamicStats = useMemo(() => {
    if (marketplaceData?.marketplaces && marketplaceData.marketplaces.length > 0) {
      // Use the same logic as ecosystem-stats API
      const marketplaces = marketplaceData.marketplaces;

      // Extract plugin counts from marketplace descriptions (same as ecosystem-stats)
      const extractPluginCount = (description: string): number => {
        const matches = description.match(/(\d+)\s+(?:plugins?|tools?|commands?)/i);
        return matches ? parseInt(matches[1]) : 0;
      };

      // Calculate estimated plugin counts from marketplace descriptions
      const totalEstimatedPlugins = marketplaces.reduce((sum: number, m: any) => {
        return sum + extractPluginCount(m.description || '');
      }, 0);

      const totalMarketplaces = marketplaces.length;
      const totalStars = marketplaces.reduce((sum: number, mp: any) => sum + (mp.stars || 0), 0);

      // Estimate downloads based on stars and ecosystem growth (same as ecosystem-stats)
      const now = new Date();
      const launchDate = new Date('2025-10-10');
      const daysSinceLaunch = Math.max(1, Math.floor((now.getTime() - launchDate.getTime()) / (1000 * 60 * 60 * 24)));

      const estimatedTotalDownloads = totalStars * 15 + // Base downloads from stars
        Math.floor(totalEstimatedPlugins * 25 * (daysSinceLaunch / 30)); // Growth since launch

      return {
        totalPlugins: totalEstimatedPlugins,
        totalMarketplaces,
        totalStars,
        totalDownloads: estimatedTotalDownloads
      };
    }

    // Fallback to mock stats if no real data
    return {
      totalPlugins: allPlugins.length,
      totalMarketplaces: mockMarketplaces.length,
      totalStars: mockMarketplaces.reduce((sum, mp) => sum + (mp.stars || 0), 0),
      totalDownloads: allPlugins.reduce((sum, plugin) => sum + (plugin.downloads || 0), 0)
    };
  }, [marketplaceData, allPlugins]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterClick = () => {
    setShowFilters(!showFilters);
  };

  
  return (
    <>
      <Head>
        <title>Claude Marketplace Aggregator - Discover Claude Code Plugins & Marketplaces</title>
        <meta name="description" content="Discover and explore Claude Code plugins and marketplaces from across GitHub. Find the best tools to enhance your development workflow." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <MainLayout>
        
        {/* Hero Section */}
        <section id="ecosystem-at-a-glance" className="relative bg-gradient-to-br from-primary-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-primary-900/20 py-12 sm:py-16 lg:py-24 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200 dark:bg-primary-800/20 rounded-full blur-3xl opacity-30 animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 dark:bg-blue-800/20 rounded-full blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              {/* Main heading */}
              <div className="animate-fade-in">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 dark:text-gray-100 mb-4 sm:mb-6 leading-tight">
                  Discover Claude Code
                  <span className="block gradient-text mt-2">Marketplaces & Plugins</span>
                </h1>
                <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 max-w-4xl mx-auto leading-relaxed px-4">
                  An automated, open-source aggregator that discovers and curates Claude Code marketplaces
                  and plugins from across GitHub. Enhance your development workflow with the best tools.
                </p>
              </div>

              {/* Search Bar */}
              <div className="animate-slide-in max-w-4xl mx-auto px-4 mb-8 sm:mb-12">
                <SearchBar
                  onSearch={handleSearch}
                  onFilterClick={handleFilterClick}
                  className="w-full"
                />
              </div>

              {/* Ecosystem at a Glance */}
              <div className="mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Ecosystem at a Glance
                </h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  Key metrics from the Claude Code plugin ecosystem. For detailed analytics and trends,
                  see the <a href="#analytics-dashboard" onClick={handleAnchorClick} className="text-primary-600 dark:text-primary-400 hover:underline cursor-pointer">Ecosystem Statistics</a> section below.
                </p>
              </div>

              {/* Stats */}
              {marketplaceLoading || pluginsLoading ? (
                <LoadingState variant="skeleton" className="max-w-5xl mx-auto px-4" />
              ) : (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 max-w-5xl mx-auto px-4">
                    <div className="glass rounded-xl p-4 sm:p-6 text-center transform hover:scale-105 transition-all duration-300 group">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center group-hover:bg-primary-200 dark:group-hover:bg-primary-900/50 transition-colors">
                        <Package className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                        {dynamicStats.totalPlugins.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Total Plugins</div>
                    </div>

                    <div className="glass rounded-xl p-4 sm:p-6 text-center transform hover:scale-105 transition-all duration-300 group">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-3 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center group-hover:bg-success-200 dark:group-hover:bg-success-900/50 transition-colors">
                        <Store className="w-6 h-6 sm:w-8 sm:h-8 text-success-600 dark:text-success-400" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                        {dynamicStats.totalMarketplaces.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Marketplaces</div>
                    </div>

                    <div className="glass rounded-xl p-4 sm:p-6 text-center transform hover:scale-105 transition-all duration-300 group">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-3 bg-warning-100 dark:bg-warning-900/30 rounded-lg flex items-center justify-center group-hover:bg-warning-200 dark:group-hover:bg-warning-900/50 transition-colors">
                        <Download className="w-6 h-6 sm:w-8 sm:h-8 text-warning-600 dark:text-warning-400" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                        {dynamicStats.totalDownloads.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Total Downloads</div>
                    </div>

                    <div className="glass rounded-xl p-4 sm:p-6 text-center transform hover:scale-105 transition-all duration-300 group">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                        <Star className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                        {dynamicStats.totalStars.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">GitHub Stars</div>
                    </div>
                  </div>

                  {/* Quick Stats Note */}
                  <div className="text-center mt-6">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Data based on {dynamicStats.totalPlugins.toLocaleString()} indexed plugins across {dynamicStats.totalMarketplaces.toLocaleString()} marketplaces
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Filter Section */}
        {showFilters && (
          <section className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-4 sm:py-6 animate-slide-in">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
                        selectedCategory === category
                          ? 'bg-primary-600 text-white shadow-md hover:bg-primary-700'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                      aria-label={`Filter by ${category}`}
                      aria-pressed={selectedCategory === category}
                    >
                      {category}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setSearchQuery('');
                  }}
                  className="btn-ghost text-sm px-4 py-2 self-center sm:self-auto"
                  aria-label="Clear all filters"
                >
                  Clear filters
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Featured Marketplaces Section */}
        <section className="py-12 sm:py-16 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 sm:mb-12 gap-4">
              <div className="text-center sm:text-left">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Featured Marketplaces
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">
                  Discover the most popular Claude Code marketplaces
                </p>
              </div>
              <Link
                href="/marketplaces"
                className="inline-flex items-center justify-center px-4 py-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium group transition-colors self-center sm:self-auto"
              >
                View all
                <span className="ml-1 transform transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>

            {marketplaceLoading || pluginsLoading ? (
              <LoadingState variant="skeleton" className="max-w-5xl" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {Array.isArray(marketplaces) && marketplaces.slice(0, 6).map((marketplace, index) => (
                <div
                  key={marketplace.id}
                  className="card group hover:shadow-lg dark:hover:shadow-gray-900/30 transition-all duration-300 hover:-translate-y-1"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                        {marketplace.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                        {marketplace.description}
                      </p>
                    </div>
                    {marketplace.verified && (
                      <div className="flex-shrink-0 ml-2">
                        <Shield className="w-5 h-5 text-blue-500" aria-label="Verified marketplace" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="flex items-center space-x-1 group">
                        <Star className="w-4 h-4 group-hover:fill-current group-hover:text-yellow-500 transition-colors" />
                        <span className="font-medium">{marketplace.stars.toLocaleString()}</span>
                      </div>
                      <span className="badge badge-secondary text-xs">
                        {marketplace.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <a
                      href={marketplace.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary text-sm w-full sm:w-auto justify-center group"
                      aria-label={`Visit ${marketplace.name} marketplace`}
                    >
                      Visit Marketplace
                      <ExternalLink className="w-4 h-4 ml-2 transform transition-transform group-hover:scale-110" />
                    </a>
                    <a
                      href={marketplace.repositoryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-ghost p-2 sm:p-3 group"
                      aria-label={`View ${marketplace.name} repository`}
                    >
                      <Github className="w-4 h-4 sm:w-5 sm:h-5 transform transition-transform group-hover:scale-110" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        </section>

        {/* Plugins Grid Section */}
        <section className="py-12 sm:py-16 bg-gray-50 dark:bg-gray-800/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 sm:mb-12 gap-4">
              <div className="text-center sm:text-left">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {searchQuery ? `Search Results (${filteredPlugins.length})` : 'Popular Plugins'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">
                  {searchQuery
                    ? `Showing results for "${searchQuery}"`
                    : 'Discover trending Claude Code plugins'
                  }
                </p>
              </div>
              <Link
                href="/plugins"
                className="inline-flex items-center justify-center px-4 py-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium group transition-colors self-center sm:self-auto"
              >
                View all
                <span className="ml-1 transform transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>

            {marketplaceLoading || pluginsLoading ? (
              <LoadingState variant="skeleton" className="max-w-5xl" />
            ) : filteredPlugins.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredPlugins.slice(0, 9).map((plugin, index) => (
                  <div
                    key={plugin.id}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <PluginCard plugin={plugin} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 sm:py-16">
                <div className="text-gray-400 dark:text-gray-500 mb-6">
                  <Package className="w-16 h-16 sm:w-20 sm:h-20 mx-auto" />
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  No plugins found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                  {searchQuery
                    ? `No plugins found matching "${searchQuery}". Try different keywords or browse all plugins.`
                    : 'No plugins available at the moment.'
                  }
                </p>
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('All');
                    }}
                    className="btn btn-primary"
                    aria-label="Clear search and filters"
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}

            {filteredPlugins.length > 9 && (
              <div className="text-center mt-8 sm:mt-12">
                <Link
                  href="/plugins"
                  className="btn btn-primary inline-flex items-center group"
                  aria-label={`View all ${filteredPlugins.length} plugins`}
                >
                  View all {filteredPlugins.length} plugins
                  <span className="ml-2 transform transition-transform group-hover:translate-x-1">→</span>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Ecosystem Statistics Section */}
        <section id="analytics-dashboard" className="py-12 sm:py-16 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <EcosystemStats
              title="Ecosystem Statistics"
              subtitle="Real-time insights into the growing Claude Code plugin ecosystem"
              showRefreshButton={true}
              showLastUpdated={true}
              autoRefresh={false}
              className="max-w-7xl mx-auto"
            />
          </div>
        </section>

        {/* Analytics Dashboard Preview */}
        <section className="py-12 sm:py-16 bg-gray-50 dark:bg-gray-800/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Analytics & Insights
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Track usage patterns and ecosystem trends
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Monitor Your Ecosystem
                </h3>
                <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                  <li className="flex items-start">
                    <BarChart className="w-5 h-5 text-primary-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span>Track plugin usage and popular searches</span>
                  </li>
                  <li className="flex items-start">
                    <TrendingUp className="w-5 h-5 text-primary-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span>Monitor ecosystem growth and trends</span>
                  </li>
                  <li className="flex items-start">
                    <Users className="w-5 h-5 text-primary-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span>Understand user behavior and preferences</span>
                  </li>
                  <li className="flex items-start">
                    <Package className="w-5 h-5 text-primary-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span>Discover top-performing plugins and marketplaces</span>
                  </li>
                </ul>

                <div className="mt-8">
                  <Link
                    href="/admin/analytics"
                    className="btn btn-primary group inline-flex items-center"
                  >
                    <BarChart className="w-5 h-5 mr-2" />
                    View Analytics Dashboard
                    <span className="ml-2 transform transition-transform group-hover:translate-x-1 inline-block">→</span>
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="card">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                      15.4K
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Total Events
                    </div>
                  </div>
                </div>
                <div className="card">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                      3.4K
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Active Users
                    </div>
                  </div>
                </div>
                <div className="card">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                      8.9K
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Page Views
                    </div>
                  </div>
                </div>
                <div className="card">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                      2.1K
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Searches
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-12 sm:py-16 lg:py-20 bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          </div>

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="animate-fade-in">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6">
                Join the Claude Code Community
              </h2>
              <p className="text-lg sm:text-xl text-primary-100 mb-8 sm:mb-12 max-w-2xl mx-auto">
                Share your plugins, discover new tools, and collaborate with developers worldwide.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
                <a
                  href="https://github.com/shrwnsan/claude-marketplace-registry"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn bg-white text-primary-600 hover:bg-gray-50 font-medium px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg group min-w-[200px] justify-center"
                  aria-label="Contribute on GitHub"
                >
                  <Github className="w-5 h-5 mr-2 transform transition-transform group-hover:scale-110" />
                  Contribute on GitHub
                </a>
                <Link
                  href="/docs/api"
                  className="btn border-2 border-white text-white hover:bg-white hover:text-primary-600 font-medium px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg group min-w-[200px] justify-center"
                >
                  View API Docs
                  <span className="ml-2 transform transition-transform group-hover:translate-x-1">→</span>
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