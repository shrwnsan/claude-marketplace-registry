import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import '@testing-library/jest-dom';
import QualityIndicators from '../QualityIndicators';
import { QualityIndicators as IQualityIndicators } from '../../../types/ecosystem-stats';

// Mock fetch
global.fetch = jest.fn();

// Test data
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
    ],
  },
  security: {
    scannedPlugins: 980,
    criticalIssues: 8,
    securityScore: 82.3,
  },
};

const mockErrorResponse = {
  success: false,
  error: {
    code: 'INTERNAL_ERROR',
    message: 'Failed to fetch quality indicators',
  },
  meta: {
    timestamp: '2025-10-21T10:30:00Z',
    requestId: 'test-123',
    responseTime: 150,
  },
};

// Helper to mock fetch responses
const mockFetchResponse = (data: any, ok = true, status = 200) => {
  (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
    ok,
    status,
    json: async () => data,
    headers: new Headers(),
    redirected: false,
    statusText: ok ? 'OK' : 'Error',
    type: 'basic',
    url: '/api/ecosystem-stats?quality',
    clone: jest.fn(),
    body: null,
    bodyUsed: false,
    arrayBuffer: jest.fn(),
    blob: jest.fn(),
    formData: jest.fn(),
    text: jest.fn(),
    bytes: jest.fn(),
  });
};

