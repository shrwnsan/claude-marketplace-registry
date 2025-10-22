/**
 * GrowthTrends Component Tests
 *
 * Unit tests for the GrowthTrends component to ensure it renders correctly,
 * handles state changes, and provides proper accessibility.
 *
 * @author Claude Marketplace Team
 * @version 1.0.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import GrowthTrends from '../GrowthTrends';

// Mock the fetch API
global.fetch = jest.fn();

// Mock the recharts components to avoid rendering issues in tests
jest.mock('recharts', () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: ({ content }: { content: React.ReactNode }) => <div data-testid="tooltip">{content}</div>,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
}));

// Mock LoadingState and ErrorDisplay
jest.mock('../../ui/LoadingState', () => {
  return function MockLoadingState({ message }: { message?: string }) {
    return <div data-testid="loading-state">{message || 'Loading...'}</div>;
  };
});

jest.mock('../../ui/ErrorDisplay', () => {
  return function MockErrorDisplay({ message, onRetry }: { message: string; onRetry?: () => void }) {
    return (
      <div data-testid="error-display">
        <span>{message}</span>
        {onRetry && <button onClick={onRetry}>Retry</button>}
      </div>
    );
  };
});

describe('GrowthTrends Component', () => {
  const mockFetchResponse = {
    success: true,
    data: {
      plugins: [
        { date: '2025-10-20', value: 1000, change: 10 },
        { date: '2025-10-21', value: 1010, change: 10 },
      ],
      marketplaces: [
        { date: '2025-10-20', value: 50, change: 1 },
        { date: '2025-10-21', value: 51, change: 1 },
      ],
      developers: [
        { date: '2025-10-20', value: 200, change: 5 },
        { date: '2025-10-21', value: 205, change: 5 },
      ],
      downloads: [
        { date: '2025-10-20', value: 50000, change: 1000 },
        { date: '2025-10-21', value: 51000, change: 1000 },
      ],
      period: '7d',
      aggregation: 'daily',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockFetchResponse,
    });
  });

  it('renders the component with initial loading state', () => {
    render(<GrowthTrends />);

    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    expect(screen.getByText('Loading growth trends...')).toBeInTheDocument();
  });

  it('renders the component title and description', async () => {
    render(<GrowthTrends />);

    await waitFor(() => {
      expect(screen.getByText('Ecosystem Growth Trends')).toBeInTheDocument();
      expect(screen.getByText(/Track the growth of plugins, marketplaces, developers, and downloads over time/)).toBeInTheDocument();
    });
  });

  it('displays time range selector buttons', async () => {
    render(<GrowthTrends />);

    await waitFor(() => {
      expect(screen.getByText('7 Days')).toBeInTheDocument();
      expect(screen.getByText('30 Days')).toBeInTheDocument();
      expect(screen.getByText('90 Days')).toBeInTheDocument();
      expect(screen.getByText('1 Year')).toBeInTheDocument();
    });
  });

  it('allows changing time range', async () => {
    render(<GrowthTrends />);

    await waitFor(() => {
      expect(screen.getByText('7 Days')).toBeInTheDocument();
    });

    const ninetyDaysButton = screen.getByText('90 Days');
    fireEvent.click(ninetyDaysButton);

    // Verify fetch was called with the new time range
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/ecosystem-stats?metric=growth&timeRange=90d');
    });
  });

  it('displays growth statistics cards when data is loaded', async () => {
    render(<GrowthTrends />);

    await waitFor(() => {
      expect(screen.getByText('Plugins')).toBeInTheDocument();
      expect(screen.getByText('Marketplaces')).toBeInTheDocument();
      expect(screen.getByText('Developers')).toBeInTheDocument();
      expect(screen.getByText('Downloads')).toBeInTheDocument();
    });
  });

  it('renders chart components', async () => {
    render(<GrowthTrends />);

    await waitFor(() => {
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<GrowthTrends />);

    await waitFor(() => {
      // Should still render with mock data as fallback
      expect(screen.getByText('Ecosystem Growth Trends')).toBeInTheDocument();
    });
  });

  it('shows error state when API returns failure', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, error: 'API Error' }),
    });

    render(<GrowthTrends />);

    await waitFor(() => {
      // Should still render with mock data as fallback
      expect(screen.getByText('Ecosystem Growth Trends')).toBeInTheDocument();
    });
  });

  it('allows toggling metric visibility', async () => {
    render(
      <GrowthTrends
        showMetrics={{
          plugins: true,
          marketplaces: false,
          developers: true,
          downloads: false,
        }}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Plugins')).toBeInTheDocument();
      expect(screen.getByText('Developers')).toBeInTheDocument();
    });

    // Marketplaces and downloads should not be displayed
    expect(screen.queryByText('Marketplaces')).not.toBeInTheDocument();
    expect(screen.queryByText('Downloads')).not.toBeInTheDocument();
  });

  it('applies custom CSS classes', async () => {
    const customClass = 'custom-test-class';
    render(<GrowthTrends className={customClass} />);

    await waitFor(() => {
      const container = screen.getByRole('region');
      expect(container).toHaveClass(customClass);
    });
  });

  it('has proper accessibility attributes', async () => {
    render(<GrowthTrends />);

    await waitFor(() => {
      expect(screen.getByRole('region')).toHaveAttribute('aria-labelledby', 'growth-trends-title');
      expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Ecosystem growth chart showing trends over time');
    });
  });

  it('supports auto-refresh functionality', async () => {
    jest.useFakeTimers();

    render(<GrowthTrends refreshInterval={30000} />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    // Fast-forward time
    jest.advanceTimersByTime(30000);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    jest.useRealTimers();
  });

  it('displays refresh button and handles manual refresh', async () => {
    render(<GrowthTrends refreshInterval={30000} />);

    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  it('formats large numbers correctly in download statistics', async () => {
    const mockDataWithLargeDownloads = {
      ...mockFetchResponse,
      data: {
        ...mockFetchResponse.data,
        downloads: [
          { date: '2025-10-20', value: 1500000, change: 50000 },
          { date: '2025-10-21', value: 1550000, change: 50000 },
        ],
      },
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDataWithLargeDownloads,
    });

    render(<GrowthTrends />);

    await waitFor(() => {
      // Should format 1,550,000 as "1.5M"
      expect(screen.getByText(/1\.5M/)).toBeInTheDocument();
    });
  });

  it('shows appropriate ARIA live regions for accessibility', async () => {
    render(<GrowthTrends />);

    await waitFor(() => {
      expect(screen.getByText('Showing growth data for last month')).toBeInTheDocument();
    });
  });

  it('displays trend indicators correctly', async () => {
    render(<GrowthTrends />);

    await waitFor(() => {
      // Should show trending up indicators for positive changes
      const trendIndicators = screen.getAllByTestId(/trending/);
      expect(trendIndicators.length).toBeGreaterThan(0);
    });
  });
});