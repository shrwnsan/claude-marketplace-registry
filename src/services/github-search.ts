/**
 * GitHub Search Service
 * Handles searching for repositories containing .claude-plugin/marketplace.json files
 */

import { GitHubClient, getDefaultGitHubClient } from '@/utils/github-client';
import { createLogger } from '@/utils/logger';
import {
  GitHubSearchResponse,
  GitHubSearchParams,
  GitHubSearchRepositoryItem,
  RepositorySearchFilters,
  GitHubApiResponse,
  GitHubRateLimit,
} from '@/types/github';

const logger = createLogger('GitHubSearchService');

/**
 * Configuration for GitHub search service
 */
export interface GitHubSearchConfig {
  maxResultsPerPage?: number;
  maxTotalResults?: number;
  defaultSort?: 'stars' | 'forks' | 'updated';
  defaultOrder?: 'asc' | 'desc';
  excludeForks?: boolean;
  excludeArchived?: boolean;
  minStars?: number;
}

/**
 * Search result with metadata
 */
export interface SearchResult {
  repositories: GitHubSearchRepositoryItem[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  rateLimit?: GitHubRateLimit;
}

/**
 * GitHub Search Service class
 */
export class GitHubSearchService {
  private githubClient: GitHubClient;
  private config: GitHubSearchConfig;

  constructor(githubClient: GitHubClient, config: GitHubSearchConfig = {}) {
    this.githubClient = githubClient;
    this.config = {
      maxResultsPerPage: 100,
      maxTotalResults: 1000,
      defaultSort: 'updated',
      defaultOrder: 'desc',
      excludeForks: true,
      excludeArchived: true,
      minStars: 0,
      ...config,
    };
  }

  /**
   * Build search query from filters
   */
  private buildSearchQuery(filters: RepositorySearchFilters): string {
    const queryParts: string[] = [];

    // Base query for marketplace.json files
    queryParts.push('filename:marketplace.json');
    queryParts.push('path:.claude-plugin');

    // Add custom search terms
    if (filters.query) {
      queryParts.push(filters.query);
    }

    // Language filter
    if (filters.language) {
      queryParts.push(`language:${filters.language}`);
    }

    // Stars range
    if (filters.stars) {
      if (filters.stars.min !== undefined) {
        queryParts.push(`stars:>=${filters.stars.min}`);
      }
      if (filters.stars.max !== undefined) {
        queryParts.push(`stars:<=${filters.stars.max}`);
      }
    } else if (this.config.minStars && this.config.minStars > 0) {
      queryParts.push(`stars:>=${this.config.minStars}`);
    }

    // Forks range
    if (filters.forks) {
      if (filters.forks.min !== undefined) {
        queryParts.push(`forks:>=${filters.forks.min}`);
      }
      if (filters.forks.max !== undefined) {
        queryParts.push(`forks:<=${filters.forks.max}`);
      }
    }

    // Creation date range
    if (filters.created) {
      if (filters.created.from) {
        queryParts.push(`created:>=${filters.created.from}`);
      }
      if (filters.created.to) {
        queryParts.push(`created:<=${filters.created.to}`);
      }
    }

    // Update date range
    if (filters.updated) {
      if (filters.updated.from) {
        queryParts.push(`pushed:>=${filters.updated.from}`);
      }
      if (filters.updated.to) {
        queryParts.push(`pushed:<=${filters.updated.to}`);
      }
    }

    // Topics
    if (filters.topics && filters.topics.length > 0) {
      const topicQuery = filters.topics.map((topic) => `topic:${topic}`).join(' ');
      queryParts.push(`(${topicQuery})`);
    }

    // Exclude forks
    const excludeForks =
      filters.excludeForks !== undefined ? filters.excludeForks : this.config.excludeForks;
    if (excludeForks) {
      queryParts.push('fork:false');
    }

    // Exclude archived
    const excludeArchived =
      filters.excludeArchived !== undefined ? filters.excludeArchived : this.config.excludeArchived;
    if (excludeArchived) {
      queryParts.push('archived:false');
    }

    return queryParts.join(' ');
  }

