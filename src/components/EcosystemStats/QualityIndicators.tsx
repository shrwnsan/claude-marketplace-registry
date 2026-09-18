import React from 'react';
import { Activity, Calendar, ShieldCheck, RefreshCw, Clock, Star, FileCheck } from 'lucide-react';
import { formatDateTimeWithOffset, formatNumber } from '../../utils/format';
import { useEcosystemStats } from '../../hooks/useEcosystemStats';
import ErrorDisplay from '../ui/ErrorDisplay';
import MiniSparkline from '../ui/MiniSparkline';

interface QualityIndicatorsProps {
  className?: string;
}

interface IndicatorCard {
  label: string;
  value: string;
  hint: string;
  progress: number | null; // null = no meaningful percentage
  icon: React.ComponentType<{ className?: string }>;
  trendPoints?: number[];
}

/** Fills to its true level on mount so partial values read as graded, not all-or-nothing. */
const AnimatedBar: React.FC<{ value: number; label: string }> = ({ value, label }) => {
  const [width, setWidth] = React.useState(0);
  React.useEffect(() => {
    const t = setTimeout(() => setWidth(Math.min(100, Math.max(0, value))), 80);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3'>
      <div
        className='bg-gradient-to-r from-primary-500 to-primary-400 h-2 rounded-full transition-all duration-700 ease-out'
        style={{ width: `${width}%` }}
        role='progressbar'
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label} level`}
      />
    </div>
  );
};

const QualityIndicators: React.FC<QualityIndicatorsProps> = ({ className = '' }) => {
  const { data, metaTimestamp, loading, error, refresh } = useEcosystemStats();

  // Real derived history: average stars per marketplace for every recorded day.
  const avgStarsTrend = React.useMemo(() => {
    const stars = data?.stars || [];
    const markets = data?.marketplaces || [];
    const starsByDate = new Map(stars.map((p) => [p.date, p.value]));
    const out: number[] = [];
    markets.forEach((m) => {
      const s = starsByDate.get(m.date);
      if (s !== null && s !== undefined && m.value && m.value > 0) {
        out.push(Math.round(s / m.value));
      }
    });
    return out;
  }, [data]);

  if (loading && !data) {
    return (
      <section className={className} aria-label='Quality Indicators'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {[...Array(4)].map((_, i) => (
            <div key={i} className='card p-6 animate-pulse'>
              <div className='h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-3' />
              <div className='h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded' />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error && !data) {
    return (
      <section className={className} aria-label='Quality Indicators'>
        <ErrorDisplay
          type='error'
          title='Failed to Load Quality Indicators'
          message={error}
          onRetry={refresh}
          className='w-full'
        />
      </section>
    );
  }

  const cards: IndicatorCard[] = data
    ? [
        {
          label: 'Manifest Coverage',
          value: `${data.manifestCoverage.rate}%`,
          hint: `${data.manifestCoverage.withManifest} of ${data.manifestCoverage.total} marketplaces ship a valid marketplace.json`,
          progress: data.manifestCoverage.rate,
          icon: FileCheck,
        },
        {
          label: 'Recently Updated',
          value: `${data.maintenance.recentlyUpdatedRate}%`,
          hint: `${data.maintenance.recentlyUpdated} marketplaces updated in the last 30 days`,
          progress: data.maintenance.recentlyUpdatedRate,
          icon: RefreshCw,
        },
        {
          label: 'Stale Marketplaces',
          value: formatNumber(data.maintenance.staleOver180Days),
          hint: 'No update in the last 180 days',
          progress: null,
          icon: Clock,
        },
        {
          label: 'Avg Stars / Marketplace',
          value: formatNumber(data.avgStarsPerMarketplace),
          hint: `${formatNumber(data.overview.totalStars)} stars across ${data.overview.totalMarketplaces} marketplaces`,
          progress: null,
          icon: Star,
          trendPoints: avgStarsTrend.length >= 2 ? avgStarsTrend : undefined,
        },
      ]
    : [];

  return (
    <section className={`space-y-4 ${className}`} aria-label='Quality Indicators'>
      <header className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <p className='eyebrow eyebrow-prompt mb-1'>check --quality</p>
          <p className='text-sm text-gray-600 dark:text-gray-400'>
            Trust signals computed directly from the scan data
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
            aria-label='Refresh quality indicators'
            title='Refresh quality indicators'
          >
            <Activity className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {cards.map((card) => (
          <article key={card.label} className='card p-6' role='region' aria-label={card.label}>
            <div className='flex items-center justify-between mb-3'>
              <div className='flex items-center'>
                <card.icon className='w-5 h-5 text-primary-500 dark:text-primary-400 mr-2' />
                <h3 className='text-sm font-semibold text-gray-700 dark:text-gray-200'>
                  {card.label}
                </h3>
              </div>
              <span className='text-2xl font-bold font-mono text-gray-900 dark:text-gray-50 tabular-nums'>
                {card.value}
              </span>
            </div>
            {card.progress !== null && <AnimatedBar value={card.progress} label={card.label} />}
            <p className='text-sm text-gray-500 dark:text-gray-400'>{card.hint}</p>
            <MiniSparkline label={card.label} points={card.trendPoints} />
          </article>
        ))}
      </div>

      {data && (
        <footer className='p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 flex items-start'>
          <ShieldCheck className='w-5 h-5 text-success-600 dark:text-success-400 mr-2 mt-0.5 flex-shrink-0' />
          <p className='text-sm text-gray-600 dark:text-gray-300'>
            Every plugin in the catalog comes from a scanned{' '}
            <code>.claude-plugin/marketplace.json</code> manifest. Quality signals are computed from
            repository metadata — no plugin scoring is invented.
          </p>
        </footer>
      )}
    </section>
  );
};

export default QualityIndicators;
