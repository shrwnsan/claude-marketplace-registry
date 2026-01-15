/**
 * Content Fetcher Utility
 * Handles downloading and parsing manifest files from GitHub repositories
 */

import { GitHubClient, getDefaultGitHubClient } from './github-client';
import { GitHubContent, GitHubApiResponse, ContentFetchOptions } from '@/types/github';
import { validateManifest, SchemaValidationResult, ValidationContext } from './schema-validation';

/**
 * Fetched content with metadata
 */
export interface FetchedContent {
  content: string;
  encoding: string;
  size: number;
  sha: string;
  downloadUrl: string | null;
  lastModified: string;
  repository: {
    owner: string;
    repo: string;
    branch?: string;
  };
  path: string;
  fetchedAt: string;
}

/**
 * Parsed manifest data
 */
export interface ParsedManifest {
  data: any;
  format: 'json' | 'yaml' | 'toml' | 'xml' | 'text' | 'binary';
  encoding: string;
  size: number;
  isValid: boolean;
  validationErrors?: string[];
  schemaValidation?: SchemaValidationResult;
}

/**
 * Content fetcher configuration
 */
export interface ContentFetcherConfig {
  maxFileSize?: number; // bytes
  allowedEncodings?: string[];
  cacheEnabled?: boolean;
  cacheTTL?: number; // seconds
  timeout?: number; // milliseconds
  retryAttempts?: number;
  retryDelay?: number; // milliseconds
  enableSchemaValidation?: boolean;
  validationContext?: ValidationContext;
}

/**
 * Content Fetcher class
 */
export class ContentFetcher {
  private githubClient: GitHubClient;
  private config: ContentFetcherConfig;
  private cache: Map<string, { content: FetchedContent; timestamp: number }> = new Map();

  constructor(githubClient: GitHubClient, config: ContentFetcherConfig = {}) {
    this.githubClient = githubClient;
    this.config = {
      maxFileSize: 1024 * 1024, // 1MB
      allowedEncodings: ['utf-8', 'base64', 'ascii'],
      cacheEnabled: true,
      cacheTTL: 1800, // 30 minutes
      timeout: 10000, // 10 seconds
      retryAttempts: 3,
      retryDelay: 1000, // 1 second
      enableSchemaValidation: true,
      validationContext: {
        strictMode: false,
        maxSize: 1024 * 1024,
      },
      ...config,
    };
  }

  /**
   * Get cache key for content
   */
  private getCacheKey(owner: string, repo: string, path: string, ref?: string): string {
    return `${owner}/${repo}:${path}:${ref || 'default'}`;
  }

  /**
   * Get cached content or return null if not cached/expired
   */
  private getCachedContent(key: string): FetchedContent | null {
    if (!this.config.cacheEnabled) {
      return null;
    }

    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    const age = (Date.now() - cached.timestamp) / 1000;
    if (age > (this.config.cacheTTL || 1800)) {
      this.cache.delete(key);
      return null;
    }

    return cached.content;
  }

  /**
   * Cache content with timestamp
   */
  private setCachedContent(key: string, content: FetchedContent): void {
    if (!this.config.cacheEnabled) {
      return;
    }

    this.cache.set(key, {
      content,
      timestamp: Date.now(),
    });
  }

  /**
   * Validate content before fetching
   */
  private validateContent(content: GitHubContent): { valid: boolean; error?: string } {
    // Check file size
    if (content.size > (this.config.maxFileSize || 1024 * 1024)) {
      return {
        valid: false,
        error: `File size ${content.size} bytes exceeds maximum allowed size ${this.config.maxFileSize} bytes`,
      };
    }

    // Check content type
    if (content.type !== 'file') {
      return {
        valid: false,
        error: `Content type '${content.type}' is not supported. Only files are supported.`,
      };
    }

    // Check if content is available
    if (!content.content && !content.download_url) {
      return {
        valid: false,
        error: 'Content is not available. The file might be too large or binary.',
      };
    }

    return { valid: true };
  }

  /**
   * Decode content based on encoding
   */
  private decodeContent(content: GitHubContent): { decoded: string; encoding: string } {
    if (content.content && content.encoding) {
      // Base64 encoded content
      try {
        const decoded = Buffer.from(content.content, 'base64').toString('utf-8');
        return { decoded, encoding: content.encoding };
      } catch (error) {
        throw new Error(`Failed to decode content with encoding ${content.encoding}: ${error}`);
      }
    } else if (content.content) {
      // Raw content
      return { decoded: content.content, encoding: 'raw' };
    } else {
      throw new Error('No content available to decode');
    }
  }

