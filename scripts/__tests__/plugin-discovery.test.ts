/**
 * Plugin Discovery Tests
 *
 * Tests for plugin discovery logic focusing on:
 * - ID generation uniqueness
 * - Plugin entry processing
 * - Error handling
 */

import { Octokit } from '@octokit/rest';
import { PluginDiscovery, MarketplaceInfo } from '../plugin-discovery';

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
});
