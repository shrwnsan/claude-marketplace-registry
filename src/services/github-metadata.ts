/**
 * GitHub Metadata Service
 * Handles fetching comprehensive repository metadata from GitHub API
 */

import { GitHubClient, getDefaultGitHubClient } from '@/utils/github-client';
import {
  GitHubRepository,
  GitHubCommit,
  GitHubUser,
  GitHubApiResponse,
  RepositoryMetadata,
} from '@/types/github';

/**
 * Configuration for metadata fetching
 */
export interface MetadataConfig {
  fetchLanguages?: boolean;
  fetchContributors?: boolean;
  fetchCommits?: boolean;
  maxContributors?: number;
  maxCommits?: number;
  includeCommitMessages?: boolean;
  cacheEnabled?: boolean;
  cacheTTL?: number; // in seconds
}

/**
 * Enhanced repository metadata with additional computed fields
 */
export interface EnhancedRepositoryMetadata extends RepositoryMetadata {
  contributors?: GitHubUser[];
  languages?: Record<string, number>;
  recentCommits?: GitHubCommit[];
  commitFrequency?: number; // commits per week
  busFactor?: number; // based on contributors
  hasDocumentation?: boolean;
  hasTests?: boolean;
  hasCI?: boolean;
  codeHealthScore?: number; // 0-100
}

/**
 * GitHub Metadata Service class
 */
export class GitHubMetadataService {
  private githubClient: GitHubClient;
  private config: MetadataConfig;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  constructor(
    githubClient: GitHubClient,
    config: MetadataConfig = {}
  ) {
    this.githubClient = githubClient;
    this.config = {
      fetchLanguages: true,
      fetchContributors: true,
      fetchCommits: true,
      maxContributors: 10,
      maxCommits: 30,
      includeCommitMessages: true,
      cacheEnabled: true,
      cacheTTL: 3600, // 1 hour
      ...config,
    };
  }

  /**
   * Get cache key for repository
   */
  private getCacheKey(owner: string, repo: string, type: string): string {
    return `${owner}/${repo}:${type}`;
  }

