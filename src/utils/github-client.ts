/**
 * GitHub API Client Utility
 * Provides authentication, rate limiting, and error handling for GitHub API requests
 */

import { Octokit } from '@octokit/rest';
import {
  GitHubClientConfig,
  GitHubApiResponse,
  GitHubRateLimit,
  GitHubError,
} from '@/types/github';
import { RateLimiter } from './security';

/**
 * Default configuration for GitHub client
 */
const DEFAULT_CONFIG: GitHubClientConfig = {
  userAgent: 'claude-marketplace-aggregator/0.1.0',
  throttle: {
    enabled: true,
    limit: 5000, // requests per hour
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  retry: {
    enabled: true,
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
  },
};

/**
 * GitHub Client class with authentication, rate limiting, and retry logic
 */
export class GitHubClient {
  private octokit: Octokit;
  private config: GitHubClientConfig;
  private rateLimitInfo: GitHubRateLimit | null = null;
  private requestCount = 0;
  private lastResetTime = Date.now();
  private rateLimiter: RateLimiter;

  constructor(config: Partial<GitHubClientConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Initialize rate limiter
    this.rateLimiter = new RateLimiter(
      this.config.throttle?.limit || 5000,
      this.config.throttle?.windowMs || 60 * 60 * 1000
    );

    // Initialize Octokit with authentication and plugins
    this.octokit = new Octokit({
      auth: this.config.token || process.env.GITHUB_TOKEN,
      userAgent: this.config.userAgent,
      baseUrl: this.config.baseUrl,
      throttle: this.config.throttle?.enabled
        ? {
            onRateLimit: this.handleRateLimit.bind(this),
            onAbuseLimit: this.handleAbuseLimit.bind(this),
          }
        : undefined,
      request: {
        retries: this.config.retry?.enabled ? this.config.retry.maxRetries : 0,
        retryAfter: this.config.retry?.baseDelay || 1000,
      },
    });
  }

  /**
   * Handle rate limit exceeded
   */
  private handleRateLimit(retryAfter: number, options: any, octokit: Octokit): boolean {
    console.warn(`Rate limit exceeded. Retrying after ${retryAfter} seconds`);
    return this.config.retry?.maxRetries ? true : false;
  }

  /**
   * Handle abuse limit exceeded
   */
  private handleAbuseLimit(retryAfter: number, options: any, octokit: Octokit): void {
    console.error(`Abuse limit detected. Waiting ${retryAfter} seconds`);
  }

  /**
   * Exponential backoff retry logic
   */
  private async retryWithBackoff<T>(operation: () => Promise<T>, retryCount = 0): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      const shouldRetry = this.shouldRetry(error, retryCount);

      if (!shouldRetry) {
        throw error;
      }

      const delay = this.calculateBackoffDelay(retryCount);
      console.warn(
        `Request failed, retrying in ${delay}ms (attempt ${retryCount + 1}/${this.config.retry!.maxRetries})`
      );

      await this.sleep(delay);
      return this.retryWithBackoff(operation, retryCount + 1);
    }
  }

  /**
   * Determine if a request should be retried
   */
  private shouldRetry(error: any, retryCount: number): boolean {
    if (!this.config.retry?.enabled || retryCount >= this.config.retry.maxRetries) {
      return false;
    }

    // Retry on rate limit errors
    if (error.status === 403 && error.message?.includes('rate limit')) {
      return true;
    }

    // Retry on server errors
    if (error.status >= 500) {
      return true;
    }

    // Retry on network errors
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      return true;
    }

    return false;
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoffDelay(retryCount: number): number {
    const { baseDelay = 1000, maxDelay = 30000 } = this.config.retry || {};
    const delay = baseDelay * Math.pow(2, retryCount);
    const jitter = Math.random() * 0.1 * delay; // Add 10% jitter
    return Math.min(delay + jitter, maxDelay);
  }

  /**
   * Sleep helper for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Update rate limit information
   */
  private updateRateLimitInfo(rateLimit: GitHubRateLimit): void {
    this.rateLimitInfo = rateLimit;
    this.requestCount++;
  }

  /**
   * Execute a GitHub API request with error handling and retry logic
   */
  private async executeRequest<T>(operation: () => Promise<T>): Promise<GitHubApiResponse<T>> {
    try {
      // Check rate limit before making request
      if (!this.rateLimiter.isAllowed()) {
        const waitTime = this.rateLimiter.getTimeUntilNextRequest();
        console.warn(`Rate limit exceeded. Waiting ${Math.ceil(waitTime / 1000)} seconds...`);

        if (waitTime > 0) {
          await this.sleep(waitTime);
        }

        // Check again after waiting
        if (!this.rateLimiter.isAllowed()) {
          return {
            success: false,
            error: {
              message: 'Rate limit exceeded. Please try again later.',
            },
            rateLimit: this.rateLimitInfo || undefined,
          };
        }
      }

      const result = await this.retryWithBackoff(operation);

      // Try to extract rate limit info from response headers
      if (result && typeof result === 'object' && 'headers' in result) {
        const rateLimit = this.extractRateLimitFromHeaders((result as any).headers);
        if (rateLimit) {
          this.updateRateLimitInfo(rateLimit);
        }
      }

      return {
        success: true,
        data: result,
        rateLimit: this.rateLimitInfo || undefined,
      };
    } catch (error: any) {
      console.error('GitHub API request failed:', error);

      return {
        success: false,
        error: {
          message: error.message || 'Unknown GitHub API error',
          documentation_url: error.documentation_url,
          errors: error.errors,
        },
        rateLimit: this.rateLimitInfo || undefined,
      };
    }
  }

  /**
   * Extract rate limit information from response headers
   */
  private extractRateLimitFromHeaders(headers: any): GitHubRateLimit | null {
    try {
      return {
        resources: {
          core: {
            limit: parseInt(headers['x-ratelimit-limit'] || '0'),
            remaining: parseInt(headers['x-ratelimit-remaining'] || '0'),
            reset: parseInt(headers['x-ratelimit-reset'] || '0'),
            used: parseInt(headers['x-ratelimit-used'] || '0'),
          },
          search: {
            limit: parseInt(headers['x-ratelimit-limit-search'] || '0'),
            remaining: parseInt(headers['x-ratelimit-remaining-search'] || '0'),
            reset: parseInt(headers['x-ratelimit-reset-search'] || '0'),
            used: parseInt(headers['x-ratelimit-used-search'] || '0'),
          },
        },
        rate: {
          limit: parseInt(headers['x-ratelimit-limit'] || '0'),
          remaining: parseInt(headers['x-ratelimit-remaining'] || '0'),
          reset: parseInt(headers['x-ratelimit-reset'] || '0'),
          used: parseInt(headers['x-ratelimit-used'] || '0'),
        },
      };
    } catch (error) {
      console.warn('Failed to extract rate limit from headers:', error);
      return null;
    }
  }

  /**
   * Get current rate limit information
   */
  async getRateLimit(): Promise<GitHubApiResponse<GitHubRateLimit>> {
    return this.executeRequest(async () => {
      const response = await this.octokit.rateLimit.get();
      this.updateRateLimitInfo(response.data);
      return response.data;
    });
  }

  /**
   * Search repositories
   */
  async searchRepositories(params: any): Promise<GitHubApiResponse<any>> {
    return this.executeRequest(async () => {
      const response = await this.octokit.search.repos(params);
      return response.data;
    });
  }

  /**
   * Get repository information
   */
  async getRepository(owner: string, repo: string): Promise<GitHubApiResponse<any>> {
    return this.executeRequest(async () => {
      const response = await this.octokit.repos.get({ owner, repo });
      return response.data;
    });
  }

  /**
   * Get repository content
   */
  async getRepositoryContent(
    owner: string,
    repo: string,
    path: string,
    ref?: string
  ): Promise<GitHubApiResponse<any>> {
    return this.executeRequest(async () => {
      const response = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
        ref,
      });
      return response.data;
    });
  }

  /**
   * Get repository commits
   */
  async getCommits(
    owner: string,
    repo: string,
    options: any = {}
  ): Promise<GitHubApiResponse<any>> {
    return this.executeRequest(async () => {
      const response = await this.octokit.repos.listCommits({
        owner,
        repo,
        ...options,
      });
      return response.data;
    });
  }

  /**
   * Get repository languages
   */
  async getLanguages(owner: string, repo: string): Promise<GitHubApiResponse<any>> {
    return this.executeRequest(async () => {
      const response = await this.octokit.repos.listLanguages({ owner, repo });
      return response.data;
    });
  }

  /**
   * Get repository contributors
   */
  async getContributors(
    owner: string,
    repo: string,
    options: any = {}
  ): Promise<GitHubApiResponse<any>> {
    return this.executeRequest(async () => {
      const response = await this.octokit.repos.listContributors({
        owner,
        repo,
        ...options,
      });
      return response.data;
    });
  }

  /**
   * Get user/organization information
   */
  async getUser(username: string): Promise<GitHubApiResponse<any>> {
    return this.executeRequest(async () => {
      const response = await this.octokit.users.getByUsername({ username });
      return response.data;
    });
  }

  /**
   * Check if the client is authenticated
   */
  isAuthenticated(): boolean {
    return !!(this.config.token || process.env.GITHUB_TOKEN);
  }

  /**
   * Get current rate limit status
   */
  getRateLimitStatus(): GitHubRateLimit | null {
    return this.rateLimitInfo;
  }

  /**
   * Get request statistics
   */
  getRequestStats(): { requestCount: number; lastResetTime: number } {
    return {
      requestCount: this.requestCount,
      lastResetTime: this.lastResetTime,
    };
  }

  /**
   * Reset request statistics
   */
  resetRequestStats(): void {
    this.requestCount = 0;
    this.lastResetTime = Date.now();
  }

  /**
   * Get the raw Octokit instance for advanced usage
   */
  getOctokit(): Octokit {
    return this.octokit;
  }

  /**
   * Get application-level rate limiter status
   */
  getRateLimiterStatus(): {
    remainingRequests: number;
    timeUntilNextRequest: number;
    isAllowed: boolean;
  } {
    return {
      remainingRequests: this.rateLimiter.getRemainingRequests(),
      timeUntilNextRequest: this.rateLimiter.getTimeUntilNextRequest(),
      isAllowed: this.rateLimiter.isAllowed(),
    };
  }

  /**
   * Reset the application-level rate limiter
   */
  resetRateLimiter(): void {
    this.rateLimiter.reset();
  }
}

/**
 * Create a default GitHub client instance
 */
export function createGitHubClient(config?: Partial<GitHubClientConfig>): GitHubClient {
  return new GitHubClient(config);
}

/**
 * Singleton instance for the application
 */
let defaultGitHubClient: GitHubClient | null = null;

/**
 * Get the default GitHub client instance
 */
export function getDefaultGitHubClient(): GitHubClient {
  if (!defaultGitHubClient) {
    defaultGitHubClient = new GitHubClient();
  }
  return defaultGitHubClient;
}
