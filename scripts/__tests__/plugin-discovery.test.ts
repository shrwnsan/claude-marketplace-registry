/**
 * Plugin Discovery Tests
 *
 * Tests for plugin discovery logic focusing on:
 * - ID generation uniqueness
 * - Plugin entry processing
 * - Error handling
 */

import { Octokit } from '@octokit/rest';
import { PluginDiscovery, MarketplaceInfo, modsCountFromHooksJson } from '../plugin-discovery';

describe('PluginDiscovery', () => {
  let discovery: PluginDiscovery;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockOctokit: any;

  const mockMarketplace: MarketplaceInfo = {
    owner: 'test-owner',
    repo: 'test-repo',
    id: 'test-marketplace',
    name: 'Test Marketplace',
    url: 'https://github.com/test-owner/test-repo',
    manifest: {},
  };

  beforeEach(() => {
    mockOctokit = {
      repos: {
        getContent: jest.fn(),
      },
    };
    discovery = new PluginDiscovery(mockOctokit as Octokit);
  });

  describe('processPluginEntry - ID Generation', () => {
    it('should generate ID from external repository', async () => {
      const pluginEntry = {
        name: 'Test Plugin',
        repository: 'external/repo',
      };

      mockOctokit.repos.getContent.mockResolvedValue({
        data: {
          content: Buffer.from(JSON.stringify({ name: 'Test Plugin' })).toString('base64'),
        },
      });

      // Access private method via type assertion
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (discovery as any).processPluginEntry(pluginEntry, mockMarketplace);

      expect(result.id).toBe('external-repo');
    });

    it('should generate ID from internal path', async () => {
      const pluginEntry = {
        name: 'Test Plugin',
        path: 'plugins/my-plugin',
      };

      mockOctokit.repos.getContent.mockResolvedValue({
        data: {
          content: Buffer.from(JSON.stringify({ name: 'Test Plugin' })).toString('base64'),
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (discovery as any).processPluginEntry(pluginEntry, mockMarketplace);

      expect(result.id).toBe('test-marketplace-plugins-my-plugin');
    });

    it('should generate unique ID when both repo and path are empty (single-plugin repo)', async () => {
      const pluginEntry = {
        name: 'Single Plugin',
      };

      mockOctokit.repos.getContent.mockResolvedValue({
        data: {
          content: Buffer.from(JSON.stringify({ name: 'Single Plugin' })).toString('base64'),
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (discovery as any).processPluginEntry(pluginEntry, mockMarketplace);

      // Should use plugin name as fallback, not just marketplace.id + "-"
      expect(result.id).toBe('test-marketplace-single-plugin');
      expect(result.id).not.toBe('test-marketplace-');
    });

    it('should handle special characters in plugin name for ID', async () => {
      const pluginEntry = {
        name: 'My Cool Plugin!',
      };

      mockOctokit.repos.getContent.mockResolvedValue({
        data: {
          content: Buffer.from(JSON.stringify({ name: 'My Cool Plugin!' })).toString('base64'),
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (discovery as any).processPluginEntry(pluginEntry, mockMarketplace);

      expect(result.id).toBe('test-marketplace-my-cool-plugin');
      expect(result.id).toMatch(/^[a-z0-9-]+$/);
    });
  });

  describe('processPluginEntry - mods detection', () => {
    const manifestResponse = {
      data: { content: Buffer.from(JSON.stringify({ name: 'Patched' })).toString('base64') },
    };

    it('counts hook modules when hooks.json declares a modules array', async () => {
      const pluginEntry: any = { name: 'Patched', path: 'plugins/token-weather' };
      mockOctokit.repos.getContent.mockResolvedValueOnce(manifestResponse).mockResolvedValueOnce({
        data: {
          content: Buffer.from(
            JSON.stringify({ modules: ['./weather.mjs', './spend.mjs'] })
          ).toString('base64'),
        },
      });

      const result = await (discovery as any).processPluginEntry(pluginEntry, mockMarketplace);

      expect(result.isValid).toBe(true);
      expect(result.modsCount).toBe(2);
      // The count is stamped on the source manifest entry so it rides
      // data/marketplaces/raw.json into generate-data.
      expect(pluginEntry.modsCount).toBe(2);
    });

    it('reports 0 for a legacy hooks.json without a modules array', async () => {
      const pluginEntry = { name: 'Patched' };
      mockOctokit.repos.getContent.mockResolvedValueOnce(manifestResponse).mockResolvedValueOnce({
        data: {
          content: Buffer.from(JSON.stringify({ hooks: { PreToolUse: [] } })).toString('base64'),
        },
      });

      const result = await (discovery as any).processPluginEntry(pluginEntry, mockMarketplace);

      expect(result.modsCount).toBe(0);
    });

    it('reports 0 and stays valid when hooks.json is absent', async () => {
      const pluginEntry = { name: 'Patched' };
      mockOctokit.repos.getContent
        .mockResolvedValueOnce(manifestResponse)
        .mockRejectedValueOnce({ status: 404 });

      const result = await (discovery as any).processPluginEntry(pluginEntry, mockMarketplace);

      expect(result.isValid).toBe(true);
      expect(result.modsCount).toBe(0);
    });
  });

  describe('modsCountFromHooksJson', () => {
    it('counts a modules array', () => {
      expect(modsCountFromHooksJson('{"modules":["./a.mjs"]}')).toBe(1);
      expect(modsCountFromHooksJson('{"modules":["./a.mjs","./b.mjs"]}')).toBe(2);
    });

    it('counts 0 for legacy configs, missing keys, and malformed JSON', () => {
      expect(modsCountFromHooksJson('{"hooks":{"PreToolUse":[]}}')).toBe(0);
      expect(modsCountFromHooksJson('{"modules":"./a.mjs"}')).toBe(0);
      expect(modsCountFromHooksJson('not json')).toBe(0);
      expect(modsCountFromHooksJson('')).toBe(0);
      expect(modsCountFromHooksJson(null)).toBe(0);
      expect(modsCountFromHooksJson(undefined)).toBe(0);
    });
  });
});
