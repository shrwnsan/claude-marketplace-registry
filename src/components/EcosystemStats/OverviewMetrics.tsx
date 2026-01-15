import React, { useState, useEffect } from 'react';
import {
  Package,
  Store,
  Users,
  Download,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
} from 'lucide-react';
import { EcosystemOverview, EcosystemStatsResponse } from '../../types/ecosystem-stats';
import { formatNumber } from '../../utils/format';
import ErrorDisplay from '../ui/ErrorDisplay';

// Interface for component props
interface OverviewMetricsProps {
  className?: string;
  refreshInterval?: number; // in milliseconds
  autoRefresh?: boolean;
}

// Interface for metric data structure
interface MetricData {
  label: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'primary' | 'success' | 'warning' | 'error' | 'purple';
  ariaLabel: string;
}

// Custom hook for fetching ecosystem overview data
const useEcosystemOverview = (autoRefresh: boolean = false, refreshInterval: number = 60000) => {
  const [data, setData] = useState<EcosystemOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/ecosystem-stats?overview', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-cache',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: EcosystemStatsResponse<EcosystemOverview> = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch ecosystem data');
      }

      if (result.data) {
        // Handle both direct overview data and nested structure
        const overviewData = (result.data as any).overview || result.data;
        setData(overviewData);
        setLastUpdated(overviewData.lastUpdated);
      }
    } catch (err) {
      console.error('Error fetching ecosystem overview:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  return { data, loading, error, lastUpdated, refetch: fetchData };
};

// Utility function to get change indicator component
const ChangeIndicator = ({ change }: { change: number }) => {
  const isPositive = change > 0;
  const isNeutral = Math.abs(change) < 0.1;

  if (isNeutral) {
    return (
      <div className='flex items-center text-gray-500'>
        <Activity className='w-4 h-4 mr-1' />
        <span className='text-sm'>0%</span>
      </div>
    );
  }

  const Icon = isPositive ? TrendingUp : TrendingDown;
  const colorClass = isPositive ? 'text-success-600' : 'text-error-600';
  const bgColorClass = isPositive
    ? 'bg-success-100 dark:bg-success-900/30'
    : 'bg-error-100 dark:bg-error-900/30';

  return (
    <div className={`flex items-center ${colorClass}`}>
      <div className={`p-1 rounded-md ${bgColorClass} mr-1`}>
        <Icon className='w-3 h-3' aria-hidden='true' />
      </div>
      <span className='text-sm font-medium'>
        {isPositive ? '+' : ''}
        {change.toFixed(1)}%
      </span>
    </div>
  );
};

// Metric Card Component
const MetricCard: React.FC<{
  metric: MetricData;
  isLoading?: boolean;
}> = ({ metric, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className='card p-6 animate-pulse'>
        <div className='flex items-center justify-between mb-4'>
          <div className='h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg'></div>
          <div className='h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded'></div>
        </div>
        <div className='space-y-2'>
          <div className='h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded'></div>
          <div className='h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded'></div>
        </div>
      </div>
    );
  }

  const { label, value, change, changeLabel, icon: Icon, color, ariaLabel } = metric;

  const colorClasses = {
    primary: {
      bg: 'bg-primary-100 dark:bg-primary-900/30',
      icon: 'text-primary-600 dark:text-primary-400',
      border: 'border-primary-200 dark:border-primary-700',
    },
    success: {
      bg: 'bg-success-100 dark:bg-success-900/30',
      icon: 'text-success-600 dark:text-success-400',
      border: 'border-success-200 dark:border-success-700',
    },
    warning: {
      bg: 'bg-warning-100 dark:bg-warning-900/30',
      icon: 'text-warning-600 dark:text-warning-400',
      border: 'border-warning-200 dark:border-warning-700',
    },
    error: {
      bg: 'bg-error-100 dark:bg-error-900/30',
      icon: 'text-error-600 dark:text-error-400',
      border: 'border-error-200 dark:border-error-700',
    },
    purple: {
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      icon: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-200 dark:border-purple-700',
    },
  };

  const currentColor = colorClasses[color];

  return (
    <article
      className='card p-6 group cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2'
      role='region'
      aria-label={ariaLabel}
      tabIndex={0}
    >
      <div className='flex items-center justify-between mb-4'>
        <div
          className={`p-3 rounded-lg ${currentColor.bg} group-hover:scale-110 transition-transform duration-300`}
        >
          <Icon className={`w-6 h-6 ${currentColor.icon}`} aria-hidden='true' />
        </div>
        <div className='flex flex-col items-end'>
          <ChangeIndicator change={change} />
          <span className='text-xs text-gray-500 dark:text-gray-400 mt-1'>{changeLabel}</span>
        </div>
      </div>

      <div className='space-y-1'>
        <h3 className='text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums'>
          {value}
        </h3>
        <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>{label}</p>
      </div>

      {/* Decorative element */}
      <div
        className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${currentColor.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-bl-2xl border-l border-b ${currentColor.border}`}
      ></div>
    </article>
  );
};

// Main OverviewMetrics Component
const OverviewMetrics: React.FC<OverviewMetricsProps> = ({
  className = '',
  refreshInterval = 60000, // 1 minute default
  autoRefresh = false,
}) => {
  const { data, loading, error, lastUpdated, refetch } = useEcosystemOverview(
    autoRefresh,
    refreshInterval
  );

  // Transform data into metric format
  const getMetrics = (): MetricData[] => {
    if (!data) return [];

    const growthRate = data.growthRate || {
      plugins: 0,
      marketplaces: 0,
      developers: 0,
      downloads: 0,
    };

    return [
      {
        label: 'Total Plugins',
        value: formatNumber(data.totalPlugins),
        change: growthRate.plugins || 0,
        changeLabel: 'vs last week',
        icon: Package,
        color: 'primary',
        ariaLabel: `Total plugins in ecosystem: ${(data.totalPlugins || 0).toLocaleString()}, ${growthRate.plugins > 0 ? 'growing' : 'stable'} by ${Math.abs(growthRate.plugins || 0)}% vs last week`,
      },
      {
        label: 'Marketplaces',
        value: formatNumber(data.totalMarketplaces),
        change: growthRate.marketplaces || 0,
        changeLabel: 'vs last week',
        icon: Store,
        color: 'success',
        ariaLabel: `Total marketplaces: ${(data.totalMarketplaces || 0).toLocaleString()}, launched regularly updated`,
      },
      {
        label: 'Developers',
        value: formatNumber(data.totalDevelopers),
        change: growthRate.developers || 0,
        changeLabel: 'vs last week',
        icon: Users,
        color: 'warning',
        ariaLabel: `Total developers: ${(data.totalDevelopers || 0).toLocaleString()}, contributing since regularly updated`,
      },
      {
        label: 'Total Downloads',
        value: formatNumber(data.totalDownloads),
        change: growthRate.downloads || 0,
        changeLabel: 'vs last week',
        icon: Download,
        color: 'error',
        ariaLabel: `Total downloads: ${(data.totalDownloads || 0).toLocaleString()}, accumulated since regularly updated`,
      },
    ];
  };

  const metrics = getMetrics();

  // Loading state
  if (loading && !data) {
    return (
      <section className={className} aria-label='Ecosystem Overview Metrics'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6'>
          {[...Array(4)].map((_, index) => (
            <MetricCard
              key={`skeleton-${index}`}
              metric={metrics[index] || ({} as MetricData)}
              isLoading={true}
            />
          ))}
        </div>
      </section>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <section className={className} aria-label='Ecosystem Overview Metrics'>
        <ErrorDisplay
          type='error'
          title='Failed to Load Ecosystem Metrics'
          message={error}
          onRetry={refetch}
          className='w-full'
        />
      </section>
    );
  }

  return (
    <section className={`space-y-4 ${className}`} aria-label='Ecosystem Overview Metrics'>
      {/* Header */}
      <header className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100'>
            Ecosystem Overview
          </h2>
          <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
            Key metrics and growth indicators for the Claude Code plugin ecosystem
          </p>
        </div>

        <div className='flex items-center gap-4'>
          {/* Last updated info */}
          {lastUpdated && (
            <div className='flex items-center text-sm text-gray-500 dark:text-gray-400'>
              <Calendar className='w-4 h-4 mr-1' />
              <span>Updated {new Date(lastUpdated).toLocaleString()}</span>
            </div>
          )}

          {/* Refresh button */}
          <button
            onClick={refetch}
            disabled={loading}
            className='btn-ghost p-2 disabled:opacity-50'
            aria-label='Refresh metrics'
            title='Refresh metrics'
          >
            <Activity className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Metrics Grid */}
      <main>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6'>
          {metrics.map((metric, index) => (
            <MetricCard key={`${metric.label}-${index}`} metric={metric} isLoading={loading} />
          ))}
        </div>
      </main>

      {/* Health score (if available) */}
      {data?.healthScore && (
        <footer className='mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center'>
              <Activity className='w-5 h-5 text-primary-600 dark:text-primary-400 mr-2' />
              <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                Ecosystem Health Score
              </span>
            </div>
            <div className='flex items-center'>
              <div className='w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-3'>
                <div
                  className='bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500'
                  style={{ width: `${data.healthScore}%` }}
                  role='progressbar'
                  aria-valuenow={data.healthScore}
                  aria-valuemin={0}
                  aria-valuemax={100}
                ></div>
              </div>
              <span className='text-sm font-bold text-primary-600 dark:text-primary-400'>
                {data.healthScore}/100
              </span>
            </div>
          </div>
        </footer>
      )}
    </section>
  );
};

export default OverviewMetrics;
