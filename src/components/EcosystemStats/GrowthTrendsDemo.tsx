/**
 * GrowthTrends Demo Component
 *
 * A demo page to showcase and test the GrowthTrends component functionality.
 * This component can be used during development and testing to verify
 * that the charts render correctly and are interactive.
 *
 * @author Claude Marketplace Team
 * @version 1.0.0
 */

import React, { useState } from 'react';
import GrowthTrends from './GrowthTrends';
import { TimeRange } from '../../utils/data-processor';

const GrowthTrendsDemo: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [showMetrics, setShowMetrics] = useState({
    plugins: true,
    marketplaces: true,
    developers: true,
    downloads: true,
  });

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900 py-8'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2'>
            GrowthTrends Component Demo
          </h1>
          <p className='text-gray-600 dark:text-gray-400'>
            Interactive demonstration of the ecosystem growth trends visualization
          </p>
        </div>

        {/* Demo Controls */}
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8'>
          <h2 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4'>
            Demo Controls
          </h2>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Time Range Control */}
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                Time Range
              </label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
              >
                <option value='7d'>7 Days</option>
                <option value='30d'>30 Days</option>
                <option value='90d'>90 Days</option>
                <option value='1y'>1 Year</option>
              </select>
            </div>

            {/* Metrics Toggle */}
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                Show Metrics
              </label>
              <div className='space-y-2'>
                {Object.entries(showMetrics).map(([key, value]) => (
                  <label key={key} className='flex items-center'>
                    <input
                      type='checkbox'
                      checked={value}
                      onChange={(e) =>
                        setShowMetrics((prev) => ({
                          ...prev,
                          [key]: e.target.checked,
                        }))
                      }
                      className='rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 mr-2'
                    />
                    <span className='text-sm text-gray-700 dark:text-gray-300 capitalize'>
                      {key}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* GrowthTrends Component */}
        <GrowthTrends
          initialTimeRange={timeRange}
          showMetrics={showMetrics}
          refreshInterval={30000} // 30 seconds for demo
          className='mb-8'
        />

        {/* Usage Example */}
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
          <h2 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4'>
            Usage Example
          </h2>
          <pre className='bg-gray-100 dark:bg-gray-900 rounded-md p-4 overflow-x-auto text-sm'>
            <code>{`import GrowthTrends from '@/components/EcosystemStats/GrowthTrends';

function MyComponent() {
  return (
    <GrowthTrends
      initialTimeRange="30d"
      showMetrics={{
        plugins: true,
        marketplaces: true,
        developers: true,
        downloads: true,
      }}
      refreshInterval={5 * 60 * 1000} // 5 minutes
      height={400}
    />
  );
}`}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};

export default GrowthTrendsDemo;
