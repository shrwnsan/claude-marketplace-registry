/**
 * EcosystemStats - Dashboard orchestrator.
 *
 * All four sections read the same generated stats.json through the shared
 * useEcosystemStats hook, so there is a single fetch and a single refresh.
 */

import React from 'react';
import OverviewMetrics from './OverviewMetrics';
import GrowthTrends from './GrowthTrends';
import CategoryAnalytics from './CategoryAnalytics';
import QualityIndicators from './QualityIndicators';
import ErrorBoundary from '../ui/ErrorBoundary';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorDisplay from '../ui/ErrorDisplay';
import { useEcosystemStats } from '../../hooks/useEcosystemStats';
import { formatDateTimeWithOffset } from '../../utils/format';

export interface EcosystemStatsProps {
  className?: string;
  showOverview?: boolean;
  showGrowthTrends?: boolean;
  showCategories?: boolean;
  showQuality?: boolean;
  showHeaders?: boolean;
  title?: string;
  subtitle?: string;
  showRefreshButton?: boolean;
  showLastUpdated?: boolean;
}

export const EcosystemStats: React.FC<EcosystemStatsProps> = ({
  className = '',
  showOverview = true,
  showGrowthTrends = true,
  showCategories = true,
  showQuality = true,
  showHeaders = true,
  title = 'Ecosystem Statistics',
  subtitle = 'Live metrics from the daily marketplace scans',
  showRefreshButton = true,
  showLastUpdated = true,
}) => {
  const { data, metaTimestamp, loading, refresh } = useEcosystemStats();

  const sections = [
    { enabled: showOverview, title: 'Ecosystem Overview', body: <OverviewMetrics /> },
    { enabled: showGrowthTrends, title: 'Growth Trends', body: <GrowthTrends /> },
    { enabled: showCategories, title: 'Category Analytics', body: <CategoryAnalytics /> },
    { enabled: showQuality, title: 'Quality Indicators', body: <QualityIndicators /> },
  ].filter((s) => s.enabled);

  if (sections.length === 0) {
    return (
      <div className='text-center py-12'>
        <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-2'>
          No Sections Enabled
        </h3>
        <p className='text-gray-600 dark:text-gray-400'>
          Enable at least one section to display ecosystem statistics.
        </p>
      </div>
    );
  }

  return (
    <ErrorBoundary
      fallback={({ error, onReset }) => (
        <ErrorDisplay
          message={error?.message || 'Dashboard failed to load'}
          onRetry={onReset || refresh}
          className='max-w-4xl mx-auto'
        />
      )}
    >
      <div className={`space-y-12 ${className}`}>
        {showHeaders && (
          <header className='text-center mb-8 sm:mb-12'>
            <div className='flex items-center justify-between mb-4'>
              <div className='flex-1' />
              <div className='flex-1'>
                <h2 className='text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4'>
                  {title}
                </h2>
                <p className='text-gray-600 dark:text-gray-400 text-lg max-w-3xl mx-auto'>
                  {subtitle}
                </p>
              </div>
              <div className='flex-1 flex justify-end'>
                {showRefreshButton && (
                  <button
                    onClick={refresh}
                    disabled={loading}
                    className='inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200'
                    aria-label='Refresh all data'
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner size='sm' className='mr-2' />
                        Refreshing...
                      </>
                    ) : (
                      <>
                        <svg
                          className='w-4 h-4 mr-2'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                          />
                        </svg>
                        Refresh
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {showLastUpdated && metaTimestamp && (
              <div className='text-sm text-gray-500 dark:text-gray-400 mt-2'>
                Last updated: {formatDateTimeWithOffset(metaTimestamp)}
              </div>
            )}
          </header>
        )}

        <main className='space-y-12'>
          {sections.map((section) => (
            <section
              key={section.title}
              className='py-12 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800'
              aria-labelledby={`${section.title.toLowerCase().replace(/\s+/g, '-')}-heading`}
            >
              <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                {showHeaders && (
                  <header className='text-center mb-8'>
                    <h3
                      id={`${section.title.toLowerCase().replace(/\s+/g, '-')}-heading`}
                      className='text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2'
                    >
                      {section.title}
                    </h3>
                  </header>
                )}
                <ErrorBoundary
                  fallback={({ onReset }) => (
                    <ErrorDisplay
                      message={`${section.title} failed to load`}
                      onRetry={onReset || refresh}
                    />
                  )}
                >
                  {section.body}
                </ErrorBoundary>
              </div>
            </section>
          ))}
        </main>

        {showLastUpdated && data?.overview.lastUpdated && (
          <footer className='text-center mt-12 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-8'>
            <p>
              Source of truth: data/stats.json — regenerated by the daily marketplace scan (
              {formatDateTimeWithOffset(data.overview.lastUpdated)}).
            </p>
          </footer>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default EcosystemStats;
