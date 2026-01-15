/**
 * useRealMarketplaceData Hook Tests
 *
 * Tests for the useRealMarketplaceData hook, focusing on:
 * - Data fetching behavior
 * - Loading states
 * - Error handling
 * - Fallback to mock data
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useRealMarketplaceData } from '../useRealMarketplaceData';
import { mockMarketplaces } from '@/data/mock-data';

// Mock fetch globally
global.fetch = jest.fn();

describe('useRealMarketplaceData Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Data Fetching', () => {
    it('should return initial loading state', () => {
      (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => useRealMarketplaceData());

      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should load real data successfully', async () => {
      const mockRealData = {
        marketplaces: [
          { id: '1', name: 'Real Marketplace', description: 'Real data' },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockRealData,
      });

      const { result } = renderHook(() => useRealMarketplaceData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.marketplaces).toEqual(mockRealData.marketplaces);
      expect(result.current.data?.totalCount).toBe(1);
      expect(result.current.error).toBeNull();
    });

    it('should fallback to mock data on fetch error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useRealMarketplaceData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.marketplaces).toEqual(mockMarketplaces);
      expect(result.current.data?.totalCount).toBe(mockMarketplaces.length);
      expect(result.current.error).toBe('Failed to load marketplace data');
    });

    it('should fallback to mock data when response is not ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
      });

      const { result } = renderHook(() => useRealMarketplaceData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.marketplaces).toEqual(mockMarketplaces);
      expect(result.current.data?.totalCount).toBe(mockMarketplaces.length);
      expect(result.current.error).toBeNull(); // No error set when using fallback
    });

    it('should handle empty marketplaces array', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ marketplaces: [] }),
      });

      const { result } = renderHook(() => useRealMarketplaceData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data?.marketplaces).toEqual([]);
      expect(result.current.data?.totalCount).toBe(0);
    });

    it('should handle malformed json response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ invalid: 'data' }),
      });

      const { result } = renderHook(() => useRealMarketplaceData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should use empty array as default for marketplaces
      expect(result.current.data?.marketplaces).toEqual([]);
    });
  });

  describe('Error States', () => {
    it('should set error message on fetch failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useRealMarketplaceData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load marketplace data');
      expect(result.current.data).toBeDefined(); // Should still have mock data
    });

    it('should handle different error types', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('CORS error'));

      const { result } = renderHook(() => useRealMarketplaceData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load marketplace data');
    });
  });

  describe('Data Structure', () => {
    it('should return data with correct structure', async () => {
      const mockRealData = {
        marketplaces: [{ id: '1', name: 'Test' }],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockRealData,
      });

      const { result } = renderHook(() => useRealMarketplaceData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toMatchObject({
        marketplaces: expect.any(Array),
        lastUpdated: expect.any(String),
        totalCount: expect.any(Number),
      });
    });

    it('should include lastUpdated timestamp', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ marketplaces: [] }),
      });

      const { result } = renderHook(() => useRealMarketplaceData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data?.lastUpdated).toBeDefined();
      expect(new Date(result.current.data!.lastUpdated)).toBeInstanceOf(Date);
    });
  });

  describe('Loading State Transitions', () => {
    it('should transition from loading to loaded', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ marketplaces: [] }),
      });

      const { result } = renderHook(() => useRealMarketplaceData());

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should transition from loading to error state', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useRealMarketplaceData());

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).not.toBeNull();
      });
    });
  });
});
