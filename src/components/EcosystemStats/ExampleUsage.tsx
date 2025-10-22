import React from 'react';
import { OverviewMetrics } from './index';

/**
 * Example Usage Component
 *
 * This file demonstrates various ways to use the OverviewMetrics component
 * in a real application context.
 */

// Basic usage example
export const BasicUsage = () => {
  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Claude Code Ecosystem
        </h1>
        <OverviewMetrics />
      </div>
    </div>
  );
};

// Dashboard integration example
export const DashboardIntegration = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Ecosystem Dashboard
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Real-time insights into the Claude Code plugin ecosystem
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Last updated: {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Section */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Overview
          </h2>
          <OverviewMetrics
            autoRefresh={true}
            refreshInterval={60000} // 1 minute
            className="mb-6"
          />
        </section>

        {/* Additional Dashboard Content */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Additional dashboard widgets would go here...
            </p>
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Trending Plugins</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Additional dashboard widgets would go here...
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

// With custom container and controls
export const CustomContainerExample = () => {
  const [refreshEnabled, setRefreshEnabled] = React.useState(false);
  const [refreshInterval, setRefreshInterval] = React.useState(30000);

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Controls */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Dashboard Controls</h2>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={refreshEnabled}
                onChange={(e) => setRefreshEnabled(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium">Auto-refresh</span>
            </label>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Interval:</label>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="input text-sm w-32"
                disabled={!refreshEnabled}
              >
                <option value={10000}>10 seconds</option>
                <option value={30000}>30 seconds</option>
                <option value={60000}>1 minute</option>
                <option value={300000}>5 minutes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Metrics with custom settings */}
        <OverviewMetrics
          autoRefresh={refreshEnabled}
          refreshInterval={refreshInterval}
          className="shadow-xl"
        />

        {/* Information Panel */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">About These Metrics</h3>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p>
              The metrics above provide a comprehensive overview of the Claude Code plugin ecosystem.
              They are updated in real-time from our analytics platform and include:
            </p>
            <ul>
              <li>Total number of plugins across all marketplaces</li>
              <li>Active marketplaces in the ecosystem</li>
              <li>Registered developers contributing plugins</li>
              <li>Cumulative download statistics</li>
            </ul>
            <p>
              Growth rates are calculated over the last 30 days and provide insights into
              ecosystem trends and momentum.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Error boundary example
export class ErrorBoundaryExample extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('OverviewMetrics error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <div className="card p-6 border-error-200 dark:border-error-800">
            <h2 className="text-xl font-semibold text-error-800 dark:text-error-200 mb-2">
              Something went wrong
            </h2>
            <p className="text-error-600 dark:text-error-400 mb-4">
              Failed to load the ecosystem metrics component.
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="btn btn-primary"
            >
              Try Again
            </button>
            {this.state.error && (
              <details className="mt-4">
                <summary className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                  Error Details
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapped with error boundary
export const SafeOverviewMetrics = () => {
  return (
    <ErrorBoundaryExample>
      <BasicUsage />
    </ErrorBoundaryExample>
  );
};

export default {
  BasicUsage,
  DashboardIntegration,
  CustomContainerExample,
  SafeOverviewMetrics,
  ErrorBoundaryExample,
};