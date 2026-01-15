/**
 * GitHub Metadata Service Tests
 *
 * Tests for the GitHubMetadataService class, focusing on:
 * - Configuration management
 * - Caching behavior
 * - Error handling
 * - Metadata conversion
 * - Quality score calculations
 */

import { GitHubMetadataService, MetadataConfig } from '../github-metadata';
import { GitHubClient } from '@/utils/github-client';

// Mock the GitHubClient
jest.mock('@/utils/github-client');

describe('GitHubMetadataService', () => {
  let service: GitHubMetadataService;
  let mockClient: jest.Mocked<GitHubClient>;

  const mockRepository = {
    id: 123456,
    name: 'test-repo',
    full_name: 'test-owner/test-repo',
    description: 'A test repository',
    html_url: 'https://github.com/test-owner/test-repo',
    stargazers_count: 100,
    forks_count: 25,
    language: 'TypeScript',
    license: { name: 'MIT' },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    pushed_at: '2025-01-01T00:00:00Z',
    size: 1000,
    open_issues_count: 5,
    topics: ['claude', 'plugins', 'ai'],
    default_branch: 'main',
    owner: {
      id: 789,
      login: 'test-owner',
      name: 'Test Owner',
      type: 'User',
      avatar_url: 'https://github.com/test-owner.png',
      html_url: 'https://github.com/test-owner',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a mock GitHub client
    mockClient = {
      getRepository: jest.fn(),
      getLanguages: jest.fn(),
      getContributors: jest.fn(),
      getCommits: jest.fn(),
      getRepositoryContent: jest.fn(),
    } as any;

    service = new GitHubMetadataService(mockClient);
  });

  describe('Configuration', () => {
    it('should initialize with default configuration', () => {
      const config = service.getConfig();

      expect(config).toEqual({
        fetchLanguages: true,
        fetchContributors: true,
        fetchCommits: true,
        maxContributors: 10,
        maxCommits: 30,
        includeCommitMessages: true,
        cacheEnabled: true,
        cacheTTL: 3600,
      });
    });

    it('should accept custom configuration', () => {
      const customConfig: MetadataConfig = {
        fetchLanguages: false,
        maxContributors: 20,
        cacheEnabled: false,
      };

      const customService = new GitHubMetadataService(mockClient, customConfig);
      const config = customService.getConfig();

      expect(config.fetchLanguages).toBe(false);
      expect(config.maxContributors).toBe(20);
      expect(config.cacheEnabled).toBe(false);
      // Other defaults should still apply
      expect(config.fetchContributors).toBe(true);
    });

    it('should allow updating configuration', () => {
      service.updateConfig({ maxCommits: 50, fetchLanguages: false });

      const config = service.getConfig();
      expect(config.maxCommits).toBe(50);
      expect(config.fetchLanguages).toBe(false);
    });
  });

  describe('Caching', () => {
    it('should cache repository metadata', async () => {
      mockClient.getRepository.mockResolvedValue({
        success: true,
        data: mockRepository,
      });

      // First call
      await service.getRepositoryMetadata('test-owner', 'test-repo');
      // Second call should use cache
      await service.getRepositoryMetadata('test-owner', 'test-repo');

      expect(mockClient.getRepository).toHaveBeenCalledTimes(1);
    });

    it('should respect cache TTL', async () => {
      const shortCacheService = new GitHubMetadataService(mockClient, {
        cacheEnabled: true,
        cacheTTL: 0.001, // Very short TTL (1ms) to ensure expiration
      });

      mockClient.getRepository.mockResolvedValue({
        success: true,
        data: mockRepository,
      });

      // First call
      await shortCacheService.getRepositoryMetadata('test-owner', 'test-repo');
      // Wait for cache to expire
      await new Promise((resolve) => setTimeout(resolve, 10));
      // Second call should not use cache (TTL expired)
      await shortCacheService.getRepositoryMetadata('test-owner', 'test-repo');

      expect(mockClient.getRepository).toHaveBeenCalledTimes(2);
    });

    it('should bypass cache when disabled', async () => {
      const noCacheService = new GitHubMetadataService(mockClient, {
        cacheEnabled: false,
      });

      mockClient.getRepository.mockResolvedValue({
        success: true,
        data: mockRepository,
      });

      await noCacheService.getRepositoryMetadata('test-owner', 'test-repo');
      await noCacheService.getRepositoryMetadata('test-owner', 'test-repo');

      expect(mockClient.getRepository).toHaveBeenCalledTimes(2);
    });

    it('should provide cache statistics', () => {
      const stats = service.getCacheStats();

      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('keys');
      expect(Array.isArray(stats.keys)).toBe(true);
    });

    it('should clear cache', async () => {
      mockClient.getRepository.mockResolvedValue({
        success: true,
        data: mockRepository,
      });

      await service.getRepositoryMetadata('test-owner', 'test-repo');

      let stats = service.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);

      service.clearCache();

      stats = service.getCacheStats();
      expect(stats.size).toBe(0);
    });
  });

  describe('Repository Metadata', () => {
    it('should get basic repository metadata', async () => {
      mockClient.getRepository.mockResolvedValue({
        success: true,
        data: mockRepository,
      });

      const result = await service.getRepositoryMetadata('test-owner', 'test-repo');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.name).toBe('test-repo');
      expect(result.data?.fullName).toBe('test-owner/test-repo');
      expect(result.data?.stars).toBe(100);
      expect(result.data?.forks).toBe(25);
    });

    it('should convert GitHub repository to metadata format', async () => {
      mockClient.getRepository.mockResolvedValue({
        success: true,
        data: mockRepository,
      });

      const result = await service.getRepositoryMetadata('test-owner', 'test-repo');

      expect(result.data).toMatchObject({
        id: 123456,
        name: 'test-repo',
        fullName: 'test-owner/test-repo',
        description: 'A test repository',
        url: 'https://github.com/test-owner/test-repo',
        stars: 100,
        forks: 25,
        language: 'TypeScript',
        license: 'MIT',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        pushedAt: '2025-01-01T00:00:00Z',
        size: 1000,
        openIssuesCount: 5,
        topics: ['claude', 'plugins', 'ai'],
        defaultBranch: 'main',
        owner: {
          id: 789,
          login: 'test-owner',
          name: 'Test Owner',
          type: 'User',
          avatarUrl: 'https://github.com/test-owner.png',
          url: 'https://github.com/test-owner',
        },
      });
    });

    it('should handle null license', async () => {
      const repoWithoutLicense = { ...mockRepository, license: null };

      mockClient.getRepository.mockResolvedValue({
        success: true,
        data: repoWithoutLicense,
      });

      const result = await service.getRepositoryMetadata('test-owner', 'test-repo');

      expect(result.data?.license).toBeNull();
    });

    it('should handle API errors', async () => {
      mockClient.getRepository.mockResolvedValue({
        success: false,
        error: { message: 'Repository not found' },
      });

      const result = await service.getRepositoryMetadata('test-owner', 'test-repo');

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Repository not found');
    });

    it('should handle exceptions', async () => {
      mockClient.getRepository.mockImplementation(() => {
        throw new Error('Network error');
      });

      const result = await service.getRepositoryMetadata('test-owner', 'test-repo');

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Network error');
    });
  });

  describe('Enhanced Metadata', () => {
    it('should fetch enhanced metadata with additional data', async () => {
      mockClient.getRepository.mockResolvedValue({
        success: true,
        data: mockRepository,
      });

      mockClient.getLanguages.mockResolvedValue({
        success: true,
        data: { TypeScript: 1000, JavaScript: 500 },
      });

      mockClient.getContributors.mockResolvedValue({
        success: true,
        data: [
          {
            login: 'contributor1',
            contributions: 100,
            id: 1,
            avatar_url: 'https://github.com/contributor1.png',
            html_url: 'https://github.com/contributor1',
            type: 'User',
          },
        ],
      });

      mockClient.getCommits.mockResolvedValue({
        success: true,
        data: [
          {
            sha: 'abc123',
            commit: {
              author: { date: '2025-01-01T00:00:00Z' },
              message: 'Test commit',
            },
          },
        ],
      });

      mockClient.getRepositoryContent.mockResolvedValue({
        success: true,
        data: { type: 'file' },
      });

      const result = await service.getEnhancedRepositoryMetadata('test-owner', 'test-repo');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.languages).toEqual({ TypeScript: 1000, JavaScript: 500 });
      expect(result.data?.contributors).toBeDefined();
      expect(result.data?.recentCommits).toBeDefined();
      expect(result.data?.commitFrequency).toBeDefined();
      expect(result.data?.busFactor).toBeDefined();
      expect(result.data?.codeHealthScore).toBeDefined();
    });

    it('should skip fetching disabled data', async () => {
      const minimalService = new GitHubMetadataService(mockClient, {
        fetchLanguages: false,
        fetchContributors: false,
        fetchCommits: false,
      });

      mockClient.getRepository.mockResolvedValue({
        success: true,
        data: mockRepository,
      });

      mockClient.getRepositoryContent.mockResolvedValue({
        success: false,
        error: { message: 'Not found' },
      });

      const result = await minimalService.getEnhancedRepositoryMetadata('test-owner', 'test-repo');

      expect(result.success).toBe(true);
      expect(mockClient.getLanguages).not.toHaveBeenCalled();
      expect(mockClient.getContributors).not.toHaveBeenCalled();
      expect(mockClient.getCommits).not.toHaveBeenCalled();
    });
  });

  describe('Multiple Repositories', () => {
    it('should fetch metadata for multiple repositories', async () => {
      mockClient.getRepository.mockResolvedValue({
        success: true,
        data: mockRepository,
      });

      const repositories = [
        { owner: 'owner1', repo: 'repo1' },
        { owner: 'owner2', repo: 'repo2' },
        { owner: 'owner3', repo: 'repo3' },
      ];

      const result = await service.getMultipleRepositoryMetadata(repositories);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
      expect(mockClient.getRepository).toHaveBeenCalledTimes(3);
    });

    it('should handle partial failures gracefully', async () => {
      mockClient.getRepository
        .mockResolvedValueOnce({
          success: true,
          data: mockRepository,
        })
        .mockResolvedValueOnce({
          success: false,
          error: { message: 'Not found' },
        })
        .mockResolvedValueOnce({
          success: true,
          data: { ...mockRepository, name: 'repo3' },
        });

      const repositories = [
        { owner: 'owner1', repo: 'repo1' },
        { owner: 'owner2', repo: 'repo2' },
        { owner: 'owner3', repo: 'repo3' },
      ];

      const result = await service.getMultipleRepositoryMetadata(repositories);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2); // Only successful ones
    });

    it('should fetch enhanced metadata for multiple repositories', async () => {
      mockClient.getRepository.mockResolvedValue({
        success: true,
        data: mockRepository,
      });

      mockClient.getLanguages.mockResolvedValue({
        success: true,
        data: { TypeScript: 1000 },
      });

      mockClient.getContributors.mockResolvedValue({
        success: true,
        data: [],
      });

      mockClient.getCommits.mockResolvedValue({
        success: true,
        data: [],
      });

      mockClient.getRepositoryContent.mockResolvedValue({
        success: false,
        error: { message: 'Not found' },
      });

      const repositories = [
        { owner: 'owner1', repo: 'repo1' },
        { owner: 'owner2', repo: 'repo2' },
      ];

      const result = await service.getMultipleRepositoryMetadata(repositories, true);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });
  });
});
