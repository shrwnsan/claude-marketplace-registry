import React from 'react';
import {
  Package,
  Store,
  Users,
  Star,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
} from 'lucide-react';
import { formatDateTimeWithOffset, formatNumber } from '../../utils/format';
import { useEcosystemStats } from '../../hooks/useEcosystemStats';
import ErrorDisplay from '../ui/ErrorDisplay';

interface OverviewMetricsProps {
  className?: string;
}

interface MetricData {
  label: string;
  value: string;
  change: number | null;
  icon: React.ComponentType<{ className?: string }>;
  color: 'primary' | 'success' | 'warning' | 'purple';
  ariaLabel: string;
}

const ChangeIndicator = ({ change }: { change: number | null }) => {
  if (change === null) {
    return (
      <div className='flex items-center text-gray-400 dark:text-gray-500'>
        <span className='text-sm'>—</span>
      </div>
    );
  }
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

const MetricCard: React.FC<{ metric: MetricData; isLoading?: boolean }> = ({
  metric,
  isLoading = false,
}) => {
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

  const { label, value, change, icon: Icon, color, ariaLabel } = metric;

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
    purple: {
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      icon: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-200 dark:border-purple-700',
    },
  };

  const currentColor = colorClasses[color];
  const changeHint = change === null ? 'baseline pending' : 'vs last 30 days';

  return (
    <article
      className='card p-6 group transition-all duration-200 focus-within:ring-2 focus-within:ring-primary-500'
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
          <span className='text-xs text-gray-500 dark:text-gray-400 mt-1'>{changeHint}</span>
        </div>
      </div>

      <div className='space-y-1'>
        <h3 className='text-2xl font-bold font-mono tracking-tight text-gray-900 dark:text-gray-50 tabular-nums'>
          {value}
        </h3>
        <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>{label}</p>
      </div>
    </article>
  );
};

const OverviewMetrics: React.FC<OverviewMetricsProps> = ({ className = '' }) => {
  const { data, metaTimestamp, loading, error, refresh } = useEcosystemStats();

  const metrics: MetricData[] = [];
  if (data) {
    const g = data.overview.growthRate;
    metrics.push(
      {
        label: 'Total Plugins',
        value: formatNumber(data.overview.totalPlugins),
        change: g.plugins,
        icon: Package,
        color: 'primary',
        ariaLabel: `Total plugins in ecosystem: ${data.overview.totalPlugins.toLocaleString()}`,
      },
      {
        label: 'Marketplaces',
        value: formatNumber(data.overview.totalMarketplaces),
        change: g.marketplaces,
        icon: Store,
        color: 'success',
        ariaLabel: `Total marketplaces: ${data.overview.totalMarketplaces.toLocaleString()}`,
      },
      {
        label: 'Developers',
        value: formatNumber(data.overview.totalDevelopers),
        change: g.developers,
        icon: Users,
        color: 'warning',
        ariaLabel: `Total plugin authors: ${data.overview.totalDevelopers.toLocaleString()}`,
      },
      {
        label: 'GitHub Stars',
        value: formatNumber(data.overview.totalStars),
        change: g.stars,
        icon: Star,
        color: 'purple',
        ariaLabel: `Total GitHub stars across marketplaces: ${data.overview.totalStars.toLocaleString()}`,
      }
    );
  }

  if (loading && !data) {
    return (
      <section className={className} aria-label='Ecosystem Overview Metrics'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6'>
          {[...Array(4)].map((_, index) => (
            <MetricCard key={`skeleton-${index}`} metric={{} as MetricData} isLoading={true} />
          ))}
        </div>
      </section>
    );
  }

  if (error && !data) {
    return (
      <section className={className} aria-label='Ecosystem Overview Metrics'>
        <ErrorDisplay
          type='error'
          title='Failed to Load Ecosystem Metrics'
          message={error}
          onRetry={refresh}
          className='w-full'
        />
      </section>
    );
  }

  return (
    <section className={`space-y-4 ${className}`} aria-label='Ecosystem Overview Metrics'>
      <header className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100'>
            Ecosystem Overview
          </h2>
          <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
            Live counts from the daily marketplace scans
          </p>
        </div>

        <div className='flex items-center gap-4'>
          {metaTimestamp && (
            <div className='flex items-center text-sm text-gray-500 dark:text-gray-400'>
              <Calendar className='w-4 h-4 mr-1' />
              <span>Updated {formatDateTimeWithOffset(metaTimestamp)}</span>
            </div>
          )}
          <button
            onClick={refresh}
            disabled={loading}
            className='btn-ghost p-2 disabled:opacity-50'
            aria-label='Refresh metrics'
            title='Refresh metrics'
          >
            <Activity className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <main>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6'>
          {metrics.map((metric) => (
            <MetricCard key={metric.label} metric={metric} isLoading={loading} />
          ))}
        </div>
      </main>

      {/* Manifest coverage — replaces the old hardcoded "health score" */}
      {data && (
        <footer className='mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center'>
              <Package className='w-5 h-5 text-primary-600 dark:text-primary-400 mr-2' />
              <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                Manifest coverage — {data.manifestCoverage.withManifest} of{' '}
                {data.manifestCoverage.total} marketplaces
              </span>
            </div>
            <div className='flex items-center'>
              <div className='w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-3'>
                <div
                  className='bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500'
                  style={{ width: `${data.manifestCoverage.rate}%` }}
                  role='progressbar'
                  aria-valuenow={data.manifestCoverage.rate}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label='Marketplace manifest coverage'
                ></div>
              </div>
              <span className='text-sm font-bold text-primary-600 dark:text-primary-400'>
                {data.manifestCoverage.rate}%
              </span>
            </div>
          </div>
        </footer>
      )}
    </section>
  );
};

export default OverviewMetrics;
