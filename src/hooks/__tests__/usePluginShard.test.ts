/**
 * usePluginShard Hook Tests
 *
 * The hook loads public/data/plugins/<marketplaceId>.json. A 404 is the
 * expected shape for a marketplace with zero discovered plugins (the pipeline
 * only writes shards for marketplaces that have plugins) — it must settle to
 * an empty list without surfacing an error. Other failures surface an error.
 */

import { renderHook } from '@testing-library/react';
import { waitFor } from '@testing-library/dom';
import { usePluginShard } from '../usePluginShard';

// Mock fetch globally
global.fetch = jest.fn();

// Silence the hook's expected console.error on failure paths
jest.spyOn(console, 'error').mockImplementation(() => {});

const shardRecord = {
  id: 'skill-architect',
  name: 'Skill Architect',
  description: 'Designs skills',
  version: '1.2.0',
  author: 'octocat',
  repository: 'https://github.com/octocat/repo',
  marketplaceId: '1248604994',
  marketplaceName: 'easel-js-cpu-render-kit',
  metadata: { skills: ['design', 'review'], marketplaceId: '1248604994' },
};

describe('usePluginShard Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it('settles empty without error on 404 — marketplace with zero plugins', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 404 });

    const { result } = renderHook(() => usePluginShard('1248604994'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.plugins).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('fetches the marketplace shard at the base path', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [shardRecord],
    });

    renderHook(() => usePluginShard('1248604994'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/data/plugins/1248604994.json')
    );
  });

  it('maps full shard records through toCatalogPlugin', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [shardRecord],
    });

    const { result } = renderHook(() => usePluginShard('1248604994'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.plugins).toHaveLength(1);
    const plugin = result.current.plugins[0];
    expect(plugin.id).toBe('skill-architect');
    expect(plugin.skills).toEqual(['design', 'review']);
    expect(plugin.skillsCount).toBe(2);
    expect(plugin.marketplaceId).toBe('1248604994');
    expect(plugin.repositoryUrl).toBe('https://github.com/octocat/repo');
  });

  it('handles an empty-array shard payload', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    const { result } = renderHook(() => usePluginShard('1248604994'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.plugins).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('surfaces an error on a non-404 failure status', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500 });

    const { result } = renderHook(() => usePluginShard('1248604994'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load plugin data');
    expect(result.current.plugins).toEqual([]);
  });

  it('surfaces an error on a network failure', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => usePluginShard('1248604994'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load plugin data');
  });

  it('settles empty without fetching when no marketplace id is given', () => {
    const { result } = renderHook(() => usePluginShard(undefined));

    expect(result.current.plugins).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('refetches when the marketplace id resolves from undefined', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [shardRecord],
    });

    // Static export mounts detail pages with router.query undefined before
    // hydration resolves the id — the hook must pick it up.
    const { result, rerender } = renderHook(
      ({ id }: { id: string | undefined }) => usePluginShard(id),
      { initialProps: { id: undefined as string | undefined } }
    );

    expect(global.fetch).not.toHaveBeenCalled();

    rerender({ id: '1248604994' });

    await waitFor(() => {
      expect(result.current.plugins).toHaveLength(1);
    });
    expect(result.current.error).toBeNull();
  });
});