  /**
   * Search for repositories containing marketplace.json files
   */
  async searchMarketplaceRepositories(
    filters: RepositorySearchFilters = {},
    page: number = 1,
    perPage: number = this.config.maxResultsPerPage!
  ): Promise<GitHubApiResponse<SearchResult>> {
    try {
      // Build search parameters
      const searchFilters: RepositorySearchFilters = {
        ...filters,
        query: filters.query || '',
      };

      const query = this.buildSearchQuery(searchFilters);

      const searchParams: GitHubSearchParams = {
        q: query,
        sort: filters.sort || this.config.defaultSort,
        order: filters.order || this.config.defaultOrder,
        per_page: Math.min(perPage, this.config.maxResultsPerPage!),
        page,
      };

      logger.debug(`Searching GitHub with query: "${query}" (page ${page})`);

      // Execute search
      const response = await this.githubClient.searchRepositories(searchParams);

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error,
        };
      }

      const searchResult: GitHubSearchResponse<GitHubSearchRepositoryItem> = response.data;

      // Calculate pagination info
      const totalCount = Math.min(searchResult.total_count, this.config.maxTotalResults!);
      const totalPages = Math.ceil(totalCount / perPage);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      const result: SearchResult = {
        repositories: searchResult.items,
        totalCount,
        currentPage: page,
        totalPages,
        hasNextPage,
        hasPreviousPage,
        rateLimit: response.rateLimit,
      };

      return {
        success: true,
        data: result,
        rateLimit: response.rateLimit,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Search failed:', message);
      return {
        success: false,
        error: {
          message: message || 'Search operation failed',
        },
      };
    }
  }

  /**
   * Search all pages (with rate limiting and delay)
   */
  async searchAllMarketplaceRepositories(
    filters: RepositorySearchFilters = {},
    maxPages?: number,
    delayBetweenRequests: number = 1000
  ): Promise<GitHubApiResponse<GitHubSearchRepositoryItem[]>> {
    const allRepositories: GitHubSearchRepositoryItem[] = [];
    let page = 1;
    let hasMore = true;
    let rateLimit: GitHubRateLimit | undefined;

    const maxPagesToFetch =
      maxPages || Math.ceil(this.config.maxTotalResults! / this.config.maxResultsPerPage!);

    while (hasMore && page <= maxPagesToFetch) {
      logger.debug(`Fetching page ${page} of marketplace repositories...`);

      const response = await this.searchMarketplaceRepositories(filters, page);

      if (!response.success) {
        logger.warn(`Failed to fetch page ${page}:`, response.error?.message);
        break;
      }

      const result = response.data!;
      allRepositories.push(...result.repositories);
      rateLimit = response.rateLimit;

      // Check if we should continue
      hasMore = result.hasNextPage;
      page++;

      // Add delay between requests to be gentle with the API
      if (hasMore && delayBetweenRequests > 0) {
        await this.sleep(delayBetweenRequests);
      }

      // Check rate limit
      if (rateLimit?.resources?.search?.remaining === 0) {
        const resetTime = rateLimit.resources.search.reset * 1000;
        const waitTime = Math.max(0, resetTime - Date.now());

        if (waitTime > 0) {
          logger.warn(
            `Search rate limit exceeded. Waiting ${Math.ceil(waitTime / 1000)} seconds...`
          );
          await this.sleep(waitTime);
        }
      }

      // Stop if we've reached the maximum total results
      if (allRepositories.length >= this.config.maxTotalResults!) {
        logger.debug(`Reached maximum total results limit (${this.config.maxTotalResults})`);
        break;
      }
    }

    logger.info(`Search complete. Found ${allRepositories.length} repositories.`);

    return {
      success: true,
      data: allRepositories.slice(0, this.config.maxTotalResults),
      rateLimit,
    };
  }

  /**
   * Search for repositories in a specific organization
   */
  async searchOrganizationMarketplaces(
    organization: string,
    filters: RepositorySearchFilters = {}
  ): Promise<GitHubApiResponse<GitHubSearchRepositoryItem[]>> {
    const orgFilters: RepositorySearchFilters = {
      ...filters,
      query: `${filters.query || ''} org:${organization}`.trim(),
    };

    return this.searchAllMarketplaceRepositories(orgFilters);
  }

