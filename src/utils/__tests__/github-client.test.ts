/**
 * Tests for GitHub Client utility
 */

import { GitHubClient, createGitHubClient } from '../github-client';

// Mock Octokit
jest.mock('@octokit/rest', () => {
  return {
    Octokit: jest.fn().mockImplementation(() => ({
      auth: jest.fn(),
      rateLimit: {
        get: jest.fn().mockResolvedValue({
          data: {
            resources: {
              core: {
                limit: 5000,
                remaining: 4999,
                reset: Date.now() / 1000 + 3600,
                used: 1,
              },
              search: {
                limit: 30,
                remaining: 29,
                reset: Date.now() / 1000 + 60,
                used: 1,
              },
            },
            rate: {
              limit: 5000,
              remaining: 4999,
              reset: Date.now() / 1000 + 3600,
              used: 1,
            },
          },
        }),
      },
      search: {
        repos: jest.fn().mockResolvedValue({
          data: {
            total_count: 1,
            incomplete_results: false,
            items: [
              {
                id: 123456,
                name: 'test-repo',
                full_name: 'test-owner/test-repo',
                description: 'Test repository',
                stargazers_count: 10,
                forks_count: 5,
                language: 'TypeScript',
                updated_at: '2024-01-01T00:00:00Z',
                pushed_at: '2024-01-01T00:00:00Z',
                owner: {
                  id: 789,
                  login: 'test-owner',
                  name: 'Test Owner',
                  type: 'User',
                  avatar_url: 'https://github.com/test-owner.png',
                  html_url: 'https://github.com/test-owner',
                },
              },
            ],
          },
        }),
      },
      repos: {
        get: jest.fn().mockResolvedValue({
          data: {
            id: 123456,
            name: 'test-repo',
            full_name: 'test-owner/test-repo',
            description: 'Test repository',
            private: false,
            html_url: 'https://github.com/test-owner/test-repo',
            stargazers_count: 10,
            forks_count: 5,
            language: 'TypeScript',
            license: {
              key: 'mit',
              name: 'MIT License',
              spdx_id: 'MIT',
              url: 'https://api.github.com/licenses/mit',
              node_id: 'MDc6TGljZW5zZTEz',
            },
            default_branch: 'main',
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            pushed_at: '2024-01-01T00:00:00Z',
            size: 1000,
            open_issues_count: 2,
            topics: ['claude', 'marketplace'],
            owner: {
              id: 789,
              login: 'test-owner',
              name: 'Test Owner',
              type: 'User',
              avatar_url: 'https://github.com/test-owner.png',
              html_url: 'https://github.com/test-owner',
            },
          },
        }),
        getContent: jest.fn().mockResolvedValue({
          data: {
            name: 'marketplace.json',
            path: '.claude-plugin/marketplace.json',
            sha: 'abc123',
            size: 100,
            url: 'https://api.github.com/repos/test-owner/test-repo/contents/.claude-plugin/marketplace.json',
            html_url: 'https://github.com/test-owner/test-repo/blob/main/.claude-plugin/marketplace.json',
            git_url: 'https://api.github.com/repos/test-owner/test-repo/git/blobs/abc123',
            download_url: 'https://raw.githubusercontent.com/test-owner/test-repo/main/.claude-plugin/marketplace.json',
            type: 'file',
            content: Buffer.from('{"name": "Test Marketplace"}').toString('base64'),
            encoding: 'base64',
          },
        }),
        listCommits: jest.fn().mockResolvedValue({
          data: [
            {
              sha: 'def456',
              url: 'https://api.github.com/repos/test-owner/test-repo/commits/def456',
              message: 'Latest commit',
              author: {
                name: 'Test Author',
                email: 'test@example.com',
                date: '2024-01-01T00:00:00Z',
              },
              committer: {
                name: 'Test Author',
                email: 'test@example.com',
                date: '2024-01-01T00:00:00Z',
              },
              tree: {
                sha: 'ghi789',
                url: 'https://api.github.com/repos/test-owner/test-repo/git/trees/ghi789',
              },
            },
          ],
        }),
        listLanguages: jest.fn().mockResolvedValue({
          data: {
            TypeScript: 1000,
            JavaScript: 500,
            CSS: 100,
          },
        }),
        listContributors: jest.fn().mockResolvedValue({
          data: [
            {
              id: 789,
              login: 'test-owner',
              name: 'Test Owner',
              type: 'User',
              avatar_url: 'https://github.com/test-owner.png',
              html_url: 'https://github.com/test-owner',
              contributions: 50,
            },
          ],
        }),
      },
      users: {
        getByUsername: jest.fn().mockResolvedValue({
          data: {
            id: 789,
            login: 'test-owner',
            name: 'Test Owner',
            email: 'test@example.com',
            bio: 'Test bio',
            company: 'Test Company',
            blog: 'https://test-owner.com',
            location: 'San Francisco',
            avatar_url: 'https://github.com/test-owner.png',
            html_url: 'https://github.com/test-owner',
            type: 'User',
            public_repos: 10,
            followers: 100,
            following: 50,
            created_at: '2022-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        }),
      },
    })),
  };
});

describe('GitHubClient', () => {
  let githubClient: GitHubClient;

  beforeEach(() => {
    // Set mock environment variable
    process.env.GITHUB_TOKEN = 'test-token';
    githubClient = createGitHubClient();
  });

  afterEach(() => {
    delete process.env.GITHUB_TOKEN;
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create a GitHub client with default configuration', () => {
      expect(githubClient).toBeInstanceOf(GitHubClient);
    });

    it('should create a GitHub client with custom configuration', () => {
      const customClient = createGitHubClient({
        userAgent: 'custom-agent/1.0.0',
        retry: {
          enabled: true,
          maxRetries: 5,
          baseDelay: 2000,
          maxDelay: 60000,
        },
      });
      expect(customClient).toBeInstanceOf(GitHubClient);
    });
  });

  describe('Authentication', () => {
    it('should be authenticated when token is provided', () => {
      expect(githubClient.isAuthenticated()).toBe(true);
    });

    it('should not be authenticated when no token is provided', () => {
      delete process.env.GITHUB_TOKEN;
      const client = createGitHubClient();
      expect(client.isAuthenticated()).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    it('should get rate limit information', async () => {
      const response = await githubClient.getRateLimit();
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data?.resources.core.limit).toBe(5000);
      expect(response.data?.resources.search.limit).toBe(30);
    });
  });

  describe('Repository Operations', () => {
    it('should search repositories', async () => {
      const response = await githubClient.searchRepositories({
        q: 'filename:marketplace.json path:.claude-plugin',
      });
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data?.items).toHaveLength(1);
      expect(response.data?.items[0].full_name).toBe('test-owner/test-repo');
    });

    it('should get repository information', async () => {
      const response = await githubClient.getRepository('test-owner', 'test-repo');
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data?.full_name).toBe('test-owner/test-repo');
      expect(response.data?.stargazers_count).toBe(10);
    });

    it('should get repository content', async () => {
      const response = await githubClient.getRepositoryContent(
        'test-owner',
        'test-repo',
        '.claude-plugin/marketplace.json'
      );
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data?.name).toBe('marketplace.json');
      expect(response.data?.type).toBe('file');
    });

    it('should get repository commits', async () => {
      const response = await githubClient.getCommits('test-owner', 'test-repo');
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data).toHaveLength(1);
    });

    it('should get repository languages', async () => {
      const response = await githubClient.getLanguages('test-owner', 'test-repo');
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data?.TypeScript).toBe(1000);
      expect(response.data?.JavaScript).toBe(500);
    });

    it('should get repository contributors', async () => {
      const response = await githubClient.getContributors('test-owner', 'test-repo');
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data).toHaveLength(1);
      expect(response.data[0].login).toBe('test-owner');
    });
  });

  describe('User Operations', () => {
    it('should get user information', async () => {
      const response = await githubClient.getUser('test-owner');
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data?.login).toBe('test-owner');
      expect(response.data?.name).toBe('Test Owner');
    });
  });

  describe('Request Statistics', () => {
    it('should track request statistics', () => {
      const stats = githubClient.getRequestStats();
      expect(stats).toHaveProperty('requestCount');
      expect(stats).toHaveProperty('lastResetTime');
      expect(typeof stats.requestCount).toBe('number');
      expect(typeof stats.lastResetTime).toBe('number');
    });

    it('should reset request statistics', () => {
      githubClient.resetRequestStats();
      const stats = githubClient.getRequestStats();
      expect(stats.requestCount).toBe(0);
    });
  });

  describe('Raw Octokit Access', () => {
    it('should provide access to raw Octokit instance', () => {
      const octokit = githubClient.getOctokit();
      expect(octokit).toBeDefined();
      expect(typeof octokit.rateLimit.get).toBe('function');
    });
  });
});