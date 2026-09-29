import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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
  /** Validated categorical step — see --series-* tokens in EcosystemStats.css */
  colorVar: string;
}

const SERIES: SeriesConfig[] = [
  { key: 'plugins', label: 'Plugins', colorVar: 'var(--series-plugins)' },
  { key: 'marketplaces', label: 'Marketplaces', colorVar: 'var(--series-marketplaces)' },
  { key: 'developers', label: 'Developers', colorVar: 'var(--series-developers)' },
  { key: 'stars', label: 'Stars', colorVar: 'var(--series-stars)' },
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

/** Round an axis max up to a clean 1/2/2.5/5 x 10^k so ticks stay readable. */
const niceCeil = (v: number): number => {
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  for (const m of [1, 2, 2.5, 5, 10]) {
    if (m * pow >= v) return m * pow;
  }
  return 10 * pow;
};

const latestValue = (points: TrendPoint[] | undefined): number | null => {
  const latest = [...(points || [])].reverse().find((p) => p.value !== null);
  return latest ? (latest.value as number) : null;
};

const PANEL_HEIGHT = 170;

interface TrendPanelProps {
  config: SeriesConfig;
  rows: ChartRow[];
  maxValue: number;
}

/**
 * One titled panel per metric. Each series gets its own zero-based scale:
 * the metrics run from hundreds to hundreds of thousands, so a shared axis
 * flattens everything but Stars (and a dual axis invents correlations).
 */
const TrendPanel: React.FC<TrendPanelProps> = ({ config, rows, maxValue }) => {
  const renderEndLabel = (props: {
    index?: number;
    x?: number | string;
    y?: number | string;
    value?: unknown;
  }) => {
    if (props.index === undefined || props.index !== rows.length - 1) return null;
    if (props.x === undefined || props.y === undefined) return null;
    if (props.value === undefined || props.value === null) return null;
    return (
      <text
        x={Number(props.x) + 8}
        y={Number(props.y) + 4}
        fontSize={12}
        fontWeight={600}
        fill='var(--tooltip-text)'
      >
        {formatNumber(Number(props.value))}
      </text>
    );
  };

  return (
    <div>
      <div className='flex items-center gap-2 mb-1'>
        <span
          className='w-2.5 h-2.5 rounded-full inline-block'
          style={{ backgroundColor: config.colorVar }}
          aria-hidden='true'
        />
        <p className='text-sm font-medium text-gray-600 dark:text-gray-300'>{config.label}</p>
      </div>
      <div style={{ width: '100%', height: PANEL_HEIGHT }}>
        <ResponsiveContainer>
          <LineChart data={rows} margin={{ top: 8, right: 56, bottom: 4, left: 0 }}>
            <CartesianGrid stroke='var(--chart-grid)' vertical={false} />
            <XAxis
              dataKey='date'
              tick={{ fontSize: 10, fill: 'var(--chart-axis-text)' }}
              tickLine={false}
              axisLine={{ stroke: 'var(--chart-grid)' }}
              tickFormatter={(d: string) => d.slice(5)}
              minTickGap={32}
            />
            <YAxis
              domain={[0, niceCeil(maxValue)]}
              tickCount={3}
              tick={{ fontSize: 10, fill: 'var(--chart-axis-text)' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => formatNumber(v)}
              width={44}
            />
            <Tooltip
              cursor={{ stroke: 'var(--tooltip-muted)' }}
              formatter={(value: unknown) => formatNumber(Number(value))}
              labelFormatter={(label: unknown) => `Snapshot ${String(label)}`}
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
            <Line
              type='monotone'
              dataKey={config.key}
              stroke={config.colorVar}
              strokeWidth={2}
              strokeLinecap='round'
              strokeLinejoin='round'
              // Dots only while history is sparse; past a month of daily
              // snapshots they turn to noise and hover carries the detail.
              dot={
                rows.length <= 31 ? { r: 4, strokeWidth: 2, stroke: 'var(--chart-surface)' } : false
              }
              activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--chart-surface)' }}
              label={renderEndLabel}
              connectNulls
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const GrowthTrends: React.FC<GrowthTrendsProps> = ({ className = '' }) => {
  const { data, loading, error, refresh } = useEcosystemStats();
  const [view, setView] = React.useState<'chart' | 'data'>('chart');

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
            {SERIES.map(({ key, label, colorVar }) => {
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
                      style={{ backgroundColor: colorVar }}
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
                {/* Legend (identity + current value) and the chart/table view
                    toggle share one row above the charts */}
                <div className='flex flex-wrap items-center justify-between gap-x-6 gap-y-3 mb-5'>
                  <div className='flex flex-wrap items-center gap-x-5 gap-y-2'>
                    {SERIES.map(({ key, label, colorVar }) => (
                      <span
                        key={key}
                        className='inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300'
                      >
                        <span
                          className='w-2.5 h-2.5 rounded-full inline-block'
                          style={{ backgroundColor: colorVar }}
                          aria-hidden='true'
                        />
                        {label}
                        <span className='font-mono text-gray-900 dark:text-gray-50 tabular-nums'>
                          {formatNumber(latestValue(data?.[key]) ?? 0)}
                        </span>
                      </span>
                    ))}
                  </div>
                  <div
                    className='inline-flex rounded-md border border-gray-200 dark:border-gray-700 p-0.5'
                    role='group'
                    aria-label='Trend view'
                  >
                    {(['chart', 'data'] as const).map((mode) => (
                      <button
                        key={mode}
                        type='button'
                        aria-pressed={view === mode}
                        onClick={() => setView(mode)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                          view === mode
                            ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                      >
                        {mode === 'chart' ? 'Chart' : 'Data'}
                      </button>
                    ))}
                  </div>
                </div>

                {view === 'chart' ? (
                  <>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8'>
                      {SERIES.map(({ key }) => {
                        const values = chartRows
                          .map((r) => r[key])
                          .filter((v): v is number => typeof v === 'number');
                        return (
                          <TrendPanel
                            key={key}
                            config={SERIES.find((s) => s.key === key) as SeriesConfig}
                            rows={chartRows}
                            maxValue={Math.max(...values, 1)}
                          />
                        );
                      })}
                    </div>
                    <p className='text-xs text-gray-400 dark:text-gray-500 mt-4 text-center'>
                      History builds up one snapshot per daily scan — each panel uses its own
                      zero-based scale, so lines are comparable in shape, not in height.
                    </p>
                  </>
                ) : (
                  <div className='max-h-[28rem] overflow-auto rounded-lg border border-gray-200 dark:border-gray-700'>
                    <table className='w-full text-sm'>
                      <thead className='sticky top-0 bg-gray-50 dark:bg-gray-800'>
                        <tr>
                          <th
                            scope='col'
                            className='px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300'
                          >
                            Snapshot
                          </th>
                          {SERIES.map(({ label }) => (
                            <th
                              key={label}
                              scope='col'
                              className='px-4 py-2 text-right font-medium text-gray-600 dark:text-gray-300'
                            >
                              {label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[...chartRows].reverse().map((row) => (
                          <tr
                            key={row.date}
                            className='border-t border-gray-100 dark:border-gray-800'
                          >
                            <td className='px-4 py-1.5 text-gray-600 dark:text-gray-400'>
                              {row.date}
                            </td>
                            {SERIES.map(({ key }) => (
                              <td
                                key={key}
                                className='px-4 py-1.5 text-right text-gray-900 dark:text-gray-100 tabular-nums font-mono'
                              >
                                {typeof row[key] === 'number'
                                  ? formatNumber(row[key] as number)
                                  : '—'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
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
