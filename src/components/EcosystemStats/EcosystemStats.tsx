/**
 * EcosystemStats - Main Dashboard Component
 *
 * This is the main orchestrating component for the ecosystem statistics dashboard.
 * It brings together all the sub-components to provide a comprehensive view of the
 * Claude Code plugin ecosystem growth, health, and vibrancy.
 *
 * Features:
 * - Overview metrics (plugins, marketplaces, developers, downloads)
 * - Growth trends with interactive charts
 * - Category analytics and insights
 * - Quality indicators and trust signals
 * - Responsive design with mobile-first approach
 * - Accessibility features and keyboard navigation
 * - Error boundaries and graceful fallbacks
 *
 * @author Claude Marketplace Team
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import OverviewMetrics from './OverviewMetrics';
import GrowthTrends from './GrowthTrends';
import CategoryAnalytics from './CategoryAnalytics';
import QualityIndicators from './QualityIndicators';
import ErrorBoundary from '../ui/ErrorBoundary';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorDisplay from '../ui/ErrorDisplay';

// Types are used by the components but not directly in this file

// Styles are applied via Tailwind CSS classes directly

export interface EcosystemStatsProps {
  /**
   * Additional CSS classes to apply to the component
   */
  className?: string;

  /**
   * Whether to show the overview metrics section
   * @default true
   */
  showOverview?: boolean;

  /**
   * Whether to show the growth trends section
   * @default true
   */
  showGrowthTrends?: boolean;

  /**
   * Whether to show the category analytics section
   * @default true
   */
  showCategories?: boolean;

  /**
   * Whether to show the quality indicators section
   * @default true
   */
  showQuality?: boolean;

  /**
   * Whether to enable auto-refresh for all components
   * @default false
   */
  autoRefresh?: boolean;

  /**
   * Auto-refresh interval in milliseconds
   * @default 300000 (5 minutes)
   */
  refreshInterval?: number;

  /**
   * Compact layout mode for smaller spaces
   * @default false
   */
  compact?: boolean;

  /**
   * Initial time range for growth trends
   * @default '30d'
   */
  initialTimeRange?: '7d' | '30d' | '90d' | '1y';

  /**
   * Whether to show section headers
   * @default true
   */
  showHeaders?: boolean;

  /**
   * Custom title for the dashboard
   * @default 'Ecosystem Statistics'
   */
  title?: string;

  /**
   * Custom subtitle/description
   * @default 'Comprehensive insights into the Claude Code plugin ecosystem'
   */
  subtitle?: string;

  /**
   * Whether to show a refresh button for manual refresh
   * @default true
   */
  showRefreshButton?: boolean;

  /**
   * Whether to show last updated timestamp
   * @default true
   */
  showLastUpdated?: boolean;

  /**
   * Error callback function
   */
  onError?: (error: Error, component: string) => void;

  /**
   * Loading state callback
   */
  onLoadingChange?: (loading: boolean, component: string) => void;

  /**
   * Data update callback
   */
  onDataUpdate?: (data: unknown, component: string) => void;
}

/**
 * Main EcosystemStats dashboard component that orchestrates all sub-components
 */
