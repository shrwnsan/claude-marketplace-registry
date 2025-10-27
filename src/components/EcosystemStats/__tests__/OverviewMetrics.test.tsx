import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import OverviewMetrics from '../OverviewMetrics';
import { EcosystemOverview } from '../../../types/ecosystem-stats';

// Mock fetch
global.fetch = jest.fn();

// Mock the API response
const mockEcosystemData: EcosystemOverview = {
  totalPlugins: 1250,
  totalMarketplaces: 15,
  totalDevelopers: 340,
  totalDownloads: 48200,
  lastUpdated: '2025-10-21T10:30:00Z',
  growthRate: {
    plugins: 15.2,
    marketplaces: 7.1,
    developers: 12.8,
    downloads: 23.4,
  },
  healthScore: 85,
};

const createMockResponse = (data: any, success = true) => ({
  ok: success,
  json: async () => ({
    success,
    data: success ? data : undefined,
    error: !success ? { message: 'API Error' } : undefined,
    meta: {
      timestamp: '2025-10-21T10:30:00Z',
      requestId: 'test-request-id',
      responseTime: 150,
    },
  }),
});

describe('OverviewMetrics Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<OverviewMetrics />);

    // Should show 4 skeleton cards
    const skeletonCards = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletonCards.length).toBeGreaterThan(0);

    // Should have proper ARIA label
    expect(screen.getByLabelText('Ecosystem Overview Metrics')).toBeInTheDocument();
  });

  it('renders metrics correctly when data is loaded', async () => {
    (fetch as jest.Mock).mockResolvedValue(createMockResponse(mockEcosystemData));

    render(<OverviewMetrics />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('1.3K')).toBeInTheDocument(); // Total Plugins (1250)
      expect(screen.getByText('15')).toBeInTheDocument(); // Total Marketplaces
      expect(screen.getByText('340')).toBeInTheDocument(); // Total Developers
      expect(screen.getByText('48.2K')).toBeInTheDocument(); // Total Downloads
    });

    // Check growth indicators
    await waitFor(() => {
      expect(screen.getByText('+15.2%')).toBeInTheDocument(); // Plugins growth
      expect(screen.getByText('+7.1%')).toBeInTheDocument(); // Marketplaces growth
      expect(screen.getByText('+12.8%')).toBeInTheDocument(); // Developers growth
      expect(screen.getByText('+23.4%')).toBeInTheDocument(); // Downloads growth
    });

    // Check metric labels
    expect(screen.getByText('Total Plugins')).toBeInTheDocument();
    expect(screen.getByText('Marketplaces')).toBeInTheDocument();
    expect(screen.getByText('Developers')).toBeInTheDocument();
    expect(screen.getByText('Total Downloads')).toBeInTheDocument();

    // Check health score
    expect(screen.getByText('Ecosystem Health Score')).toBeInTheDocument();
    expect(screen.getByText('85/100')).toBeInTheDocument();
  });

  it('displays error message when API call fails', async () => {
    (fetch as jest.Mock).mockResolvedValue(createMockResponse(null, false));

    render(<OverviewMetrics />);

    await waitFor(() => {
      expect(screen.getByText('Failed to Load Ecosystem Metrics')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    });
  });

  it('handles network errors gracefully', async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<OverviewMetrics />);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('allows manual refresh', async () => {
    (fetch as jest.Mock).mockResolvedValue(createMockResponse(mockEcosystemData));

    render(<OverviewMetrics />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('1.3K')).toBeInTheDocument();
    });

    // Clear the mock to track new calls
    (fetch as jest.Mock).mockClear();

    // Find and click refresh button
    const refreshButton = screen.getByLabelText('Refresh metrics');
    expect(refreshButton).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(refreshButton);
    });

    // Should trigger new API call
    expect(fetch).toHaveBeenCalledWith('/api/ecosystem-stats?overview', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-cache',
    });
  });

  it('formats large numbers correctly', async () => {
    const largeNumbersData: EcosystemOverview = {
      totalPlugins: 2500000, // 2.5M
      totalMarketplaces: 50,
      totalDevelopers: 150000, // 150K
      totalDownloads: 5000000000, // 5B
      lastUpdated: '2025-10-21T10:30:00Z',
      growthRate: {
        plugins: 25.5,
        marketplaces: 15.0,
        developers: 8.2,
        downloads: 45.7,
      },
    };

    (fetch as jest.Mock).mockResolvedValue(createMockResponse(largeNumbersData));

    render(<OverviewMetrics />);

    await waitFor(() => {
      expect(screen.getByText('2.5M')).toBeInTheDocument(); // Total Plugins
      expect(screen.getByText('50')).toBeInTheDocument(); // Total Marketplaces
      expect(screen.getByText('150K')).toBeInTheDocument(); // Total Developers
      expect(screen.getByText('5B')).toBeInTheDocument(); // Total Downloads
    });
  });

  it('displays negative growth correctly', async () => {
    const negativeGrowthData: EcosystemOverview = {
      totalPlugins: 1000,
      totalMarketplaces: 20,
      totalDevelopers: 300,
      totalDownloads: 40000,
      lastUpdated: '2025-10-21T10:30:00Z',
      growthRate: {
        plugins: -5.2,
        marketplaces: -2.1,
        developers: 0, // No change
        downloads: 1.5,
      },
    };

    (fetch as jest.Mock).mockResolvedValue(createMockResponse(negativeGrowthData));

    render(<OverviewMetrics />);

    await waitFor(() => {
      expect(screen.getByText('-5.2%')).toBeInTheDocument(); // Plugins decline
      expect(screen.getByText('-2.1%')).toBeInTheDocument(); // Marketplaces decline
      expect(screen.getByText('0%')).toBeInTheDocument(); // Developers no change
      expect(screen.getByText('+1.5%')).toBeInTheDocument(); // Downloads growth
    });
  });

  it('has proper accessibility attributes', async () => {
    (fetch as jest.Mock).mockResolvedValue(createMockResponse(mockEcosystemData));

    render(<OverviewMetrics />);

    await waitFor(() => {
      // Check ARIA labels
      expect(screen.getByLabelText('Ecosystem Overview Metrics')).toBeInTheDocument();

      // Check metric cards have proper ARIA labels
      expect(screen.getByLabelText(/Total plugins in ecosystem:/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Total marketplaces:/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Total developers:/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Total downloads:/)).toBeInTheDocument();

      // Check focus management - cards should be focusable (article elements within main)
      const metricCards = screen.getAllByRole('region').filter(element =>
        element.tagName === 'ARTICLE'
      );
      metricCards.forEach(card => {
        expect(card).toHaveAttribute('tabindex', '0');
      });

      // Check progress bar for health score
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '85');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });
  });

  it('shows last updated timestamp', async () => {
    (fetch as jest.Mock).mockResolvedValue(createMockResponse(mockEcosystemData));

    render(<OverviewMetrics />);

    await waitFor(() => {
      expect(screen.getByText(/Updated \d{1,2}\/\d{1,2}\/\d{4}/)).toBeInTheDocument();
    });
  });

  it('auto-refreshes when enabled', async () => {
    jest.useFakeTimers();

    (fetch as jest.Mock).mockResolvedValue(createMockResponse(mockEcosystemData));

    render(<OverviewMetrics autoRefresh={true} refreshInterval={5000} />);

    // Initial load
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    // Fast-forward 5 seconds
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // Should have made another API call
    expect(fetch).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });

  it('applies custom className correctly', async () => {
    (fetch as jest.Mock).mockResolvedValue(createMockResponse(mockEcosystemData));

    const { container } = render(<OverviewMetrics className="custom-class" />);

    await waitFor(() => {
      const section = container.querySelector('section.custom-class');
      expect(section).toBeInTheDocument();
    });
  });

  it('handles keyboard navigation', async () => {
    (fetch as jest.Mock).mockResolvedValue(createMockResponse(mockEcosystemData));

    render(<OverviewMetrics />);

    await waitFor(() => {
      // Find the first metric card (article element)
      const metricCards = screen.getAllByRole('region').filter(element =>
        element.tagName === 'ARTICLE'
      );
      const firstCard = metricCards[0];
      expect(firstCard).toHaveAttribute('tabindex', '0');

      // Check that card can receive focus by tabbing to it
      firstCard.focus();
      expect(document.activeElement).toBe(firstCard);
    });
  });
});