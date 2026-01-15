/**
 * GitHub Search Service Tests
 *
 * Tests for the GitHubSearchService class, focusing on:
 * - Configuration management
 * - Query building logic
 * - Error handling
 * - Rate limiting behavior
 * - Pagination calculation
 */

import { GitHubSearchService, GitHubSearchConfig } from '../github-search';
import { GitHubClient } from '@/utils/github-client';

// Mock the GitHubClient
jest.mock('@/utils/github-client');

describe('GitHubSearchService', () => {
  let service: GitHubSearchService;
  let mockClient: jest.Mocked<GitHubClient>;

  beforeEach(() => {
    // Create a mock GitHub client
    mockClient = {
      searchRepositories: jest.fn(),
    } as any;

    service = new GitHubSearchService(mockClient);
    jest.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should initialize with default configuration', () => {
      const config = service.getConfig();

      expect(config).toEqual({
        maxResultsPerPage: 100,
        maxTotalResults: 1000,
        defaultSort: 'updated',
        defaultOrder: 'desc',
        excludeForks: true,
        excludeArchived: true,
        minStars: 0,
      });
    });

    it('should accept custom configuration', () => {
      const customConfig: GitHubSearchConfig = {
        maxResultsPerPage: 50,
        minStars: 10,
        excludeForks: false,
      };

      const customService = new GitHubSearchService(mockClient, customConfig);
      const config = customService.getConfig();

      expect(config.maxResultsPerPage).toBe(50);
      expect(config.minStars).toBe(10);
      expect(config.excludeForks).toBe(false);
      // Other defaults should still apply
      expect(config.maxTotalResults).toBe(1000);
    });

    it('should allow updating configuration', () => {
      service.updateConfig({ minStars: 50, maxResultsPerPage: 25 });

      const config = service.getConfig();
      expect(config.minStars).toBe(50);
      expect(config.maxResultsPerPage).toBe(25);
    });
  });

  describe('Query Building', () => {
    it('should build basic search query', () => {
      // Since buildSearchQuery is private, we test it indirectly through search behavior
      // by checking what parameters are passed to the GitHub client

      mockClient.searchRepositories.mockResolvedValue({
        success: true,
        data: {
          total_count: 100,
          items: [],
          incomplete_results: false,
        },
      });

      service.searchMarketplaceRepositories({});

      expect(mockClient.searchRepositories).toHaveBeenCalledWith(
        expect.objectContaining({
          q: expect.stringContaining('filename:marketplace.json path:.claude-plugin'),
        })
      );
    });

    it('should add language filter to query', async () => {
      mockClient.searchRepositories.mockResolvedValue({
        success: true,
        data: { total_count: 100, items: [], incomplete_results: false },
      });

      await service.searchMarketplaceRepositories({ language: 'TypeScript' });

      expect(mockClient.searchRepositories).toHaveBeenCalledWith(
        expect.objectContaining({
          q: expect.stringContaining('language:TypeScript'),
        })
      );
    });

    it('should add stars range filter to query', async () => {
      mockClient.searchRepositories.mockResolvedValue({
        success: true,
        data: { total_count: 100, items: [], incomplete_results: false },
      });

      await service.searchMarketplaceRepositories({
        stars: { min: 10, max: 1000 },
      });

      const callArgs = mockClient.searchRepositories.mock.calls[0][0];
      expect(callArgs.q).toContain('stars:>=10');
      expect(callArgs.q).toContain('stars:<=1000');
    });

    it('should add topics filter to query', async () => {
      mockClient.searchRepositories.mockResolvedValue({
        success: true,
        data: { total_count: 100, items: [], incomplete_results: false },
      });

      await service.searchMarketplaceRepositories({
        topics: ['claude', 'ai'],
      });

      const callArgs = mockClient.searchRepositories.mock.calls[0][0];
      expect(callArgs.q).toContain('topic:claude');
      expect(callArgs.q).toContain('topic:ai');
    });

    it('should exclude forks by default', async () => {
      mockClient.searchRepositories.mockResolvedValue({
        success: true,
        data: { total_count: 100, items: [], incomplete_results: false },
      });

      await service.searchMarketplaceRepositories({});

      const callArgs = mockClient.searchRepositories.mock.calls[0][0];
      expect(callArgs.q).toContain('fork:false');
    });

    it('should exclude archived by default', async () => {
      mockClient.searchRepositories.mockResolvedValue({
        success: true,
        data: { total_count: 100, items: [], incomplete_results: false },
      });

      await service.searchMarketplaceRepositories({});

      const callArgs = mockClient.searchRepositories.mock.calls[0][0];
      expect(callArgs.q).toContain('archived:false');
    });
  });

  describe('Pagination', () => {
    it('should calculate pagination info correctly', async () => {
      mockClient.searchRepositories.mockResolvedValue({
        success: true,
        data: {
          total_count: 250,
          items: [],
          incomplete_results: false,
        },
      });

      const result = await service.searchMarketplaceRepositories({}, 1, 50);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.currentPage).toBe(1);
      expect(result.data?.totalPages).toBe(5); // 250 / 50 = 5
      expect(result.data?.hasNextPage).toBe(true);
      expect(result.data?.hasPreviousPage).toBe(false);
    });

    it('should indicate no next page on last page', async () => {
      mockClient.searchRepositories.mockResolvedValue({
        success: true,
        data: {
          total_count: 100,
          items: [],
          incomplete_results: false,
        },
      });

      const result = await service.searchMarketplaceRepositories({}, 2, 50);

      expect(result.data?.hasNextPage).toBe(false);
      expect(result.data?.hasPreviousPage).toBe(true);
    });

    it('should respect maxTotalResults limit', async () => {
      const serviceWithLimit = new GitHubSearchService(mockClient, {
        maxTotalResults: 100,
      });

      mockClient.searchRepositories.mockResolvedValue({
        success: true,
        data: {
          total_count: 1000,
          items: [],
          incomplete_results: false,
        },
      });

      const result = await serviceWithLimit.searchMarketplaceRepositories({}, 1, 100);

      expect(result.data?.totalCount).toBe(100); // Capped at maxTotalResults
    });
  });

  describe('Error Handling', () => {
    it('should handle GitHub API errors gracefully', async () => {
      mockClient.searchRepositories.mockResolvedValue({
        success: false,
        error: { message: 'Rate limit exceeded' },
      });

      const result = await service.searchMarketplaceRepositories({});

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Rate limit exceeded');
    });

    it('should handle network errors', async () => {
      mockClient.searchRepositories.mockResolvedValue({
        success: false,
        error: { message: 'Network error' },
      });

      const result = await service.searchMarketplaceRepositories({});

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return error on exception', async () => {
      mockClient.searchRepositories.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await service.searchMarketplaceRepositories({});

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Unexpected error');
    });
  });

  describe('Search Methods', () => {
    it('should search organization marketplaces with org filter', async () => {
      mockClient.searchRepositories.mockResolvedValue({
        success: true,
        data: { total_count: 10, items: [], incomplete_results: false },
      });

      await service.searchOrganizationMarketplaces('anthropic');

      const callArgs = mockClient.searchRepositories.mock.calls[0][0];
      expect(callArgs.q).toContain('org:anthropic');
    });

    it('should search user marketplaces with user filter', async () => {
      mockClient.searchRepositories.mockResolvedValue({
        success: true,
        data: { total_count: 10, items: [], incomplete_results: false },
      });

      await service.searchUserMarketplaces('john-doe');

      const callArgs = mockClient.searchRepositories.mock.calls[0][0];
      expect(callArgs.q).toContain('user:john-doe');
    });

    it('should search topic marketplaces with topic filter', async () => {
      mockClient.searchRepositories.mockResolvedValue({
        success: true,
        data: { total_count: 10, items: [], incomplete_results: false },
      });

      await service.searchTopicMarketplaces(['claude', 'plugins']);

      const callArgs = mockClient.searchRepositories.mock.calls[0][0];
      expect(callArgs.q).toContain('topic:claude');
      expect(callArgs.q).toContain('topic:plugins');
    });
  });

  describe('Repository Validation', () => {
    it('should return true when marketplace.json exists as file', async () => {
      mockClient.getRepositoryContent = jest.fn().mockResolvedValue({
        success: true,
        data: { type: 'file', name: 'marketplace.json' },
      } as any);

      const result = await service.validateMarketplaceRepository('owner', 'repo');

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('should return false when marketplace.json is a directory', async () => {
      mockClient.getRepositoryContent = jest.fn().mockResolvedValue({
        success: true,
        data: { type: 'dir', name: 'marketplace' },
      } as any);

      const result = await service.validateMarketplaceRepository('owner', 'repo');

      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
    });

    it('should return false when file does not exist', async () => {
      mockClient.getRepositoryContent = jest.fn().mockResolvedValue({
        success: false,
        error: { message: 'Not found' },
      } as any);

      const result = await service.validateMarketplaceRepository('owner', 'repo');

      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
    });
  });

  describe('Popular and Recent Marketplaces', () => {
    it('should fetch popular marketplaces with minimum stars', async () => {
      mockClient.searchRepositories.mockResolvedValue({
        success: true,
        data: {
          total_count: 50,
          items: [{ id: 1, name: 'popular-repo', stargazers_count: 100 }],
          incomplete_results: false,
        },
      });

      const result = await service.getPopularMarketplaces(50, 10);

      expect(result.success).toBe(true);
      expect(mockClient.searchRepositories).toHaveBeenCalledWith(
        expect.objectContaining({
          q: expect.stringContaining('stars:>=10'),
        })
      );
    });

    it('should fetch recently updated marketplaces', async () => {
      mockClient.searchRepositories.mockResolvedValue({
        success: true,
        data: {
          total_count: 30,
          items: [{ id: 1, name: 'recent-repo', updated_at: '2025-01-01' }],
          incomplete_results: false,
        },
      });

      const result = await service.getRecentlyUpdatedMarketplaces(50, 30);

      expect(result.success).toBe(true);
      expect(mockClient.searchRepositories).toHaveBeenCalledWith(
        expect.objectContaining({
          q: expect.stringContaining('pushed:>='), // Should have date filter
        })
      );
    });
  });
});
