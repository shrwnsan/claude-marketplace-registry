import React from 'react';
import QualityIndicators from './QualityIndicators';
import { QualityIndicators as IQualityIndicators } from '../../types/ecosystem-stats';

/**
 * QualityIndicatorsDemo Component
 *
 * This component demonstrates the QualityIndicators component with various configurations
 * and mock data. It showcases different states, layouts, and features of the quality
 * indicators dashboard.
 *
 * @component
 * @example
 * ```tsx
 * <QualityIndicatorsDemo />
 * ```
 */
const QualityIndicatorsDemo: React.FC = () => {
  // Mock quality data for demonstration
  const mockQualityData: IQualityIndicators = {
    verification: {
      verifiedPlugins: 850,
      verificationRate: 68.0,
      badges: [
        { type: 'security', count: 450 },
        { type: 'quality', count: 620 },
        { type: 'popularity', count: 280 },
        { type: 'maintenance', count: 380 },
      ],
    },
    maintenance: {
      recentlyUpdated: 720,
      activeMaintenanceRate: 57.6,
      avgUpdateFrequency: 14,
      abandonedPlugins: 15,
    },
    qualityMetrics: {
      avgQualityScore: 78.5,
      highQualityPlugins: 520,
      commonIssues: [
        { issue: 'Missing documentation', frequency: 45, severity: 'low' },
        { issue: 'Outdated dependencies', frequency: 28, severity: 'medium' },
        { issue: 'Security vulnerabilities', frequency: 8, severity: 'high' },
        { issue: 'Code quality issues', frequency: 35, severity: 'medium' },
        { issue: 'Performance bottlenecks', frequency: 22, severity: 'low' },
        { issue: 'Missing error handling', frequency: 18, severity: 'medium' },
      ],
    },
    security: {
      scannedPlugins: 980,
      criticalIssues: 8,
      securityScore: 82.3,
    },
  };

  // Intercept fetch calls for demo
  React.useEffect(() => {
    const originalFetch = global.fetch;

    global.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('/api/ecosystem-stats?quality')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            success: true,
            data: mockQualityData,
            meta: {
              timestamp: new Date().toISOString(),
              requestId: 'demo-request',
              responseTime: 150,
            },
          }),
          headers: new Headers(),
          redirected: false,
          statusText: 'OK',
          type: 'basic',
          url,
          clone: jest.fn(),
          body: null,
          bodyUsed: false,
          arrayBuffer: jest.fn(),
          blob: jest.fn(),
          formData: jest.fn(),
          text: jest.fn(),
        });
      }
      return originalFetch(url);
    });

    return () => {
      global.fetch = originalFetch;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Quality Indicators Demo
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Explore ecosystem quality metrics, verification status, maintenance indicators,
            and community trust signals. This dashboard provides comprehensive insights into
            the health and reliability of the plugin ecosystem.
          </p>
        </header>

        {/* Main Quality Indicators */}
        <section className="mb-12">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Standard Quality Overview
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Core quality metrics with verification status, maintenance indicators, and trust signals.
            </p>
          </div>

          <QualityIndicators
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
            refreshInterval={30000}
            autoRefresh={false}
          />
        </section>

        {/* Detailed Quality Indicators */}
        <section className="mb-12">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Detailed Quality Analysis
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Comprehensive quality analysis including common issues, score distribution, and security overview.
            </p>
          </div>

          <QualityIndicators
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
            showDetailed={true}
            refreshInterval={60000}
            autoRefresh={false}
          />
        </section>

        {/* Compact Quality Indicators */}
        <section className="mb-12">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Compact View
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Space-efficient display suitable for dashboards and sidebars.
            </p>
          </div>

          <QualityIndicators
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4"
            compact={true}
            showDetailed={false}
            refreshInterval={60000}
            autoRefresh={false}
          />
        </section>

        {/* Auto-Refresh Example */}
        <section className="mb-12">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Auto-Refresh Example
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Demonstrates automatic data refresh every 30 seconds (simulated).
            </p>
          </div>

          <QualityIndicators
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
            autoRefresh={true}
            refreshInterval={30000}
            showDetailed={false}
          />

          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
            <div className="flex items-center text-blue-800 dark:text-blue-200">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">
                This component will automatically refresh its data every 30 seconds.
              </span>
            </div>
          </div>
        </section>

        {/* Feature Showcase */}
        <section className="mb-12">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Key Features
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              The QualityIndicators component includes numerous features for comprehensive quality monitoring.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature Cards */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                  <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Verification Status
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Real-time verification rates and badge tracking for plugin security, quality, popularity, and maintenance status.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-success-100 dark:bg-success-900/30 rounded-lg">
                  <svg className="w-6 h-6 text-success-600 dark:text-success-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Active Maintenance
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Track plugin update frequencies, recently maintained projects, and identify abandoned plugins.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-warning-100 dark:bg-warning-900/30 rounded-lg">
                  <svg className="w-6 h-6 text-warning-600 dark:text-warning-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Quality Scoring
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Comprehensive quality metrics with score distributions and common issue identification.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-error-100 dark:bg-error-900/30 rounded-lg">
                  <svg className="w-6 h-6 text-error-600 dark:text-error-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Security Monitoring
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Security scan coverage, critical issue tracking, and overall ecosystem security scoring.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Trend Analysis
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Quality trend indicators showing improvements or declines over time.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Responsive Design
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Fully responsive layout that adapts to different screen sizes and devices.
              </p>
            </div>
          </div>
        </section>

        {/* Usage Instructions */}
        <section className="mb-12">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Usage Instructions
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Learn how to integrate and customize the QualityIndicators component in your application.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Basic Usage
            </h3>

            <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 overflow-x-auto mb-6">
              <pre className="text-sm text-gray-300">
                <code>{`import QualityIndicators from './components/EcosystemStats/QualityIndicators';

function MyComponent() {
  return (
    <QualityIndicators
      refreshInterval={60000}      // Auto-refresh every minute
      autoRefresh={true}           // Enable auto-refresh
      showDetailed={false}         // Show/hide detailed analysis
      compact={false}              // Compact view mode
      className="custom-styles"    // Additional CSS classes
    />
  );
}`}</code>
              </pre>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Configuration Options
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                  refreshInterval
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Number: Time in milliseconds between auto-refresh cycles (default: 60000)
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                  autoRefresh
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Boolean: Enable or disable automatic data refresh (default: false)
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                  showDetailed
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Boolean: Show detailed quality analysis (default: false)
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                  compact
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Boolean: Use compact display mode (default: false)
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center py-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400">
            This demo showcases the QualityIndicators component from the Claude Code Marketplace ecosystem.
            The component provides comprehensive quality monitoring and insights for plugin ecosystems.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default QualityIndicatorsDemo;