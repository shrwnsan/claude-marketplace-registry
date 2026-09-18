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
import { hasEnoughHistory, GROWTH_LINE_MIN_POINTS } from '../../utils/stats';
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
  { key: 'plugins', label: 'Plugins', color: '#d97757' },
  { key: 'marketplaces', label: 'Marketplaces', color: '#2da44e' },
  { key: 'developers', label: 'Developers', color: '#dcaa3f' },
  { key: 'stars', label: 'Stars', color: '#3ec0ca' },
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

  const showLine = hasEnoughHistory(chartRows.length);
  const showDeltas = chartRows.length >= 2;

  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden ${className}`}
      role='region'
      aria-labelledby='growth-trends-title'
    >
      <div className='p-6 border-b border-gray-200 dark:border-gray-800'>
        <p id='growth-trends-title' className='eyebrow eyebrow-prompt mb-2'>
          growth --trends
        </p>
        <p className='text-gray-600 dark:text-gray-400'>
          Snapshots recorded by each daily scan — one point per day
        </p>
      </div>

      {!showDeltas ? (
        <div className='p-10 text-center'>
          <p className='text-gray-600 dark:text-gray-300 font-medium mb-2'>
            Growth history is collecting
          </p>
          <p className='text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto'>
            Each daily scan records a snapshot.{' '}
            {chartRows.length === 1
              ? `The first snapshot was recorded on ${chartRows[0].date} — totals appear after the next scan.`
              : 'Totals will appear after a few daily scans.'}
          </p>
        </div>
      ) : (
        <>
          {/* Latest snapshot deltas — the primary display until the line has
              enough points to be meaningful (2-point lines read as noise) */}
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
                  <div className='text-2xl font-bold font-mono text-gray-900 dark:text-gray-50 mt-1 tabular-nums'>
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
            {showLine ? (
              <>
                <div style={{ width: '100%', height: 360 }}>
                  <ResponsiveContainer>
                    <LineChart data={chartRows} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                      <CartesianGrid strokeDasharray='3 3' stroke='var(--chart-grid)' />
                      <XAxis
                        dataKey='date'
                        tick={{ fontSize: 12 }}
                        tickFormatter={(d: string) => d.slice(5)}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={(v: number) => formatNumber(v)}
                      />
                      <Tooltip
                        cursor={{ stroke: 'var(--tooltip-muted)', strokeDasharray: '3 3' }}
                        formatter={(value: number | string) => formatNumber(Number(value))}
                        labelFormatter={(label: string) => `Snapshot ${label}`}
                        contentStyle={{
                          backgroundColor: 'var(--tooltip-bg)',
                          border: '1px solid var(--tooltip-border)',
                          borderRadius: '0.5rem',
                          color: 'var(--tooltip-text)',
                          fontSize: '0.875rem',
                        }}
                        labelStyle={{ color: 'var(--tooltip-muted)' }}
                        itemStyle={{ color: 'var(--tooltip-text)' }}
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
                  History builds up one snapshot per daily scan — the line gets more detailed over
                  time.
                </p>
              </>
            ) : (
              <div className='py-10 text-center'>
                <p className='font-mono text-sm text-gray-600 dark:text-gray-300'>
                  {chartRows.length} of {GROWTH_LINE_MIN_POINTS} daily snapshots recorded
                </p>
                <p className='text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mt-2'>
                  A two-point line reads as noise, so the trend chart switches on here once{' '}
                  {GROWTH_LINE_MIN_POINTS} daily snapshots exist. The totals above update every
                  scan.
                </p>
                {/* collection progress */}
                <div className='max-w-xs mx-auto mt-4 flex gap-1.5'>
                  {Array.from({ length: GROWTH_LINE_MIN_POINTS }, (_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 flex-1 rounded-full ${
                        i < chartRows.length ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                      aria-hidden='true'
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default GrowthTrends;
