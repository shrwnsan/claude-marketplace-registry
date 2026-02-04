import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import { useAnalytics } from '@/utils/analytics/hooks';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  Users,
  Eye,
  Search,
  Star,
  Clock,
  Package,
  ArrowLeft,
  Download as DownloadIcon,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { mockPlugins, mockMarketplaces } from '@/data/mock-data';

const AnalyticsDashboard: React.FC = () => {
  const {
    getAnalyticsData,
    getTopPlugins,
    getTopMarketplaces,
    getPopularSearches,
    getPageViewStats,
    getEventCounts,
    getSessionStats,
    clearData,
    exportData,
    importData,
  } = useAnalytics();

  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Calculate time ranges in milliseconds
  const timeRanges = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    all: undefined,
  };

  const analyticsData = useMemo(() => getAnalyticsData(), [getAnalyticsData]);
  const topPlugins = useMemo(() => getTopPlugins(10), [getTopPlugins]);
  const topMarketplaces = useMemo(() => getTopMarketplaces(10), [getTopMarketplaces]);
  const popularSearches = useMemo(() => getPopularSearches(10), [getPopularSearches]);
  const pageViewStats = useMemo(
    () => getPageViewStats(timeRanges[timeRange]),
    [getPageViewStats, timeRange]
  );
  const eventCounts = useMemo(
    () => getEventCounts(timeRanges[timeRange]),
    [getEventCounts, timeRange]
  );
  const sessionStats = useMemo(() => getSessionStats(), [getSessionStats]);

  // Format time range label
  const formatTimeRange = (range: string): string => {
    switch (range) {
      case '24h':
        return 'Last 24 hours';
      case '7d':
        return 'Last 7 days';
      case '30d':
        return 'Last 30 days';
      case 'all':
        return 'All time';
      default:
        return range;
    }
  };

  // Format duration
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Format percentage
  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  // Prepare chart data
  const pageViewsChartData = useMemo(() => {
    return Object.entries(pageViewStats)
      .map(([path, views]) => ({
        name: path === '/' ? 'Home' : path.split('/').pop() || path,
        views,
      }))
      .slice(0, 8);
  }, [pageViewStats]);

  const eventsChartData = useMemo(() => {
    return Object.entries(eventCounts).map(([event, count]) => ({
      name: event.replace('_', ' ').charAt(0).toUpperCase() + event.slice(1),
      count,
    }));
  }, [eventCounts]);

  const pluginsChartData = useMemo(() => {
    return topPlugins.slice(0, 8).map(({ id, clicks }) => {
      const plugin = mockPlugins.find((p) => p.id === id);
      return {
        name: plugin?.name || id,
        clicks,
      };
    });
  }, [topPlugins]);

  const _marketplacesChartData = useMemo(() => {
    return topMarketplaces.slice(0, 8).map(({ id, clicks }) => {
      const marketplace = mockMarketplaces.find((m) => m.id === id);
      return {
        name: marketplace?.name || id,
        clicks,
      };
    });
  }, [topMarketplaces]);

  const searchesChartData = useMemo(() => {
    return popularSearches.slice(0, 8).map(({ query, count }) => ({
      name: query.length > 20 ? query.substring(0, 20) + '...' : query,
      count,
    }));
  }, [popularSearches]);

  // Colors for charts
  const COLORS = [
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
    '#84cc16',
  ];

  // Export data
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `claude-marketplace-analytics-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Import data
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = e.target?.result as string;
          importData(jsonData);
          alert('Analytics data imported successfully!');
        } catch {
          alert('Error importing data. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  // Clear data
  const handleClearData = () => {
    clearData();
    setShowClearConfirm(false);
    alert('Analytics data cleared successfully!');
  };

  return (
    <>
      <Head>
        <title>Analytics Dashboard - Claude Marketplace Aggregator</title>
        <meta name='description' content='Analytics dashboard for Claude Marketplace Aggregator' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <MainLayout>
        {/* Header */}
        <section className='bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
            <div className='flex items-center justify-between mb-6'>
              <div className='flex items-center space-x-4'>
                <Link href='/' className='btn-ghost p-2'>
                  <ArrowLeft className='w-5 h-5' />
                </Link>
                <div>
                  <h1 className='text-3xl font-bold text-gray-900 dark:text-gray-100'>
                    Analytics Dashboard
                  </h1>
                  <p className='text-gray-600 dark:text-gray-400'>
                    Monitor usage patterns and ecosystem insights
                  </p>
                </div>
              </div>

              <div className='flex items-center space-x-3'>
                {/* Time Range Selector */}
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as any)}
                  className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                >
                  <option value='24h'>Last 24 hours</option>
                  <option value='7d'>Last 7 days</option>
                  <option value='30d'>Last 30 days</option>
                  <option value='all'>All time</option>
                </select>

                {/* Export Button */}
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className='btn-ghost p-2'
                  title='Export analytics data'
                >
                  {isExporting ? (
                    <RefreshCw className='w-5 h-5 animate-spin' />
                  ) : (
                    <DownloadIcon className='w-5 h-5' />
                  )}
                </button>

                {/* Import Button */}
                <label className='btn-ghost p-2 cursor-pointer' title='Import analytics data'>
                  <input type='file' accept='.json' onChange={handleImport} className='hidden' />
                  <Package className='w-5 h-5' />
                </label>

                {/* Clear Data Button */}
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className='btn-ghost p-2 text-red-600 hover:text-red-700'
                  title='Clear all analytics data'
                >
                  <Trash2 className='w-5 h-5' />
                </button>
              </div>
            </div>

            <div className='text-sm text-gray-600 dark:text-gray-400'>
              Showing data for {formatTimeRange(timeRange)}
            </div>
          </div>
        </section>

        {/* Overview Cards */}
        <section className='py-12 bg-gray-50 dark:bg-gray-800/50'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
              {/* Total Events */}
              <div className='card'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm text-gray-600 dark:text-gray-400'>Total Events</p>
                    <p className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
                      {Object.values(eventCounts).reduce((sum, count) => sum + count, 0)}
                    </p>
                  </div>
                  <div className='p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg'>
                    <TrendingUp className='w-6 h-6 text-blue-600 dark:text-blue-400' />
                  </div>
                </div>
              </div>

              {/* Sessions */}
              <div className='card'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm text-gray-600 dark:text-gray-400'>Sessions</p>
                    <p className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
                      {sessionStats.totalSessions}
                    </p>
                  </div>
                  <div className='p-3 bg-green-100 dark:bg-green-900/30 rounded-lg'>
                    <Users className='w-6 h-6 text-green-600 dark:text-green-400' />
                  </div>
                </div>
              </div>

              {/* Page Views */}
              <div className='card'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm text-gray-600 dark:text-gray-400'>Page Views</p>
                    <p className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
                      {Object.values(pageViewStats).reduce((sum, views) => sum + views, 0)}
                    </p>
                  </div>
                  <div className='p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg'>
                    <Eye className='w-6 h-6 text-purple-600 dark:text-purple-400' />
                  </div>
                </div>
              </div>

              {/* Avg Session Duration */}
              <div className='card'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm text-gray-600 dark:text-gray-400'>Avg Duration</p>
                    <p className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
                      {formatDuration(sessionStats.avgSessionDuration)}
                    </p>
                  </div>
                  <div className='p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg'>
                    <Clock className='w-6 h-6 text-orange-600 dark:text-orange-400' />
                  </div>
                </div>
              </div>
            </div>

            {/* Bounce Rate and Other Metrics */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mt-6'>
              <div className='card'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm text-gray-600 dark:text-gray-400'>Bounce Rate</p>
                    <p className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
                      {formatPercentage(sessionStats.bounceRate)}
                    </p>
                  </div>
                  <div className='p-3 bg-red-100 dark:bg-red-900/30 rounded-lg'>
                    <TrendingUp className='w-6 h-6 text-red-600 dark:text-red-400' />
                  </div>
                </div>
              </div>

              <div className='card'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm text-gray-600 dark:text-gray-400'>Total Searches</p>
                    <p className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
                      {analyticsData.searches.length}
                    </p>
                  </div>
                  <div className='p-3 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg'>
                    <Search className='w-6 h-6 text-cyan-600 dark:text-cyan-400' />
                  </div>
                </div>
              </div>

              <div className='card'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm text-gray-600 dark:text-gray-400'>Total Ratings</p>
                    <p className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
                      {Object.keys(analyticsData.ratings).length}
                    </p>
                  </div>
                  <div className='p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg'>
                    <Star className='w-6 h-6 text-yellow-600 dark:text-yellow-400' />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Charts Section */}
        <section className='py-12 bg-white dark:bg-gray-900'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
              {/* Page Views Chart */}
              <div className='card'>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6'>
                  Page Views
                </h3>
                <ResponsiveContainer width='100%' height={300}>
                  <BarChart data={pageViewsChartData}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='name' />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey='views' fill={COLORS[0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Events Chart */}
              <div className='card'>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6'>
                  Event Types
                </h3>
                <ResponsiveContainer width='100%' height={300}>
                  <PieChart>
                    <Pie
                      data={eventsChartData}
                      cx='50%'
                      cy='50%'
                      labelLine={false}
                      label={({ name, percent }: any) =>
                        `${name} ${((percent as number) * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill='#8884d8'
                      dataKey='count'
                    >
                      {eventsChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Top Plugins Chart */}
              <div className='card'>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6'>
                  Top Plugins
                </h3>
                <ResponsiveContainer width='100%' height={300}>
                  <BarChart data={pluginsChartData} layout='horizontal'>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis type='number' />
                    <YAxis dataKey='name' type='category' width={100} />
                    <Tooltip />
                    <Bar dataKey='clicks' fill={COLORS[1]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Popular Searches Chart */}
              <div className='card'>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6'>
                  Popular Searches
                </h3>
                <ResponsiveContainer width='100%' height={300}>
                  <BarChart data={searchesChartData}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='name' />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey='count' fill={COLORS[2]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Tables */}
        <section className='py-12 bg-gray-50 dark:bg-gray-800/50'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
              {/* Top Plugins Table */}
              <div className='card'>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6'>
                  Top Plugins
                </h3>
                <div className='overflow-x-auto'>
                  <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
                    <thead>
                      <tr>
                        <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                          Plugin
                        </th>
                        <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                          Clicks
                        </th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-200 dark:divide-gray-700'>
                      {topPlugins.slice(0, 10).map(({ id, clicks }) => {
                        const plugin = mockPlugins.find((p) => p.id === id);
                        return (
                          <tr key={id}>
                            <td className='px-4 py-3 text-sm text-gray-900 dark:text-gray-100'>
                              {plugin?.name || id}
                            </td>
                            <td className='px-4 py-3 text-sm text-gray-900 dark:text-gray-100'>
                              {clicks}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top Marketplaces Table */}
              <div className='card'>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6'>
                  Top Marketplaces
                </h3>
                <div className='overflow-x-auto'>
                  <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
                    <thead>
                      <tr>
                        <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                          Marketplace
                        </th>
                        <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                          Clicks
                        </th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-200 dark:divide-gray-700'>
                      {topMarketplaces.slice(0, 10).map(({ id, clicks }) => {
                        const marketplace = mockMarketplaces.find((m) => m.id === id);
                        return (
                          <tr key={id}>
                            <td className='px-4 py-3 text-sm text-gray-900 dark:text-gray-100'>
                              {marketplace?.name || id}
                            </td>
                            <td className='px-4 py-3 text-sm text-gray-900 dark:text-gray-100'>
                              {clicks}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Search Terms Table */}
            <div className='mt-8 card'>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6'>
                Popular Search Terms
              </h3>
              <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
                  <thead>
                    <tr>
                      <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                        Search Term
                      </th>
                      <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                        Count
                      </th>
                      <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                        Last Searched
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-200 dark:divide-gray-700'>
                    {popularSearches.slice(0, 10).map(({ query, count }, index) => {
                      const lastSearch = analyticsData.searches
                        .filter((s) => s.query === query)
                        .sort((a, b) => b.timestamp - a.timestamp)[0];

                      return (
                        <tr key={index}>
                          <td className='px-4 py-3 text-sm text-gray-900 dark:text-gray-100'>
                            {query}
                          </td>
                          <td className='px-4 py-3 text-sm text-gray-900 dark:text-gray-100'>
                            {count}
                          </td>
                          <td className='px-4 py-3 text-sm text-gray-500 dark:text-gray-400'>
                            {lastSearch ? new Date(lastSearch.timestamp).toLocaleString() : 'N/A'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Raw Data Section */}
        <section className='py-12 bg-white dark:bg-gray-900'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='card'>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6'>
                Raw Analytics Data
              </h3>
              <div className='bg-gray-50 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto'>
                <pre className='text-xs text-gray-600 dark:text-gray-400 font-mono'>
                  {JSON.stringify(
                    {
                      totalEvents: analyticsData.events.length,
                      eventCounts,
                      pageViews: Object.keys(pageViewStats).length,
                      topPlugins: topPlugins.slice(0, 5),
                      topMarketplaces: topMarketplaces.slice(0, 5),
                      popularSearches: popularSearches.slice(0, 5),
                      sessionStats,
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* Clear Data Confirmation Modal */}
        {showClearConfirm && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
            <div className='bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6'>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4'>
                Clear Analytics Data?
              </h3>
              <p className='text-gray-600 dark:text-gray-300 mb-6'>
                This will permanently delete all analytics data. This action cannot be undone.
              </p>
              <div className='flex justify-end space-x-3'>
                <button onClick={() => setShowClearConfirm(false)} className='btn-ghost'>
                  Cancel
                </button>
                <button
                  onClick={handleClearData}
                  className='btn bg-red-600 hover:bg-red-700 text-white'
                >
                  Clear Data
                </button>
              </div>
            </div>
          </div>
        )}
      </MainLayout>
    </>
  );
};

export default AnalyticsDashboard;