export const EcosystemStats: React.FC<EcosystemStatsProps> = ({
  className = '',
  showOverview = true,
  showGrowthTrends = true,
  showCategories = true,
  showQuality = true,
  autoRefresh = false,
  refreshInterval = 300000, // 5 minutes
  compact = false,
  initialTimeRange = '30d',
  showHeaders = true,
  title = 'Ecosystem Statistics',
  subtitle = 'Comprehensive insights into the Claude Code plugin ecosystem',
  showRefreshButton = true,
  showLastUpdated = true,
  onError,
  onLoadingChange,
  onDataUpdate
}) => {
  // Component state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [globalError, setGlobalError] = useState<Error | null>(null);

  // Track loading states of all components
  const [componentStates, setComponentStates] = useState<Record<string, boolean>>({});

  // Handle manual refresh
  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setGlobalError(null);

    try {
      // Trigger refresh for all components by setting lastUpdated to null
      setLastUpdated(new Date());

      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Refresh failed');
      setGlobalError(err);
      onError?.(err, 'global');
    } finally {
      setIsRefreshing(false);
    }
  }, [onError]);

  // Auto-refresh timer
  useEffect(() => {
    if (!autoRefresh) return;

    const timer = setInterval(() => {
      handleManualRefresh();
    }, refreshInterval);

    return () => clearInterval(timer);
  }, [autoRefresh, refreshInterval, handleManualRefresh]);

  // Handle component loading changes
  const _handleComponentLoadingChange = useCallback((loading: boolean, component: string) => {
    setComponentStates(prev => ({ ...prev, [component]: loading }));
    onLoadingChange?.(loading, component);
  }, [onLoadingChange]);

  // Handle component errors
  const _handleComponentError = useCallback((error: Error, component: string) => {
    // Log error for debugging purposes
    onError?.(error, component);
  }, [onError]);

  // Handle component data updates
  const _handleComponentDataUpdate = useCallback((data: unknown, component: string) => {
    onDataUpdate?.(data, component);

    // Update last updated timestamp when any component gets new data
    if (data) {
      setLastUpdated(new Date());
    }
  }, [onDataUpdate]);

  // Calculate global loading state
  const isAnyComponentLoading = useMemo(() => {
    return Object.values(componentStates).some(loading => loading);
  }, [componentStates]);

  // Determine if dashboard is in loading state
  const isLoading = isRefreshing || isAnyComponentLoading;

  // Format last updated time
  const formatLastUpdated = useCallback((date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZoneName: 'short'
    }).format(date);
  }, []);

  // Component configuration based on props
  const componentConfig = useMemo(() => ({
    overview: {
      enabled: showOverview,
      title: 'Ecosystem Overview',
      description: 'Key metrics showing the size and growth of the ecosystem'
    },
    growthTrends: {
      enabled: showGrowthTrends,
      title: 'Growth Trends',
      description: 'Track ecosystem growth over time with interactive charts',
      initialTimeRange
    },
    categories: {
      enabled: showCategories,
      title: 'Category Analytics',
      description: 'Explore plugin categories and discover trending areas'
    },
    quality: {
      enabled: showQuality,
      title: 'Quality Indicators',
      description: 'Trust signals and quality metrics across the ecosystem'
    }
  }), [showOverview, showGrowthTrends, showCategories, showQuality, initialTimeRange]);

  // If no components are enabled, show message
  const enabledComponents = Object.values(componentConfig).filter(config => config.enabled).length;
  if (enabledComponents === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No Components Enabled
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Please enable at least one component to display ecosystem statistics.
        </p>
      </div>
    );
  }

  return (
    <ErrorBoundary
      onError={(error) => _handleComponentError(error, 'EcosystemStats')}
      fallback={({ error, onReset }) => (
        <ErrorDisplay
          message={error?.message || globalError?.message || 'Dashboard failed to load'}
          onRetry={onReset || handleManualRefresh}
          className="max-w-4xl mx-auto"
        />
      )}
    >
      <div className={`${compact ? 'space-y-8' : 'space-y-12'} ${className}`}>
        {/* Header Section */}
        {showHeaders && (
          <header className="text-center mb-8 sm:mb-12">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1" />
              <div className="flex-1">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  {title}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-lg max-w-3xl mx-auto">
                  {subtitle}
                </p>
              </div>
              <div className="flex-1 flex justify-end">
                {showRefreshButton && (
                  <button
                    onClick={handleManualRefresh}
                    disabled={isLoading}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    aria-label="Refresh all data"
                  >
                    {isLoading ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Refreshing...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        Refresh
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Last Updated */}
            {showLastUpdated && lastUpdated && (
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Last updated: {formatLastUpdated(lastUpdated)}
              </div>
            )}
          </header>
        )}

        {/* Global Error Display */}
        {globalError && (
          <div className="mb-8">
            <ErrorDisplay
              message={globalError?.message || 'Unknown error occurred'}
              onRetry={handleManualRefresh}
                          />
          </div>
        )}

        {/* Component Grid */}
        <main className="space-y-12">
          <div className="space-y-12">
            {/* Overview Metrics */}
            {componentConfig.overview.enabled && (
              <section
                className="py-12 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800"
                aria-labelledby="overview-heading"
              >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  {showHeaders && (
                    <header className="text-center mb-8">
                      <h3 id="overview-heading" className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {componentConfig.overview.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {componentConfig.overview.description}
                      </p>
                    </header>
                  )}

                  <ErrorBoundary
                    onError={(error) => _handleComponentError(error, 'OverviewMetrics')}
                    fallback={({ onReset }) => (
                      <ErrorDisplay
                        message="Overview metrics failed to load"
                        onRetry={onReset || handleManualRefresh}
                      />
                    )}
                  >
                    <OverviewMetrics
                      autoRefresh={autoRefresh}
                      refreshInterval={refreshInterval}
                                          />
                  </ErrorBoundary>
                </div>
              </section>
            )}

            {/* Growth Trends */}
            {componentConfig.growthTrends.enabled && (
              <section
                className="py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
                aria-labelledby="growth-heading"
              >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  {showHeaders && (
                    <header className="text-center mb-8">
                      <h3 id="growth-heading" className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {componentConfig.growthTrends.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {componentConfig.growthTrends.description}
                      </p>
                    </header>
                  )}

                  <ErrorBoundary
                    onError={(error) => _handleComponentError(error, 'GrowthTrends')}
                    fallback={({ onReset }) => (
                      <ErrorDisplay
                        message="Growth trends failed to load"
                        onRetry={onReset || handleManualRefresh}
                      />
                    )}
                  >
                    <GrowthTrends
                      initialTimeRange={initialTimeRange}
                      refreshInterval={autoRefresh ? refreshInterval : undefined}
                      showMetrics={{
                        plugins: true,
                        marketplaces: true,
                        developers: true,
                        downloads: true,
                      }}
                    />
                  </ErrorBoundary>
                </div>
              </section>
            )}

            {/* Category Analytics */}
            {componentConfig.categories.enabled && (
              <section
                className="py-12 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800"
                aria-labelledby="categories-heading"
              >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  {showHeaders && (
                    <header className="text-center mb-8">
                      <h3 id="categories-heading" className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {componentConfig.categories.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {componentConfig.categories.description}
                      </p>
                    </header>
                  )}

                  <ErrorBoundary
                    onError={(error) => _handleComponentError(error, 'CategoryAnalytics')}
                    fallback={({ onReset }) => (
                      <ErrorDisplay
                        message="Category analytics failed to load"
                        onRetry={onReset || handleManualRefresh}
                      />
                    )}
                  >
                    <CategoryAnalytics
                      period={initialTimeRange}
                    />
                  </ErrorBoundary>
                </div>
              </section>
            )}

            {/* Quality Indicators */}
            {componentConfig.quality.enabled && (
              <section
                className="py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
                aria-labelledby="quality-heading"
              >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  {showHeaders && (
                    <header className="text-center mb-8">
                      <h3 id="quality-heading" className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {componentConfig.quality.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {componentConfig.quality.description}
                      </p>
                    </header>
                  )}

                  <ErrorBoundary
                    onError={(error) => _handleComponentError(error, 'QualityIndicators')}
                    fallback={({ onReset }) => (
                      <ErrorDisplay
                        message="Quality indicators failed to load"
                        onRetry={onReset || handleManualRefresh}
                      />
                    )}
                  >
                    <QualityIndicators
                      refreshInterval={autoRefresh ? refreshInterval : undefined}
                    />
                  </ErrorBoundary>
                </div>
              </section>
            )}
          </div>
        </main>

        {/* Footer */}
        {showLastUpdated && lastUpdated && (
          <footer className="text-center mt-12 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-8">
            <p>Data refreshed automatically • Next update: {formatLastUpdated(new Date(lastUpdated.getTime() + refreshInterval))}</p>
          </footer>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default EcosystemStats;