  /**
   * Fetch content from GitHub with retry logic
   */
  private async fetchContentWithRetry(
    owner: string,
    repo: string,
    path: string,
    ref?: string,
    attempt: number = 1
  ): Promise<GitHubApiResponse<GitHubContent>> {
    try {
      return await this.githubClient.getRepositoryContent(owner, repo, path, ref);
    } catch (error: any) {
      if (attempt < (this.config.retryAttempts || 3)) {
        const delay = (this.config.retryDelay || 1000) * attempt;
        console.warn(
          `Fetch attempt ${attempt} failed for ${owner}/${repo}/${path}, retrying in ${delay}ms...`
        );
        await this.sleep(delay);
        return this.fetchContentWithRetry(owner, repo, path, ref, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Fetch raw content from a repository
   */
  async fetchContent(
    owner: string,
    repo: string,
    path: string,
    options: ContentFetchOptions = {}
  ): Promise<GitHubApiResponse<FetchedContent>> {
    try {
      const { ref, mediaType: _mediaType } = options;
      const cacheKey = this.getCacheKey(owner, repo, path, ref);

      // Check cache first
      const cached = this.getCachedContent(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
        };
      }

      console.log(`Fetching content: ${owner}/${repo}/${path} (${ref || 'default branch'})`);

      // Fetch content from GitHub
      const response = await this.fetchContentWithRetry(owner, repo, path, ref);

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error,
        };
      }

      const githubContent = response.data as GitHubContent;

      // Validate content
      const validation = this.validateContent(githubContent);
      if (!validation.valid) {
        return {
          success: false,
          error: {
            message: validation.error || 'Content validation failed',
          },
        };
      }

      // Decode content
      let decodedContent: string;
      let encoding: string;

      try {
        const decoded = this.decodeContent(githubContent);
        decodedContent = decoded.decoded;
        encoding = decoded.encoding;
      } catch (error: any) {
        return {
          success: false,
          error: {
            message: `Failed to decode content: ${error.message}`,
          },
        };
      }

      // Create fetched content object
      const fetchedContent: FetchedContent = {
        content: decodedContent,
        encoding,
        size: githubContent.size,
        sha: githubContent.sha,
        downloadUrl: githubContent.download_url,
        lastModified: new Date().toISOString(), // GitHub API doesn't provide file modification time
        repository: {
          owner,
          repo,
          branch: ref,
        },
        path: githubContent.path,
        fetchedAt: new Date().toISOString(),
      };

      // Cache the content
      this.setCachedContent(cacheKey, fetchedContent);

      return {
        success: true,
        data: fetchedContent,
      };
    } catch (error: any) {
      console.error(`Failed to fetch content ${owner}/${repo}/${path}:`, error);
      return {
        success: false,
        error: {
          message: error.message || 'Failed to fetch content',
        },
      };
    }
  }

  /**
   * Fetch marketplace.json manifest from a repository
   */
  async fetchMarketplaceManifest(
    owner: string,
    repo: string,
    options: ContentFetchOptions = {}
  ): Promise<GitHubApiResponse<FetchedContent>> {
    const manifestPath = '.claude-plugin/marketplace.json';
    return this.fetchContent(owner, repo, manifestPath, options);
  }

  /**
   * Fetch plugin manifest from a repository
   */
  async fetchPluginManifest(
    owner: string,
    repo: string,
    pluginName: string,
    options: ContentFetchOptions = {}
  ): Promise<GitHubApiResponse<FetchedContent>> {
    const manifestPath = `.claude-plugin/plugins/${pluginName}/manifest.json`;
    return this.fetchContent(owner, repo, manifestPath, options);
  }

  /**
   * Parse JSON content with error handling
   */
  parseJSON(content: string): ParsedManifest {
    try {
      const data = JSON.parse(content);
      let schemaValidation: SchemaValidationResult | undefined;

      // Perform schema validation if enabled
      if (this.config.enableSchemaValidation) {
        schemaValidation = validateManifest(content, this.config.validationContext);
      }

      return {
        data,
        format: 'json',
        encoding: 'utf-8',
        size: content.length,
        isValid: true,
        schemaValidation,
      };
    } catch (error: any) {
      return {
        data: null,
        format: 'json',
        encoding: 'utf-8',
        size: content.length,
        isValid: false,
        validationErrors: [`Invalid JSON: ${error.message}`],
      };
    }
  }

  /**
   * Parse YAML content (basic implementation)
   */
  parseYAML(content: string): ParsedManifest {
    // Note: For full YAML support, you'd want to add a YAML parser like js-yaml
    // This is a basic implementation that treats it as text
    return {
      data: content,
      format: 'yaml',
      encoding: 'utf-8',
      size: content.length,
      isValid: true,
      validationErrors: ['YAML parsing not implemented - treating as text'],
    };
  }

  /**
   * Auto-detect and parse content format
   */
  autoParseContent(fetchedContent: FetchedContent): ParsedManifest {
    const { content, path } = fetchedContent;

    // Try to detect format from file extension
    const extension = path.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'json':
        return this.parseJSON(content);

      case 'yaml':
      case 'yml':
        return this.parseYAML(content);

      case 'toml':
        // Note: Would need a TOML parser for full support
        return {
          data: content,
          format: 'toml',
          encoding: 'utf-8',
          size: content.length,
          isValid: true,
          validationErrors: ['TOML parsing not implemented - treating as text'],
        };

      case 'xml':
        // Note: Would need an XML parser for full support
        return {
          data: content,
          format: 'xml',
          encoding: 'utf-8',
          size: content.length,
          isValid: true,
          validationErrors: ['XML parsing not implemented - treating as text'],
        };

      default:
        // Try JSON as fallback for unknown extensions
        const jsonResult = this.parseJSON(content);
        if (jsonResult.isValid) {
          return jsonResult;
        }

        // Treat as text
        return {
          data: content,
          format: 'text',
          encoding: fetchedContent.encoding,
          size: content.length,
          isValid: true,
        };
    }
  }