  /**
   * Search for repositories by a specific user
   */
  async searchUserMarketplaces(
    username: string,
    filters: RepositorySearchFilters = {}
  ): Promise<GitHubApiResponse<GitHubSearchRepositoryItem[]>> {
    const userFilters: RepositorySearchFilters = {
      ...filters,
      query: `${filters.query || ''} user:${username}`.trim(),
    };

    return this.searchAllMarketplaceRepositories(userFilters);
  }

  /**
   * Search for repositories with specific topics
   */
  async searchTopicMarketplaces(
    topics: string[],
    filters: RepositorySearchFilters = {}
  ): Promise<GitHubApiResponse<GitHubSearchRepositoryItem[]>> {
    const topicFilters: RepositorySearchFilters = {
      ...filters,
      topics: [...(filters.topics || []), ...topics],
    };

    return this.searchAllMarketplaceRepositories(topicFilters);
  }

  /**
   * Validate if a repository is likely a marketplace
   */
  async validateMarketplaceRepository(
    owner: string,
    repo: string
  ): Promise<GitHubApiResponse<boolean>> {
    try {
      // Check if marketplace.json exists in .claude-plugin directory
      const contentResponse = await this.githubClient.getRepositoryContent(
        owner,
        repo,
        '.claude-plugin/marketplace.json'
      );

      if (!contentResponse.success) {
        return {
          success: true,
          data: false,
          error: contentResponse.error,
        };
      }

      const content = contentResponse.data;

      // Check if it's a file (not a directory)
      if (content.type !== 'file') {
        return {
          success: true,
          data: false,
        };
      }

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to validate repository ${owner}/${repo}:`, message);
      return {
        success: false,
        error: {
          message: message || 'Repository validation failed',
        },
      };
    }
  }

  /**
   * Get popular marketplace repositories (high stars, recent updates)
   */
  async getPopularMarketplaces(
    limit: number = 50,
    minStars: number = 10
  ): Promise<GitHubApiResponse<GitHubSearchRepositoryItem[]>> {
    const filters: RepositorySearchFilters = {
      query: '',
      stars: { min: minStars },
      updated: {
        from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      }, // Last 90 days
    };

    const response = await this.searchMarketplaceRepositories(filters, 1, limit);

    if (!response.success) {
      return {
        success: false,
        error: response.error,
      };
    }

    return {
      success: true,
      data: response.data!.repositories,
      rateLimit: response.rateLimit,
    };
  }

  /**
   * Get recently updated marketplace repositories
   */
  async getRecentlyUpdatedMarketplaces(
    limit: number = 50,
    daysBack: number = 30
  ): Promise<GitHubApiResponse<GitHubSearchRepositoryItem[]>> {
    const filters: RepositorySearchFilters = {
      query: '',
      updated: {
        from: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
    };

    const response = await this.searchMarketplaceRepositories(filters, 1, limit);

    if (!response.success) {
      return {
        success: false,
        error: response.error,
      };
    }

    return {
      success: true,
      data: response.data!.repositories,
      rateLimit: response.rateLimit,
    };
  }

  /**
   * Sleep helper for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get search service configuration
   */
  getConfig(): GitHubSearchConfig {
    return { ...this.config };
  }

  /**
   * Update search service configuration
   */
  updateConfig(newConfig: Partial<GitHubSearchConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

/**
 * Create a default GitHub search service instance
 */
export function createGitHubSearchService(
  githubClient: GitHubClient,
  config?: GitHubSearchConfig
): GitHubSearchService {
  return new GitHubSearchService(githubClient, config);
}

/**
 * Singleton instance for the application
 */
let defaultSearchService: GitHubSearchService | null = null;

/**
 * Get the default GitHub search service instance
 */
export function getDefaultGitHubSearchService(): GitHubSearchService {
  if (!defaultSearchService) {
    const githubClient = getDefaultGitHubClient();
    defaultSearchService = new GitHubSearchService(githubClient);
  }
  return defaultSearchService;
}