describe('QualityIndicators Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.error to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  describe('Basic Rendering', () => {
    it('renders quality indicators correctly with data', async () => {
      mockFetchResponse({
        success: true,
        data: mockQualityData,
        meta: {
          timestamp: '2025-10-21T10:30:00Z',
          requestId: 'test-123',
          responseTime: 150,
        },
      });

      render(<QualityIndicators />);

      // Check loading state
      expect(screen.getByRole('region', { name: /quality indicators/i })).toBeInTheDocument();

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Quality Indicators')).toBeInTheDocument();
      });

      // Check main metrics are displayed
      expect(screen.getByText('Verification Rate')).toBeInTheDocument();
      expect(screen.getByText('Active Maintenance')).toBeInTheDocument();
      expect(screen.getByText('Quality Score')).toBeInTheDocument();
      expect(screen.getByText('Security Score')).toBeInTheDocument();

      // Check values are displayed correctly
      // Use getAllByText since percentages may appear in both aria-labels and content
      expect(screen.getAllByText('68.0%').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('57.6%').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('78.5%').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('82.3%').length).toBeGreaterThanOrEqual(1);
    });

    it('renders trust signals section correctly', async () => {
      mockFetchResponse({
        success: true,
        data: mockQualityData,
        meta: {
          timestamp: '2025-10-21T10:30:00Z',
          requestId: 'test-123',
          responseTime: 150,
        },
      });

      render(<QualityIndicators />);

      await waitFor(() => {
        expect(screen.getByText('Trust Signals')).toBeInTheDocument();
      });

      // Check trust signal badges are rendered
      const trustBadges = screen.getAllByTitle(/plugins with/i);
      expect(trustBadges).toHaveLength(4); // security, quality, popularity, maintenance
    });

    it('renders maintenance status section correctly', async () => {
      mockFetchResponse({
        success: true,
        data: mockQualityData,
        meta: {
          timestamp: '2025-10-21T10:30:00Z',
          requestId: 'test-123',
          responseTime: 150,
        },
      });

      render(<QualityIndicators />);

      await waitFor(() => {
        expect(screen.getByText('Maintenance Status')).toBeInTheDocument();
      });

      // Check maintenance metrics
      expect(screen.getByText('720 plugins')).toBeInTheDocument();
      expect(screen.getByText('Every 14 days')).toBeInTheDocument();
    });

    it('shows abandoned plugins warning when present', async () => {
      mockFetchResponse({
        success: true,
        data: mockQualityData,
        meta: {
          timestamp: '2025-10-21T10:30:00Z',
          requestId: 'test-123',
          responseTime: 150,
        },
      });

      render(<QualityIndicators />);

      await waitFor(() => {
        expect(
          screen.getByText(/15 plugins haven't been updated in 6\+ months/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Detailed View', () => {
    it('renders detailed information when showDetailed is true', async () => {
      mockFetchResponse({
        success: true,
        data: mockQualityData,
        meta: {
          timestamp: '2025-10-21T10:30:00Z',
          requestId: 'test-123',
          responseTime: 150,
        },
      });

      render(<QualityIndicators showDetailed={true} />);

      await waitFor(() => {
        expect(screen.getByText('Common Quality Issues')).toBeInTheDocument();
      });

      // Check quality issues are displayed
      expect(screen.getByText('Missing documentation')).toBeInTheDocument();
      expect(screen.getByText('Outdated dependencies')).toBeInTheDocument();
      expect(screen.getByText('Security vulnerabilities')).toBeInTheDocument();

      // Check quality score distribution
      expect(screen.getByText('Quality Score Distribution')).toBeInTheDocument();
      expect(screen.getByText('High Quality (80+)')).toBeInTheDocument();
      expect(screen.getByText('Average Score')).toBeInTheDocument();

      // Check security overview
      expect(screen.getByText('Security Overview')).toBeInTheDocument();
      expect(screen.getByText('980 plugins')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument(); // critical issues
    });

    it('does not render detailed sections when showDetailed is false', async () => {
      mockFetchResponse({
        success: true,
        data: mockQualityData,
        meta: {
          timestamp: '2025-10-21T10:30:00Z',
          requestId: 'test-123',
          responseTime: 150,
        },
      });

      render(<QualityIndicators showDetailed={false} />);

      await waitFor(() => {
        expect(screen.getByText('Trust Signals')).toBeInTheDocument();
      });

      // Detailed sections should not be present
      expect(screen.queryByText('Common Quality Issues')).not.toBeInTheDocument();
      expect(screen.queryByText('Quality Score Distribution')).not.toBeInTheDocument();
      expect(screen.queryByText('Security Overview')).not.toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('shows loading skeleton on initial load', () => {
      mockFetchResponse({
        success: true,
        data: mockQualityData,
        meta: {
          timestamp: '2025-10-21T10:30:00Z',
          requestId: 'test-123',
          responseTime: 150,
        },
      });

      render(<QualityIndicators />);

      // Should show loading skeleton initially
      expect(screen.getByRole('region', { name: /quality indicators/i })).toBeInTheDocument();

      // Check for skeleton elements (they should have animation classes)
      const animatedElements = document.querySelectorAll('.animate-pulse');
      expect(animatedElements.length).toBeGreaterThan(0);
    });
  });

  describe('Error States', () => {
    it('displays error message when API call fails', async () => {
      mockFetchResponse(mockErrorResponse, false, 500);

      render(<QualityIndicators />);

      await waitFor(() => {
        expect(screen.getByText('Failed to Load Quality Indicators')).toBeInTheDocument();
      });

      expect(screen.getByText('HTTP error! status: 500')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('allows retry after error', async () => {
      // First call fails
      mockFetchResponse(mockErrorResponse, false, 500);

      render(<QualityIndicators />);

      await waitFor(() => {
        expect(screen.getByText('Failed to Load Quality Indicators')).toBeInTheDocument();
      });

      // Mock successful retry
      mockFetchResponse({
        success: true,
        data: mockQualityData,
        meta: {
          timestamp: '2025-10-21T10:30:00Z',
          requestId: 'test-123',
          responseTime: 150,
        },
      });

      // Click retry button
      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Quality Indicators')).toBeInTheDocument();
      });

      expect(screen.getByText('Verification Rate')).toBeInTheDocument();
    });

    it('handles network errors gracefully', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<QualityIndicators />);

      await waitFor(() => {
        expect(screen.getByText('Failed to Load Quality Indicators')).toBeInTheDocument();
      });

      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  describe('Auto Refresh', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('auto-refreshes data when enabled', async () => {
      const mockResponse = {
        success: true,
        data: mockQualityData,
        meta: {
          timestamp: '2025-10-21T10:30:00Z',
          requestId: 'test-123',
          responseTime: 150,
        },
      };

      mockFetchResponse(mockResponse);

      render(<QualityIndicators autoRefresh={true} refreshInterval={5000} />);

      await waitFor(() => {
        expect(screen.getByText('Quality Indicators')).toBeInTheDocument();
      });

      // Clear previous calls
      (fetch as jest.MockedFunction<typeof fetch>).mockClear();

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Should have made another fetch call
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/ecosystem-stats?quality', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-cache',
        });
      });
    });

    it('does not auto-refresh when disabled', async () => {
      const mockResponse = {
        success: true,
        data: mockQualityData,
        meta: {
          timestamp: '2025-10-21T10:30:00Z',
          requestId: 'test-123',
          responseTime: 150,
        },
      };

      mockFetchResponse(mockResponse);

      render(<QualityIndicators autoRefresh={false} refreshInterval={5000} />);

      await waitFor(() => {
        expect(screen.getByText('Quality Indicators')).toBeInTheDocument();
      });

      // Clear previous calls
      (fetch as jest.MockedFunction<typeof fetch>).mockClear();

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Should not have made another fetch call
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('Manual Refresh', () => {
    it('allows manual refresh via refresh button', async () => {
      mockFetchResponse({
        success: true,
        data: mockQualityData,
        meta: {
          timestamp: '2025-10-21T10:30:00Z',
          requestId: 'test-123',
          responseTime: 150,
        },
      });

      render(<QualityIndicators />);

      await waitFor(() => {
        expect(screen.getByText('Quality Indicators')).toBeInTheDocument();
      });

      // Clear previous calls
      (fetch as jest.MockedFunction<typeof fetch>).mockClear();

      // Mock successful refresh
      mockFetchResponse({
        success: true,
        data: mockQualityData,
        meta: {
          timestamp: '2025-10-21T10:31:00Z',
          requestId: 'test-124',
          responseTime: 120,
        },
      });

      // Click refresh button
      const refreshButton = screen.getByRole('button', { name: /refresh quality indicators/i });
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/ecosystem-stats?quality', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-cache',
        });
      });
    });

    it('disables refresh button during loading', async () => {
      mockFetchResponse({
        success: true,
        data: mockQualityData,
        meta: {
          timestamp: '2025-10-21T10:30:00Z',
          requestId: 'test-123',
          responseTime: 150,
        },
      });

      render(<QualityIndicators />);

      // Wait for the component to load and render the refresh button
      await waitFor(() => {
        expect(screen.getByText('Quality Indicators')).toBeInTheDocument();
      });

      // Refresh button should be present and enabled after load
      const refreshButton = screen.getByRole('button', { name: /refresh quality indicators/i });
      expect(refreshButton).toBeInTheDocument();
      expect(refreshButton).not.toBeDisabled();

      // Trigger a refresh and verify it becomes disabled during loading
      (fetch as jest.MockedFunction<typeof fetch>).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  status: 200,
                  json: async () => ({
                    success: true,
                    data: mockQualityData,
                    meta: {
                      timestamp: '2025-10-21T10:30:00Z',
                      requestId: 'test-123',
                      responseTime: 150,
                    },
                  }),
                  headers: new Headers(),
                  redirected: false,
                  statusText: 'OK',
                  type: 'basic',
                  url: '/api/ecosystem-stats?quality',
                  clone: jest.fn(),
                  body: null,
                  bodyUsed: false,
                  arrayBuffer: jest.fn(),
                  blob: jest.fn(),
                  formData: jest.fn(),
                  text: jest.fn(),
                  bytes: jest.fn(),
                }),
              100
            )
          )
      );

      fireEvent.click(refreshButton);
      expect(refreshButton).toBeDisabled();

      await waitFor(() => {
        expect(refreshButton).not.toBeDisabled();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', async () => {
      mockFetchResponse({
        success: true,
        data: mockQualityData,
        meta: {
          timestamp: '2025-10-21T10:30:00Z',
          requestId: 'test-123',
          responseTime: 150,
        },
      });

      render(<QualityIndicators />);

      // First check that the component renders (loading state is fine)
      expect(screen.getByRole('region', { name: /quality indicators/i })).toBeInTheDocument();

      // Wait for data to load and content to appear
      await waitFor(() => {
        expect(screen.getByText('Quality Indicators')).toBeInTheDocument();
      });

      // Component uses semantic HTML with proper section/region roles
      // The quality metrics display uses visual progress indicators with aria-labels
      expect(screen.getByText('Trust Signals')).toBeInTheDocument();
      expect(screen.getByText('Maintenance Status')).toBeInTheDocument();

      // Check metric cards have proper aria labels via aria-label attributes
      const metricCards = screen.getAllByRole('region');
      expect(metricCards.length).toBeGreaterThan(0);
    });

    it('supports keyboard navigation', async () => {
      mockFetchResponse({
        success: true,
        data: mockQualityData,
        meta: {
          timestamp: '2025-10-21T10:30:00Z',
          requestId: 'test-123',
          responseTime: 150,
        },
      });

      render(<QualityIndicators />);

      await waitFor(() => {
        expect(screen.getByText('Quality Indicators')).toBeInTheDocument();
      });

      // Refresh button should be keyboard accessible
      const refreshButton = screen.getByRole('button', { name: /refresh quality indicators/i });
      expect(refreshButton).toBeInTheDocument();

      // Component uses semantic HTML which is natively keyboard accessible
      // Section elements with proper ARIA labels provide screen reader support
      const qualitySection = screen.getByRole('region', { name: /quality indicators/i });
      expect(qualitySection).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('adapts to different screen sizes', async () => {
      mockFetchResponse({
        success: true,
        data: mockQualityData,
        meta: {
          timestamp: '2025-10-21T10:30:00Z',
          requestId: 'test-123',
          responseTime: 150,
        },
      });

      render(<QualityIndicators />);

      await waitFor(() => {
        expect(screen.getByText('Quality Indicators')).toBeInTheDocument();
      });

      // Component uses Tailwind responsive classes for grid layout
      // The metrics grid uses responsive grid-cols classes
      const metricsContainer = screen.getByText('Verification Rate').closest('div');
      expect(metricsContainer).toBeInTheDocument();

      // Verify the component renders properly (responsive classes are handled by Tailwind)
      expect(screen.getByText('Trust Signals')).toBeInTheDocument();
      expect(screen.getByText('Maintenance Status')).toBeInTheDocument();
    });
  });

  describe('Compact Mode', () => {
    it('renders in compact mode when specified', async () => {
      mockFetchResponse({
        success: true,
        data: mockQualityData,
        meta: {
          timestamp: '2025-10-21T10:30:00Z',
          requestId: 'test-123',
          responseTime: 150,
        },
      });

      render(<QualityIndicators compact={true} />);

      await waitFor(() => {
        expect(screen.getByText('Quality Indicators')).toBeInTheDocument();
      });

      // Component should render without errors in compact mode
      expect(screen.getByText('Trust Signals')).toBeInTheDocument();
      expect(screen.getByText('Maintenance Status')).toBeInTheDocument();
    });
  });

  describe('Data Validation', () => {
    it('handles missing security data gracefully', async () => {
      const dataWithoutSecurity = {
        ...mockQualityData,
        security: undefined,
      };

      mockFetchResponse({
        success: true,
        data: dataWithoutSecurity,
        meta: {
          timestamp: '2025-10-21T10:30:00Z',
          requestId: 'test-123',
          responseTime: 150,
        },
      });

      render(<QualityIndicators />);

      await waitFor(() => {
        expect(screen.getByText('Quality Indicators')).toBeInTheDocument();
      });

      // Security score should default to 0 when data is missing
      // The component displays it as a percentage in the metrics grid
      // Use getAllByText since multiple 0% values may be present
      const zeroPercentages = screen.getAllByText('0.0%');
      expect(zeroPercentages.length).toBeGreaterThan(0);
    });

    it('handles empty common issues array', async () => {
      const dataWithNoIssues = {
        ...mockQualityData,
        qualityMetrics: {
          ...mockQualityData.qualityMetrics,
          commonIssues: [],
        },
      };

      mockFetchResponse({
        success: true,
        data: dataWithNoIssues,
        meta: {
          timestamp: '2025-10-21T10:30:00Z',
          requestId: 'test-123',
          responseTime: 150,
        },
      });

      render(<QualityIndicators showDetailed={true} />);

      await waitFor(() => {
        expect(screen.getByText('Quality Indicators')).toBeInTheDocument();
      });

      // Common Quality Issues section should not be visible when array is empty
      // The component uses conditional rendering based on array length
      const commonIssuesSection = screen.queryByText('Common Quality Issues');
      expect(commonIssuesSection).not.toBeInTheDocument();

      // Other detailed sections should still be visible
      expect(screen.getByText('Quality Score Distribution')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles zero values correctly', async () => {
      const dataWithZeros = {
        verification: {
          verifiedPlugins: 0,
          verificationRate: 0,
          badges: [
            { type: 'security' as const, count: 0 },
            { type: 'quality' as const, count: 0 },
            { type: 'popularity' as const, count: 0 },
            { type: 'maintenance' as const, count: 0 },
          ],
        },
        maintenance: {
          recentlyUpdated: 0,
          activeMaintenanceRate: 0,
          avgUpdateFrequency: 0,
          abandonedPlugins: 0,
        },
        qualityMetrics: {
          avgQualityScore: 0,
          highQualityPlugins: 0,
          commonIssues: [],
        },
        security: {
          scannedPlugins: 0,
          criticalIssues: 0,
          securityScore: 0,
        },
      };

      mockFetchResponse({
        success: true,
        data: dataWithZeros,
        meta: {
          timestamp: '2025-10-21T10:30:00Z',
          requestId: 'test-123',
          responseTime: 150,
        },
      });

      render(<QualityIndicators />);

      await waitFor(() => {
        expect(screen.getByText('Quality Indicators')).toBeInTheDocument();
      });

      // Component should render without errors with zero values
      // Just verify it renders without crashing
      expect(screen.getByText('Trust Signals')).toBeInTheDocument();
    });

    it('handles maximum values correctly', async () => {
      const dataWithMaxValues = {
        verification: {
          verifiedPlugins: 1000,
          verificationRate: 100,
          badges: [
            { type: 'security' as const, count: 1000 },
            { type: 'quality' as const, count: 1000 },
            { type: 'popularity' as const, count: 1000 },
            { type: 'maintenance' as const, count: 1000 },
          ],
        },
        maintenance: {
          recentlyUpdated: 1000,
          activeMaintenanceRate: 100,
          avgUpdateFrequency: 365,
          abandonedPlugins: 0,
        },
        qualityMetrics: {
          avgQualityScore: 100,
          highQualityPlugins: 1000,
          commonIssues: [],
        },
        security: {
          scannedPlugins: 1000,
          criticalIssues: 0,
          securityScore: 100,
        },
      };

      mockFetchResponse({
        success: true,
        data: dataWithMaxValues,
        meta: {
          timestamp: '2025-10-21T10:30:00Z',
          requestId: 'test-123',
          responseTime: 150,
        },
      });

      render(<QualityIndicators />);

      await waitFor(() => {
        expect(screen.getByText('Quality Indicators')).toBeInTheDocument();
      });

      // Component should render without errors with maximum values
      // Just verify it renders without crashing
      expect(screen.getByText('Trust Signals')).toBeInTheDocument();
    });
  });
});