  /**
   * Fetch and parse marketplace manifest
   */
  async fetchAndParseMarketplaceManifest(
    owner: string,
    repo: string,
    options: ContentFetchOptions = {}
  ): Promise<GitHubApiResponse<ParsedManifest>> {
    const contentResponse = await this.fetchMarketplaceManifest(owner, repo, options);

    if (!contentResponse.success || !contentResponse.data) {
      return {
        success: false,
        error: contentResponse.error,
      };
    }

    const parsed = this.autoParseContent(contentResponse.data);

    return {
      success: true,
      data: parsed,
    };
  }

  /**
   * Fetch and parse plugin manifest
   */
  async fetchAndParsePluginManifest(
    owner: string,
    repo: string,
    pluginName: string,
    options: ContentFetchOptions = {}
  ): Promise<GitHubApiResponse<ParsedManifest>> {
    const contentResponse = await this.fetchPluginManifest(owner, repo, pluginName, options);

    if (!contentResponse.success || !contentResponse.data) {
      return {
        success: false,
        error: contentResponse.error,
      };
    }

    const parsed = this.autoParseContent(contentResponse.data);

    return {
      success: true,
      data: parsed,
    };
  }

  /**
   * Check if a manifest file exists in a repository
   */
  async checkManifestExists(
    owner: string,
    repo: string,
    path: string = '.claude-plugin/marketplace.json',
    ref?: string
  ): Promise<boolean> {
    try {
      const response = await this.githubClient.getRepositoryContent(owner, repo, path, ref);
      return response.success;
    } catch {
      return false;
    }
  }

  /**
   * Fetch multiple manifests in parallel
   */
  async fetchMultipleManifests(
    repositories: Array<{ owner: string; repo: string }>,
    options: ContentFetchOptions = {}
  ): Promise<
    GitHubApiResponse<
      Array<{ owner: string; repo: string; content?: FetchedContent; error?: string }>
    >
  > {
    try {
      console.log(`Fetching manifests from ${repositories.length} repositories...`);

      const promises = repositories.map(async ({ owner, repo }) => {
        try {
          const response = await this.fetchMarketplaceManifest(owner, repo, options);
          if (response.success && response.data) {
            return { owner, repo, content: response.data };
          } else {
            return { owner, repo, error: response.error?.message || 'Failed to fetch manifest' };
          }
        } catch (error: any) {
          return { owner, repo, error: error.message || 'Unknown error' };
        }
      });

      const results = await Promise.allSettled(promises);
      const manifestResults: Array<{
        owner: string;
        repo: string;
        content?: FetchedContent;
        error?: string;
      }> = [];

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          manifestResults.push(result.value);
        } else {
          console.error('Promise rejected:', result.reason);
        }
      });

      const successful = manifestResults.filter((r) => r.content).length;
      console.log(`Successfully fetched ${successful}/${repositories.length} manifests`);

      return {
        success: true,
        data: manifestResults,
      };
    } catch (error: any) {
      console.error('Failed to fetch multiple manifests:', error);
      return {
        success: false,
        error: {
          message: error.message || 'Failed to fetch multiple manifests',
        },
      };
    }
  }

  /**
   * Sleep helper for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
   * Get content fetcher configuration
   */
  getConfig(): ContentFetcherConfig {
    return { ...this.config };
  }

  /**
   * Update content fetcher configuration
   */
  updateConfig(newConfig: Partial<ContentFetcherConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

/**
 * Create a default content fetcher instance
 */
export function createContentFetcher(
  githubClient: GitHubClient,
  config?: ContentFetcherConfig
): ContentFetcher {
  return new ContentFetcher(githubClient, config);
}

/**
 * Singleton instance for the application
 */
let defaultContentFetcher: ContentFetcher | null = null;

/**
 * Get the default content fetcher instance
 */
export function getDefaultContentFetcher(): ContentFetcher {
  if (!defaultContentFetcher) {
    const githubClient = getDefaultGitHubClient();
    defaultContentFetcher = new ContentFetcher(githubClient);
  }
  return defaultContentFetcher;
}
