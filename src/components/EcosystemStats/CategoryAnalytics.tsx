import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import { Package } from 'lucide-react';
import { formatNumber } from '../../utils/format';
import { topicShare } from '../../utils/stats';
import { useEcosystemStats } from '../../hooks/useEcosystemStats';
import ErrorDisplay from '../ui/ErrorDisplay';

interface CategoryAnalyticsProps {
  className?: string;
}

const CategoryAnalytics: React.FC<CategoryAnalyticsProps> = ({ className = '' }) => {
  const router = useRouter();
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

  const categories = [...(data?.categories || [])].sort((a, b) => b.count - a.count);
  const totalMarketplaces = data?.overview.totalMarketplaces ?? 0;

  const browseTopic = (topic: string) => {
    router.push(`/marketplaces?topic=${encodeURIComponent(topic)}`);
  };

  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden ${className}`}
      role='region'
      aria-labelledby='category-analytics-title'
    >
      <div className='p-6 border-b border-gray-200 dark:border-gray-800'>
        <p id='category-analytics-title' className='eyebrow eyebrow-prompt mb-2'>
          ls --by-topic
        </p>
        <p className='text-gray-600 dark:text-gray-400'>
          How many marketplaces carry each topic. A marketplace can carry several topics, so topics
          overlap — these are counts, not a partition.
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
                margin={{ top: 8, right: 44, bottom: 8, left: 8 }}
              >
                <CartesianGrid stroke='var(--chart-grid)' horizontal={false} />
                <XAxis
                  type='number'
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v: number) => formatNumber(v)}
                />
                <YAxis type='category' dataKey='name' width={140} tick={{ fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: 'rgba(217,119,87,0.08)' }}
                  formatter={(value: unknown) => [
                    `${formatNumber(Number(value))} marketplaces · ${topicShare(
                      Number(value),
                      totalMarketplaces
                    )}% of catalog`,
                    'Share',
                  ]}
                  labelFormatter={(label: unknown) => `Topic "${String(label)}"`}
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
                <Bar
                  dataKey='count'
                  fill='var(--series-plugins)'
                  radius={[0, 4, 4, 0]}
                  maxBarSize={22}
                  style={{ cursor: 'pointer' }}
                  onClick={(bar: unknown) => {
                    const topic = (bar as { payload?: { name?: string } })?.payload?.name;
                    if (topic) browseTopic(topic);
                  }}
                >
                  <LabelList
                    dataKey='count'
                    position='right'
                    formatter={(value: unknown) => formatNumber(Number(value))}
                    style={{ fill: 'var(--tooltip-text)', fontSize: 11, fontWeight: 600 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p className='text-xs text-gray-400 dark:text-gray-500 mt-2 text-center'>
            Bars and pills count marketplaces carrying each topic — topics overlap, so counts
            aren&apos;t a partition. Click a bar to browse those marketplaces.
          </p>

          {/* Keyboard/screen-reader path to the same deep links the bars provide */}
          {categories.length > 0 && (
            <div className='mt-4 flex flex-wrap gap-2 justify-center'>
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/marketplaces?topic=${encodeURIComponent(c.name)}`}
                  className='badge badge-secondary hover:border-primary-300 dark:hover:border-primary-600 hover:text-primary-700 dark:hover:text-primary-300 transition-all'
                  aria-label={`Browse ${c.name} marketplaces (${formatNumber(c.count)})`}
                >
                  {c.name} · {formatNumber(c.count)}
                </Link>
              ))}
            </div>
          )}

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
