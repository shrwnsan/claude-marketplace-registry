import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatNumber } from '../../utils/format';
import { useEcosystemStats, TrendPoint } from '../../hooks/useEcosystemStats';
import ErrorDisplay from '../ui/ErrorDisplay';

interface GrowthTrendsProps {
  className?: string;
}

interface SeriesConfig {
  key: 'plugins' | 'marketplaces' | 'developers' | 'stars';
  label: string;
  color: string;
}

const SERIES: SeriesConfig[] = [
  { key: 'plugins', label: 'Plugins', color: '#3b82f6' },
  { key: 'marketplaces', label: 'Marketplaces', color: '#10b981' },
  { key: 'developers', label: 'Developers', color: '#f59e0b' },
  { key: 'stars', label: 'Stars', color: '#8b5cf6' },
];

interface ChartRow extends Record<string, string | number> {
  date: string;
}

const buildChartRows = (series: Record<string, TrendPoint[]>): ChartRow[] => {
  const byDate = new Map<string, ChartRow>();
  for (const { key } of SERIES) {
    for (const point of series[key] || []) {
      if (point.value === null) continue;
      const row = byDate.get(point.date) || { date: point.date };
      row[key] = point.value;
      byDate.set(point.date, row);
    }
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
};

const GrowthTrends: React.FC<GrowthTrendsProps> = ({ className = '' }) => {
  const { data, loading, error, refresh } = useEcosystemStats();

  // One honest series per metric, straight from accumulated daily snapshots.
  const chartRows = React.useMemo(
    () =>
      data
        ? buildChartRows({
            plugins: data.plugins || [],
            marketplaces: data.marketplaces || [],
            developers: data.developers || [],
            stars: data.stars || [],
          })
        : [],
    [data]
  );

  if (loading && !data) {
    return (
      <div
        className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 ${className}`}
      >
        <div className='h-96 animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg' />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div
        className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 ${className}`}
      >
        <ErrorDisplay
          type='error'
          title='Failed to Load Growth Data'
          message={error}
          onRetry={refresh}
          showIcon
        />
      </div>
    );
  }

  const enoughHistory = chartRows.length >= 2;

  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden ${className}`}
      role='region'
      aria-labelledby='growth-trends-title'
    >
      <div className='p-6 border-b border-gray-200 dark:border-gray-800'>
        <h2
          id='growth-trends-title'
          className='text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2'
        >
          Ecosystem Growth Trends
        </h2>
        <p className='text-gray-600 dark:text-gray-400'>
          Snapshots recorded by each daily scan — one point per day
        </p>
      </div>

      {!enoughHistory ? (
        <div className='p-10 text-center'>
          <p className='text-gray-600 dark:text-gray-300 font-medium mb-2'>
            Growth history is collecting
          </p>
          <p className='text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto'>
            Each daily scan records a snapshot.{' '}
            {chartRows.length === 1
              ? `The first snapshot was recorded on ${chartRows[0].date} — a trend line will appear after a few more days.`
              : 'A trend line will appear after a few daily scans.'}
          </p>
        </div>
      ) : (
        <>
          {/* Latest snapshot deltas */}
          <div className='p-6 border-b border-gray-200 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
            {SERIES.map(({ key, label, color }) => {
              const points = data?.[key] || [];
              const latest = [...points].reverse().find((p) => p.value !== null);
              const change =
                latest?.change !== undefined && latest.change !== null ? latest.change : null;
              return (
                <div
                  key={key}
                  className='rounded-lg p-4 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
                >
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium text-gray-600 dark:text-gray-300'>
                      {label}
                    </span>
                    <span
                      className='w-2.5 h-2.5 rounded-full inline-block'
                      style={{ backgroundColor: color }}
                      aria-hidden='true'
                    />
                  </div>
                  <div className='text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1 tabular-nums'>
                    {formatNumber((latest?.value as number) ?? 0)}
                  </div>
                  <div className='text-xs text-gray-500 dark:text-gray-400'>
                    {change === null
                      ? '—'
                      : `${change >= 0 ? '+' : ''}${formatNumber(change)} vs previous snapshot`}
                  </div>
                </div>
              );
            })}
          </div>

          <div className='p-6'>
            <div style={{ width: '100%', height: 360 }}>
              <ResponsiveContainer>
                <LineChart data={chartRows} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                  <CartesianGrid strokeDasharray='3 3' stroke='#e5e7eb' />
                  <XAxis
                    dataKey='date'
                    tick={{ fontSize: 12 }}
                    tickFormatter={(d: string) => d.slice(5)}
                  />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => formatNumber(v)} />
                  <Tooltip
                    formatter={(value: number | string) => formatNumber(Number(value))}
                    labelFormatter={(label: string) => `Snapshot ${label}`}
                  />
                  <Legend />
                  {SERIES.map(({ key, label, color }) => (
                    <Line
                      key={key}
                      type='monotone'
                      dataKey={key}
                      name={label}
                      stroke={color}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className='text-xs text-gray-400 dark:text-gray-500 mt-3 text-center'>
              History builds up one snapshot per daily scan — the line gets more detailed over time.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default GrowthTrends;
