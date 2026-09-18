import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Package } from 'lucide-react';
import { formatNumber } from '../../utils/format';
import { useEcosystemStats } from '../../hooks/useEcosystemStats';
import ErrorDisplay from '../ui/ErrorDisplay';

interface CategoryAnalyticsProps {
  className?: string;
}

const CategoryAnalytics: React.FC<CategoryAnalyticsProps> = ({ className = '' }) => {
  const { data, loading, error, refresh } = useEcosystemStats();

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
          title='Failed to Load Category Data'
          message={error}
          onRetry={refresh}
          showIcon
        />
      </div>
    );
  }

  const categories = data?.categories || [];

  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden ${className}`}
      role='region'
      aria-labelledby='category-analytics-title'
    >
      <div className='p-6 border-b border-gray-200 dark:border-gray-800'>
        <h2
          id='category-analytics-title'
          className='text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2'
        >
          Topic Distribution
        </h2>
        <p className='text-gray-600 dark:text-gray-400'>
          How many plugins come from marketplaces tagged with each topic. Topics overlap — a
          marketplace can carry several — so these are counts, not a partition.
        </p>
      </div>

      {categories.length === 0 ? (
        <div className='p-10 text-center'>
          <Package className='w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3' />
          <p className='text-sm text-gray-500 dark:text-gray-400'>
            No topics recorded yet — this appears once marketplaces carry topic tags.
          </p>
        </div>
      ) : (
        <div className='p-6'>
          <div style={{ width: '100%', height: Math.max(280, categories.length * 36 + 80) }}>
            <ResponsiveContainer>
              <BarChart
                data={categories}
                layout='vertical'
                margin={{ top: 8, right: 24, bottom: 8, left: 8 }}
              >
                <CartesianGrid
                  strokeDasharray='3 3'
                  stroke='var(--chart-grid)'
                  horizontal={false}
                />
                <XAxis
                  type='number'
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v: number) => formatNumber(v)}
                />
                <YAxis type='category' dataKey='name' width={140} tick={{ fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: 'rgba(59,130,246,0.06)' }}
                  formatter={(value: number | string) => [formatNumber(Number(value)), 'Plugins']}
                  labelFormatter={(label: string) => `Topic "${label}"`}
                  contentStyle={{
                    backgroundColor: 'var(--tooltip-bg)',
                    border: '1px solid var(--tooltip-border)',
                    borderRadius: '0.5rem',
                    color: 'var(--tooltip-text)',
                    fontSize: '0.875rem',
                  }}
                  labelStyle={{ color: 'var(--tooltip-text)' }}
                  itemStyle={{ color: 'var(--tooltip-text)' }}
                />
                <Bar dataKey='count' fill='#d97757' radius={[0, 4, 4, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p className='text-xs text-gray-400 dark:text-gray-500 mt-2 text-center'>
            Counts refer to plugins whose parent marketplace carries the topic; one plugin can
            appear under several topics.
          </p>

          {/* Insights */}
          {(data?.insights || []).length > 0 && (
            <div className='mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700'>
              <h3 className='text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2'>
                Ecosystem Insights
              </h3>
              <ul className='space-y-1.5'>
                {(data?.insights || []).map((insight) => (
                  <li
                    key={insight}
                    className='text-sm text-gray-600 dark:text-gray-300 flex items-start'
                  >
                    <Package className='w-3.5 h-3.5 mr-2 mt-0.5 text-primary-500 flex-shrink-0' />
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CategoryAnalytics;
