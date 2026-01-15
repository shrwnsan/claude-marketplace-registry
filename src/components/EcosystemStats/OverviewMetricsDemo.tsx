import React, { useState } from 'react';
import OverviewMetrics from './OverviewMetrics';
import { mockEcosystemOverview } from './mock-api-data';
import { EcosystemOverview } from '../../types/ecosystem-stats';
import ErrorDisplay from '../ui/ErrorDisplay';

interface DemoProps {
  className?: string;
}

// Demo component that showcases OverviewMetrics with different states
const OverviewMetricsDemo: React.FC<DemoProps> = ({ className = '' }) => {
  const [demoState, setDemoState] = useState<'loading' | 'success' | 'error'>('success');
  const [mockData, setMockData] = useState<EcosystemOverview>(mockEcosystemOverview);

  const handleStateChange = (state: 'loading' | 'success' | 'error') => {
    setDemoState(state);
  };

  const updateMockData = () => {
    // Generate slightly different data for demonstration
    const newData: EcosystemOverview = {
      ...mockData,
      totalPlugins: mockData.totalPlugins + Math.floor(Math.random() * 10) - 5,
      totalMarketplaces: mockData.totalMarketplaces + (Math.random() > 0.8 ? 1 : 0),
      totalDevelopers: mockData.totalDevelopers + Math.floor(Math.random() * 5) - 2,
      totalDownloads: mockData.totalDownloads + Math.floor(Math.random() * 100) - 50,
      growthRate: {
        plugins: mockData.growthRate.plugins + (Math.random() * 4 - 2),
        marketplaces: mockData.growthRate.marketplaces + (Math.random() * 2 - 1),
        developers: mockData.growthRate.developers + (Math.random() * 3 - 1.5),
        downloads: mockData.growthRate.downloads + (Math.random() * 5 - 2.5),
      },
      healthScore: Math.max(
        0,
        Math.min(100, (mockData.healthScore || 50) + Math.floor(Math.random() * 10) - 5)
      ),
      lastUpdated: new Date().toISOString(),
    };
    setMockData(newData);
  };

  // Mock component that simulates different states
  const MockOverviewMetricsWrapper = () => {
    const [loading, setLoading] = useState(demoState === 'loading');
    const [error, setError] = useState<string | null>(
      demoState === 'error' ? 'Demo error state' : null
    );
    const [data, setData] = useState<EcosystemOverview | null>(
      demoState === 'error' ? null : mockData
    );

    React.useEffect(() => {
      setDemoState((state) => {
        if (state === 'loading') {
          setLoading(true);
          setError(null);
          setTimeout(() => {
            setLoading(false);
            setData(mockData);
          }, 2000);
        } else if (state === 'error') {
          setLoading(false);
          setError('Failed to load ecosystem metrics. Please try again later.');
          setData(null);
        } else {
          setLoading(false);
          setError(null);
          setData(mockData);
        }
        return state;
      });
    }, [demoState, mockData]);

    if (loading && !data) {
      return (
        <section className={className} aria-label='Ecosystem Overview Metrics'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6'>
            {[...Array(4)].map((_, index) => (
              <div key={`skeleton-${index}`} className='card p-6 animate-pulse'>
                <div className='flex items-center justify-between mb-4'>
                  <div className='h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg'></div>
                  <div className='h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded'></div>
                </div>
                <div className='space-y-2'>
                  <div className='h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded'></div>
                  <div className='h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded'></div>
                </div>
              </div>
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
            onRetry={() => setDemoState('success')}
            className='w-full'
          />
        </section>
      );
    }

    return <OverviewMetrics className={className} />;
  };

  return (
    <div className='space-y-6'>
      {/* Demo Controls */}
      <div className='card p-4'>
        <h3 className='text-lg font-semibold mb-4'>OverviewMetrics Demo Controls</h3>

        <div className='flex flex-wrap gap-3 mb-4'>
          <button
            onClick={() => handleStateChange('loading')}
            className={`btn ${demoState === 'loading' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Show Loading State
          </button>
          <button
            onClick={() => handleStateChange('success')}
            className={`btn ${demoState === 'success' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Show Success State
          </button>
          <button
            onClick={() => handleStateChange('error')}
            className={`btn ${demoState === 'error' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Show Error State
          </button>
          <button
            onClick={updateMockData}
            className='btn btn-primary'
            disabled={demoState !== 'success'}
          >
            Refresh Mock Data
          </button>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
          <div className='space-y-2'>
            <h4 className='font-medium'>Current State:</h4>
            <p className='text-gray-600 dark:text-gray-400'>
              {demoState === 'loading' && '⏳ Loading metrics...'}
              {demoState === 'success' && '✅ Metrics loaded successfully'}
              {demoState === 'error' && '❌ Failed to load metrics'}
            </p>
          </div>
          <div className='space-y-2'>
            <h4 className='font-medium'>Mock Data:</h4>
            <div className='text-gray-600 dark:text-gray-400'>
              <p>Plugins: {mockData.totalPlugins.toLocaleString()}</p>
              <p>Marketplaces: {mockData.totalMarketplaces}</p>
              <p>Developers: {mockData.totalDevelopers.toLocaleString()}</p>
              <p>Downloads: {mockData.totalDownloads.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Component Demo */}
      <MockOverviewMetricsWrapper />

      {/* Component Information */}
      <div className='card p-6'>
        <h3 className='text-lg font-semibold mb-4'>Component Features</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 text-sm'>
          <div className='space-y-2'>
            <h4 className='font-medium text-primary-600 dark:text-primary-400'>✨ Features</h4>
            <ul className='space-y-1 text-gray-600 dark:text-gray-400'>
              <li>• Responsive grid layout (1-4 columns)</li>
              <li>• Animated metric cards with hover effects</li>
              <li>• Real-time data fetching with auto-refresh</li>
              <li>• Growth indicators with trend visualization</li>
              <li>• Loading skeleton states</li>
              <li>• Error handling with retry functionality</li>
              <li>• Ecosystem health score visualization</li>
            </ul>
          </div>
          <div className='space-y-2'>
            <h4 className='font-medium text-primary-600 dark:text-primary-400'>♿ Accessibility</h4>
            <ul className='space-y-1 text-gray-600 dark:text-gray-400'>
              <li>• Full ARIA label support</li>
              <li>• Keyboard navigation</li>
              <li>• Screen reader compatible</li>
              <li>• Focus management</li>
              <li>• Semantic HTML structure</li>
              <li>• Progress bar for health score</li>
              <li>• High contrast design</li>
            </ul>
          </div>
        </div>
      </div>

      {/* API Integration Info */}
      <div className='card p-6'>
        <h3 className='text-lg font-semibold mb-4'>API Integration</h3>
        <div className='bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700'>
          <p className='text-sm text-gray-600 dark:text-gray-400 mb-2'>
            The component fetches data from:
          </p>
          <code className='text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded'>
            GET /api/ecosystem-stats?overview
          </code>
          <p className='text-sm text-gray-600 dark:text-gray-400 mt-3'>
            Expected response format follows the{' '}
            <code className='text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded'>
              EcosystemStatsResponse&lt;EcosystemOverview&gt;
            </code>{' '}
            type.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OverviewMetricsDemo;
