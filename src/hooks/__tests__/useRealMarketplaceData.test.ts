/**
 * useRealMarketplaceData Hook Tests
 *
 * The hook loads public/data/marketplaces.json (bare array, wrapped shape
 * tolerated). On failure it surfaces an error and an empty list — no mock data.
 */

import { renderHook } from '@testing-library/react';
import { waitFor } from '@testing-library/dom';
import { useRealMarketplaceData } from '../useRealMarketplaceData';

// Mock fetch globally
global.fetch = jest.fn();

describe('useRealMarketplaceData Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return initial loading state', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    const { result } = renderHook(() => useRealMarketplaceData());

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should load a bare-array payload (pipeline shape)', async () => {
    const payload = [
      { id: '1061953414', name: 'skills', stars: 176783, topics: ['claude-code'] },
      { id: '1078079172', name: 'awesome-claude-skills', stars: 75249, topics: ['skills'] },
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => payload,
    });

    const { result } = renderHook(() => useRealMarketplaceData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data?.marketplaces).toEqual(payload);
    expect(result.current.data?.totalCount).toBe(2);
    expect(result.current.data?.lastUpdated).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should tolerate a wrapped {marketplaces, lastUpdated} payload', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        marketplaces: [{ id: '1', name: 'Wrapped' }],
        lastUpdated: '2026-09-17T00:00:00.000Z',
      }),
    });

    const { result } = renderHook(() => useRealMarketplaceData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data?.totalCount).toBe(1);
    expect(result.current.data?.lastUpdated).toBe('2026-09-17T00:00:00.000Z');
  });

  it('should surface an error and an empty list on fetch failure — no mock fallback', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useRealMarketplaceData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load marketplace data');
    expect(result.current.data?.marketplaces).toEqual([]);
    expect(result.current.data?.totalCount).toBe(0);
  });

  it('should surface an error when the response is not ok', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
    });

    const { result } = renderHook(() => useRealMarketplaceData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load marketplace data');
    expect(result.current.data?.totalCount).toBe(0);
  });

  it('should fetch with the base path prefix', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    renderHook(() => useRealMarketplaceData());

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/data/marketplaces.json'));
  });
});