  /**
   * Get cached data or return null if not cached/expired
   */
  private getCachedData<T>(key: string): T | null {
    if (!this.config.cacheEnabled) {
      return null;
    }

    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    const age = (Date.now() - cached.timestamp) / 1000;
    if (age > (this.config.cacheTTL || 3600)) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  /**
   * Cache data with timestamp
   */
  private setCachedData(key: string, data: any): void {
    if (!this.config.cacheEnabled) {
      return;
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Convert GitHub repository to RepositoryMetadata format
   */
  private convertToRepositoryMetadata(repo: GitHubRepository): RepositoryMetadata {
    return {
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      url: repo.html_url,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      language: repo.language,
      license: repo.license?.name || null,
      createdAt: repo.created_at,
      updatedAt: repo.updated_at,
      pushedAt: repo.pushed_at,
      size: repo.size,
      openIssuesCount: repo.open_issues_count,
      topics: repo.topics,
      defaultBranch: repo.default_branch,
      owner: {
        id: repo.owner.id,
        login: repo.owner.login,
        name: repo.owner.name,
        type: repo.owner.type,
        avatarUrl: repo.owner.avatar_url,
        url: repo.owner.html_url,
      },
      hasManifest: false, // Will be determined later
    };
  }

  /**
   * Calculate age in days from a date string
   */
  private calculateAgeInDays(dateString: string): number {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate commit frequency (commits per week)
   */
  private calculateCommitFrequency(commits: GitHubCommit[]): number {
    if (commits.length === 0) return 0;

    const oldestCommit = commits[commits.length - 1];
    const newestCommit = commits[0];

    const oldestDate = new Date(oldestCommit.commit.author.date);
    const newestDate = new Date(newestCommit.commit.author.date);

    const diffWeeks = Math.max(1, (newestDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24 * 7));

    return Math.round(commits.length / diffWeeks * 10) / 10;
  }

  /**
   * Calculate bus factor based on contributors
   */
  private calculateBusFactor(contributors: GitHubUser[]): number {
    if (contributors.length === 0) return 0;

    // Simple bus factor: percentage of contributions from top contributors
    const totalContributions = contributors.reduce((sum, contributor) => {
      return sum + (contributor as any).contributions || 0;
    }, 0);

    const topContributorContributions = (contributors[0] as any).contributions || 0;
    return Math.round((topContributorContributions / totalContributions) * 100);
  }

  /**
   * Calculate code health score (0-100)
   */
  private calculateCodeHealthScore(metadata: RepositoryMetadata): number {
    let score = 0;
    const maxScore = 100;

    // Age score (0-20 points)
    const ageInDays = this.calculateAgeInDays(metadata.createdAt);
    if (ageInDays > 365) score += 20; // More than 1 year old
    else if (ageInDays > 90) score += 15; // More than 3 months old
    else if (ageInDays > 30) score += 10; // More than 1 month old
    else score += 5; // Less than 1 month old

    // Stars score (0-20 points)
    if (metadata.stars > 1000) score += 20;
    else if (metadata.stars > 100) score += 15;
    else if (metadata.stars > 10) score += 10;
    else if (metadata.stars > 0) score += 5;

    // Forks score (0-15 points)
    if (metadata.forks > 100) score += 15;
    else if (metadata.forks > 10) score += 10;
    else if (metadata.forks > 0) score += 5;

    // Activity score (0-15 points)
    const daysSinceLastUpdate = this.calculateAgeInDays(metadata.updatedAt);
    if (daysSinceLastUpdate < 7) score += 15; // Updated within week
    else if (daysSinceLastUpdate < 30) score += 10; // Updated within month
    else if (daysSinceLastUpdate < 90) score += 5; // Updated within 3 months

    // Description score (0-10 points)
    if (metadata.description && metadata.description.length > 50) score += 10;
    else if (metadata.description) score += 5;

    // License score (0-10 points)
    if (metadata.license) score += 10;

    // Topics score (0-10 points)
    if (metadata.topics.length > 3) score += 10;
    else if (metadata.topics.length > 0) score += 5;

    return Math.min(score, maxScore);
  }

  /**
   * Get basic repository metadata
   */
  async getRepositoryMetadata(
    owner: string,
    repo: string
  ): Promise<GitHubApiResponse<RepositoryMetadata>> {
    try {
      const cacheKey = this.getCacheKey(owner, repo, 'metadata');
      const cached = this.getCachedData<RepositoryMetadata>(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
        };
      }

      const response = await this.githubClient.getRepository(owner, repo);

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error,
        };
      }

      const githubRepo = response.data as GitHubRepository;
      const metadata = this.convertToRepositoryMetadata(githubRepo);

      this.setCachedData(cacheKey, metadata);

      return {
        success: true,
        data: metadata,
      };
    } catch (error: any) {
      console.error(`Failed to get metadata for ${owner}/${repo}:`, error);
      return {
        success: false,
        error: {
          message: error.message || 'Failed to fetch repository metadata',
        },
      };
    }
  }

  /**
   * Get enhanced repository metadata with additional details
   */
  async getEnhancedRepositoryMetadata(
    owner: string,
    repo: string
  ): Promise<GitHubApiResponse<EnhancedRepositoryMetadata>> {
    try {
      // Get basic metadata first
      const basicResponse = await this.getRepositoryMetadata(owner, repo);
      if (!basicResponse.success || !basicResponse.data) {
        return basicResponse as GitHubApiResponse<EnhancedRepositoryMetadata>;
      }

      const metadata = basicResponse.data;
      const enhanced: EnhancedRepositoryMetadata = { ...metadata };

      // Fetch additional data in parallel
      const promises: Promise<void>[] = [];

      // Languages
      if (this.config.fetchLanguages) {
        promises.push(this.fetchLanguages(owner, repo, enhanced));
      }

      // Contributors
      if (this.config.fetchContributors) {
        promises.push(this.fetchContributors(owner, repo, enhanced));
      }

      // Commits
      if (this.config.fetchCommits) {
        promises.push(this.fetchCommits(owner, repo, enhanced));
      }

      // Wait for all parallel requests
      await Promise.allSettled(promises);

      // Calculate derived metrics
      if (enhanced.recentCommits) {
        enhanced.commitFrequency = this.calculateCommitFrequency(enhanced.recentCommits);
      }

      if (enhanced.contributors) {
        enhanced.busFactor = this.calculateBusFactor(enhanced.contributors);
      }

      // Check for common files and features
      await this.checkRepositoryFeatures(owner, repo, enhanced);

      // Calculate code health score
      enhanced.codeHealthScore = this.calculateCodeHealthScore(enhanced);

      return {
        success: true,
        data: enhanced,
      };
    } catch (error: any) {
      console.error(`Failed to get enhanced metadata for ${owner}/${repo}:`, error);
      return {
        success: false,
        error: {
          message: error.message || 'Failed to fetch enhanced repository metadata',
        },
      };
    }
  }

  /**
   * Fetch repository languages
   */
  private async fetchLanguages(
    owner: string,
    repo: string,
    metadata: EnhancedRepositoryMetadata
  ): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(owner, repo, 'languages');
      const cached = this.getCachedData<Record<string, number>>(cacheKey);
      if (cached) {
        metadata.languages = cached;
        return;
      }

      const response = await this.githubClient.getLanguages(owner, repo);

      if (response.success && response.data) {
        metadata.languages = response.data;
        this.setCachedData(cacheKey, metadata.languages);
      }
    } catch (error) {
      console.warn(`Failed to fetch languages for ${owner}/${repo}:`, error);
    }
  }

  /**
   * Fetch repository contributors
   */
  private async fetchContributors(
    owner: string,
    repo: string,
    metadata: EnhancedRepositoryMetadata
  ): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(owner, repo, 'contributors');
      const cached = this.getCachedData<GitHubUser[]>(cacheKey);
      if (cached) {
        metadata.contributors = cached;
        return;
      }

      const response = await this.githubClient.getContributors(owner, repo, {
        per_page: this.config.maxContributors,
        anon: 'false',
      });

      if (response.success && response.data) {
        metadata.contributors = response.data;
        this.setCachedData(cacheKey, metadata.contributors);
      }
    } catch (error) {
      console.warn(`Failed to fetch contributors for ${owner}/${repo}:`, error);
    }
  }

  /**
   * Fetch recent commits
   */
  private async fetchCommits(
    owner: string,
    repo: string,
    metadata: EnhancedRepositoryMetadata
  ): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(owner, repo, 'commits');
      const cached = this.getCachedData<GitHubCommit[]>(cacheKey);
      if (cached) {
        metadata.recentCommits = cached;
        return;
      }

      const response = await this.githubClient.getCommits(owner, repo, {
        per_page: this.config.maxCommits,
        sha: metadata.defaultBranch,
      });

      if (response.success && response.data) {
        metadata.recentCommits = response.data;

        // Set last commit info
        if (response.data.length > 0) {
          const lastCommit = response.data[0];
          metadata.lastCommitSha = lastCommit.sha;
          metadata.lastCommitDate = lastCommit.commit.author.date;
        }

        this.setCachedData(cacheKey, metadata.recentCommits);
      }
    } catch (error) {
      console.warn(`Failed to fetch commits for ${owner}/${repo}:`, error);
    }
  }

  /**
   * Check for repository features (documentation, tests, CI)
   */
  private async checkRepositoryFeatures(
    owner: string,
    repo: string,
    metadata: EnhancedRepositoryMetadata
  ): Promise<void> {
    try {
      const filesToCheck = [
        'README.md',
        'readme.md',
        'README.rst',
        'readme.rst',
        'LICENSE',
        'LICENSE.md',
        'CONTRIBUTING.md',
        'CHANGELOG.md',
        '.gitignore',
        'package.json',
        'requirements.txt',
        'Pipfile',
        'Cargo.toml',
        'go.mod',
      ];

      const testFiles = [
        '__tests__',
        'tests',
        'test',
        'spec',
        'jest.config.js',
        'pytest.ini',
        'tox.ini',
      ];

      const ciFiles = [
        '.github/workflows',
        '.gitlab-ci.yml',
        '.travis.yml',
        'appveyor.yml',
        'circle.yml',
        'Jenkinsfile',
        'azure-pipelines.yml',
      ];

      // Check documentation files
      const docPromises = filesToCheck.map(async (file) => {
        const response = await this.githubClient.getRepositoryContent(owner, repo, file);
        return response.success;
      });

      const docResults = await Promise.allSettled(docPromises);
      metadata.hasDocumentation = docResults.some(result =>
        result.status === 'fulfilled' && result.value === true
      );

      // Check test files (we'll just check for common test directories)
      metadata.hasTests = await this.checkDirectoryExists(owner, repo, testFiles);

      // Check CI files
      metadata.hasCI = await this.checkDirectoryExists(owner, repo, ciFiles);

    } catch (error) {
      console.warn(`Failed to check repository features for ${owner}/${repo}:`, error);
    }
  }

  /**
   * Check if any of the specified directories/files exist
   */
  private async checkDirectoryExists(
    owner: string,
    repo: string,
    paths: string[]
  ): Promise<boolean> {
    for (const path of paths) {
      try {
        const response = await this.githubClient.getRepositoryContent(owner, repo, path);
        if (response.success) {
          return true;
        }
      } catch {
        // Continue checking other paths
      }
    }
    return false;
  }

  /**
   * Get metadata for multiple repositories in parallel
   */
  async getMultipleRepositoryMetadata(
    repositories: Array<{ owner: string; repo: string }>,
    enhanced: boolean = false
  ): Promise<GitHubApiResponse<EnhancedRepositoryMetadata[]>> {
    try {
      console.log(`Fetching metadata for ${repositories.length} repositories...`);

      const promises = repositories.map(({ owner, repo }) =>
        enhanced
          ? this.getEnhancedRepositoryMetadata(owner, repo)
          : this.getRepositoryMetadata(owner, repo)
      );

      const results = await Promise.allSettled(promises);

      const successfulResults: EnhancedRepositoryMetadata[] = [];
      const errors: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success && result.value.data) {
          successfulResults.push(result.value.data as EnhancedRepositoryMetadata);
        } else {
          const { owner, repo } = repositories[index];
          const errorMsg = result.status === 'rejected'
            ? result.reason?.message || 'Unknown error'
            : result.value.error?.message || 'API error';
          errors.push(`${owner}/${repo}: ${errorMsg}`);
        }
      });

      if (errors.length > 0) {
        console.warn(`Failed to fetch metadata for ${errors.length} repositories:`, errors);
      }

      console.log(`Successfully fetched metadata for ${successfulResults.length} repositories`);

      return {
        success: true,
        data: successfulResults,
      };
    } catch (error: any) {
      console.error('Failed to fetch multiple repository metadata:', error);
      return {
        success: false,
        error: {
          message: error.message || 'Failed to fetch multiple repository metadata',
        },
      };
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Get metadata service configuration
   */
  getConfig(): MetadataConfig {
    return { ...this.config };
  }

  /**
   * Update metadata service configuration
   */
  updateConfig(newConfig: Partial<MetadataConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

/**
 * Create a default GitHub metadata service instance
 */
export function createGitHubMetadataService(
  githubClient: GitHubClient,
  config?: MetadataConfig
): GitHubMetadataService {
  return new GitHubMetadataService(githubClient, config);
}

/**
 * Singleton instance for the application
 */
let defaultMetadataService: GitHubMetadataService | null = null;

/**
 * Get the default GitHub metadata service instance
 */
export function getDefaultGitHubMetadataService(): GitHubMetadataService {
  if (!defaultMetadataService) {
    const githubClient = getDefaultGitHubClient();
    defaultMetadataService = new GitHubMetadataService(githubClient);
  }
  return defaultMetadataService;
}