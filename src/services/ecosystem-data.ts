/**
 * Ecosystem Data Collection Service
 *
 * This service is responsible for collecting and aggregating data from multiple
 * Claude Code plugin marketplaces to provide comprehensive ecosystem statistics.
 *
 * Key Features:
 * - Data collection from multiple marketplace repositories
 * - Data validation and normalization
 * - Error handling for failed marketplace fetches
 * - Mock data generation for testing and development
 * - GitHub API integration with rate limiting
 * - Caching for performance optimization
 *
 * @author Claude Code Marketplace Team
 * @version 1.0.0
 */

import { Marketplace, Plugin } from '../types';
import { createLogger } from '@/utils/logger';

const logger = createLogger('EcosystemDataService');

/**
 * Interface for raw marketplace data from GitHub API
 */
export interface RawMarketplaceData {
  id: string;
  name: string;
  description: string;
  owner: {
    login: string;
    type: string;
    url: string;
  };
  stargazers_count: number;
  forks_count: number;
  created_at: string;
  updated_at: string;
  language: string;
  license?: {
    key: string;
    name: string;
    spdx_id: string;
  };
  default_branch: string;
  open_issues_count: number;
  topics: string[];
  html_url: string;
  clone_url: string;
}

/**
 * Interface for raw plugin manifest data
 */
export interface RawPluginManifest {
  name: string;
  description: string;
  version?: string;
  author?: string;
  homepage?: string;
  repository?: string;
  license?: string;
  keywords?: string[];
  category?: string;
  tags?: string[];
  commands?: string[];
  agents?: string[];
  hooks?: Record<string, unknown>;
  mcpServers?: Record<string, unknown>;
  source?: {
    type: 'github' | 'url';
    url: string;
    path?: string;
  };
}

/**
 * Interface for collection results with metadata
 */
export interface CollectionResult<T> {
  data: T[];
  errors: string[];
  warnings: string[];
  metadata: {
    totalItems: number;
    successfulItems: number;
    failedItems: number;
    collectionTime: string;
    sources: string[];
  };
}

/**
 * Configuration for data collection
 */
export interface CollectionConfig {
  /** Include mock data for testing */
  includeMockData: boolean;
  /** Maximum number of concurrent API calls */
  maxConcurrentCalls: number;
  /** Timeout for individual API calls (ms) */
  apiTimeout: number;
  /** Enable GitHub API calls */
  enableGitHubApi: boolean;
  /** Cache TTL in minutes */
  cacheTTL: number;
  /** Enable detailed logging */
  enableDebugLogging: boolean;
}

/**
 * Default configuration for data collection
 */
const DEFAULT_CONFIG: CollectionConfig = {
  includeMockData: true,
  maxConcurrentCalls: 5,
  apiTimeout: 10000,
  enableGitHubApi: true,
  cacheTTL: 360, // 6 hours
  enableDebugLogging: true,
};

/**
 * Mock marketplace repositories for development and testing
 * These represent known marketplace repositories in the Claude Code ecosystem
 */
const MOCK_MARKETPLACE_REPOS = [
  {
    owner: 'anthropic',
    repo: 'claude-marketplace',
    manifestUrl: 'https://raw.githubusercontent.com/anthropic/claude-marketplace/main/marketplace.json',
    description: 'Official Claude Marketplace by Anthropic',
  },
  {
    owner: 'claude-community',
    repo: 'claude-plugins',
    manifestUrl: 'https://raw.githubusercontent.com/claude-community/claude-plugins/main/marketplace.json',
    description: 'Community-curated Claude plugins collection',
  },
  {
    owner: 'awesome-claude',
    repo: 'awesome-claude',
    manifestUrl: 'https://raw.githubusercontent.com/awesome-claude/awesome-claude/main/marketplace.json',
    description: 'Curated list of awesome Claude resources',
  },
  {
    owner: 'claude-dev-tools',
    repo: 'marketplace',
    manifestUrl: 'https://raw.githubusercontent.com/claude-dev-tools/marketplace/main/marketplace.json',
    description: 'Developer tools marketplace for Claude',
  },
  {
    owner: 'claude-ai-hub',
    repo: 'plugins',
    manifestUrl: 'https://raw.githubusercontent.com/claude-ai-hub/plugins/main/marketplace.json',
    description: 'AI-powered plugins and extensions',
  },
];

/**
 * Mock plugin data for development
 */
const MOCK_PLUGINS: Plugin[] = [
  {
    id: 'code-review-assistant',
    name: 'Code Review Assistant',
    description: 'Automated code review suggestions and best practices enforcement',
    version: '2.1.0',
    author: 'Claude Dev Team',
    homepage: 'https://github.com/claude-dev/code-review-assistant',
    repository: 'https://github.com/claude-dev/code-review-assistant',
    license: 'MIT',
    keywords: ['code-review', 'automation', 'best-practices'],
    category: 'Development Tools',
    tags: ['code-review', 'automation', 'best-practices', 'quality-assurance'],
    commands: ['review', 'suggest', 'analyze'],
    agents: ['claude-sonnet', 'claude-opus'],
    source: {
      type: 'github',
      url: 'https://github.com/claude-dev/code-review-assistant',
    },
    marketplaceId: 'official-claude-marketplace',
    validated: true,
    qualityScore: 92,
    lastScanned: new Date().toISOString(),
  },
  {
    id: 'api-documentation-generator',
    name: 'API Documentation Generator',
    description: 'Automatically generate comprehensive API documentation from code',
    version: '1.8.2',
    author: 'DocGen Inc',
    homepage: 'https://github.com/docgen/api-docs-generator',
    repository: 'https://github.com/docgen/api-docs-generator',
    license: 'Apache-2.0',
    keywords: ['api', 'documentation', 'openapi'],
    category: 'Documentation',
    tags: ['api', 'documentation', 'openapi', 'auto-generation'],
    commands: ['generate-docs', 'validate-spec'],
    agents: ['claude-sonnet'],
    source: {
      type: 'github',
      url: 'https://github.com/docgen/api-docs-generator',
    },
    marketplaceId: 'community-claude-plugins',
    validated: false,
    qualityScore: 78,
    lastScanned: new Date().toISOString(),
  },
  // Add more mock plugins as needed
];

/**
 * In-memory cache for data collection results
 */
class DataCache {
  private cache = new Map<string, { data: CollectionResult<Marketplace | Plugin>; timestamp: number; ttl: number }>();
  private keys = new Set<string>();

  set(key: string, data: CollectionResult<Marketplace | Plugin>, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
    this.keys.add(key);
  }

  get(key: string): CollectionResult<Marketplace | Plugin> | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      this.keys.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
    this.keys.clear();
  }

  delete(key: string): boolean {
    this.keys.delete(key);
    return this.cache.delete(key);
  }

  size(): number {
    return this.cache.size;
  }

  getKeys(): string[] {
    return Array.from(this.keys);
  }
}

const dataCache = new DataCache();

/**
 * Ecosystem Data Collection Service
 *
 * Main service class for collecting ecosystem data from multiple sources
 */
export class EcosystemDataService {
  private config: CollectionConfig;

  constructor(config: Partial<CollectionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    if (this.config.enableDebugLogging) {
      logger.debug('EcosystemDataService initialized with config:', this.config);
    }
  }

  /**
   * Collect marketplace data from all configured sources
   *
   * @param refreshCache - Force refresh of cached data
   * @returns Collection result with marketplaces and metadata
   */
  async collectMarketplaces(refreshCache = false): Promise<CollectionResult<Marketplace>> {
    const cacheKey = 'ecosystem-marketplaces';

    if (!refreshCache) {
      const cached = dataCache.get(cacheKey);
      if (cached) {
        logger.debug('Returning cached marketplace data');
        return cached;
      }
    }

    logger.info('Starting marketplace data collection...');
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    const marketplaces: Marketplace[] = [];
    const sources: string[] = [];

    try {
      // Collect from real GitHub repositories if enabled
      if (this.config.enableGitHubApi) {
        logger.debug('Collecting from GitHub repositories...');
        const githubResults = await this.collectFromGitHubRepos();
        marketplaces.push(...githubResults.data);
        errors.push(...githubResults.errors);
        warnings.push(...githubResults.warnings);
        sources.push(...githubResults.metadata.sources);
      }

      // Add mock data if enabled
      if (this.config.includeMockData) {
        logger.debug('Adding mock marketplace data...');
        const mockMarketplaces = this.generateMockMarketplaces();
        marketplaces.push(...mockMarketplaces);
        sources.push('mock-data');
        warnings.push('Mock data included for development/testing purposes');
      }

      const collectionTime = Date.now() - startTime;
      const result: CollectionResult<Marketplace> = {
        data: marketplaces,
        errors,
        warnings,
        metadata: {
          totalItems: MOCK_MARKETPLACE_REPOS.length,
          successfulItems: marketplaces.length,
          failedItems: errors.length,
          collectionTime: `${collectionTime}ms`,
          sources,
        },
      };

      // Cache the results
      dataCache.set(cacheKey, result, this.config.cacheTTL * 60 * 1000);

      logger.info(`Marketplace collection completed: ${marketplaces.length} marketplaces in ${collectionTime}ms`);
      return result;

    } catch (error) {
      const errorMessage = `Failed to collect marketplaces: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error(errorMessage);
      errors.push(errorMessage);

      return {
        data: [],
        errors,
        warnings,
        metadata: {
          totalItems: MOCK_MARKETPLACE_REPOS.length,
          successfulItems: 0,
          failedItems: MOCK_MARKETPLACE_REPOS.length,
          collectionTime: `${Date.now() - startTime}ms`,
          sources: [],
        },
      };
    }
  }

  /**
   * Collect plugin data from all marketplaces
   *
   * @param refreshCache - Force refresh of cached data
   * @returns Collection result with plugins and metadata
   */
  async collectPlugins(refreshCache = false): Promise<CollectionResult<Plugin>> {
    const cacheKey = 'ecosystem-plugins';

    if (!refreshCache) {
      const cached = dataCache.get(cacheKey);
      if (cached) {
        logger.debug('Returning cached plugin data');
        return cached;
      }
    }

    logger.info('Starting plugin data collection...');
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    const plugins: Plugin[] = [];
    const sources: string[] = [];

    try {
      // First, get marketplaces
      const marketplaceResult = await this.collectMarketplaces(refreshCache);

      // Collect plugins from each marketplace
      for (const marketplace of marketplaceResult.data) {
        try {
          const marketplacePlugins = await this.collectPluginsFromMarketplace(marketplace);
          plugins.push(...marketplacePlugins);
          sources.push(marketplace.id);
          logger.debug(`Collected ${marketplacePlugins.length} plugins from ${marketplace.name}`);
        } catch (error) {
          const errorMsg = `Failed to collect plugins from ${marketplace.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          logger.warn(errorMsg);
        }
      }

      // Add mock plugins if enabled
      if (this.config.includeMockData) {
        logger.debug('Adding mock plugin data...');
        plugins.push(...MOCK_PLUGINS);
        sources.push('mock-plugins');
        warnings.push('Mock plugin data included for development/testing purposes');
      }

      const collectionTime = Date.now() - startTime;
      const result: CollectionResult<Plugin> = {
        data: plugins,
        errors,
        warnings,
        metadata: {
          totalItems: plugins.length,
          successfulItems: plugins.length - errors.length,
          failedItems: errors.length,
          collectionTime: `${collectionTime}ms`,
          sources,
        },
      };

      // Cache the results
      dataCache.set(cacheKey, result, this.config.cacheTTL * 60 * 1000);

      logger.info(`Plugin collection completed: ${plugins.length} plugins in ${collectionTime}ms`);
      return result;

    } catch (error) {
      const errorMessage = `Failed to collect plugins: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error(errorMessage);
      errors.push(errorMessage);

      return {
        data: [],
        errors,
        warnings,
        metadata: {
          totalItems: 0,
          successfulItems: 0,
          failedItems: 0,
          collectionTime: `${Date.now() - startTime}ms`,
          sources,
        },
      };
    }
  }

  /**
   * Collect data from GitHub repositories
   *
   * @returns Collection result from GitHub repositories
   */
  private async collectFromGitHubRepos(): Promise<CollectionResult<Marketplace>> {
    const marketplaces: Marketplace[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    const sources: string[] = [];

    // Process repositories in batches to respect rate limits
    const batchSize = this.config.maxConcurrentCalls;
    for (let i = 0; i < MOCK_MARKETPLACE_REPOS.length; i += batchSize) {
      const batch = MOCK_MARKETPLACE_REPOS.slice(i, i + batchSize);

      const batchPromises = batch.map(async (repo) => {
        try {
          const marketplace = await this.fetchMarketplaceFromGitHub(repo);
          sources.push(repo.owner + '/' + repo.repo);
          return marketplace;
        } catch (error) {
          const errorMsg = `Failed to fetch ${repo.owner}/${repo.repo}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          logger.warn(errorMsg);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      marketplaces.push(...batchResults.filter((mp): mp is Marketplace => mp !== null));
    }

    return {
      data: marketplaces,
      errors,
      warnings,
      metadata: {
        totalItems: MOCK_MARKETPLACE_REPOS.length,
        successfulItems: marketplaces.length,
        failedItems: errors.length,
        collectionTime: '0ms', // Will be set by caller
        sources,
      },
    };
  }

  /**
   * Fetch marketplace data from a GitHub repository
   *
   * @param repo - Repository configuration
   * @returns Marketplace object
   */
  private async fetchMarketplaceFromGitHub(repo: {
    owner: string;
    repo: string;
    manifestUrl: string;
    description: string;
  }): Promise<Marketplace> {
    const repoUrl = `https://api.github.com/repos/${repo.owner}/${repo.repo}`;

    // Fetch repository data
    const repoResponse = await fetch(repoUrl, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Claude-Marketplace-Registry/1.0.0',
      },
      signal: AbortSignal.timeout(this.config.apiTimeout),
    });

    if (!repoResponse.ok) {
      throw new Error(`GitHub API error: ${repoResponse.status} ${repoResponse.statusText}`);
    }

    const repoData: RawMarketplaceData = await repoResponse.json();

    // Try to fetch manifest file
    let plugins: Plugin[] = [];
    try {
      const manifestResponse = await fetch(repo.manifestUrl, {
        signal: AbortSignal.timeout(this.config.apiTimeout),
      });

      if (manifestResponse.ok) {
        const manifestData = await manifestResponse.json();
        plugins = this.parseManifestToPlugins(manifestData.plugins || [], repoData);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.warn(`Could not fetch manifest from ${repo.manifestUrl}:`, message);
    }

    // Convert to Marketplace interface
    return {
      id: `${repo.owner}-${repo.repo}`,
      name: repoData.name,
      description: repo.description,
      owner: {
        name: repoData.owner.login,
        url: repoData.owner.url,
        type: repoData.owner.type as 'User' | 'Organization',
      },
      repository: {
        url: repoData.html_url,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        createdAt: repoData.created_at,
        updatedAt: repoData.updated_at,
        language: repoData.language,
        license: repoData.license?.key,
        defaultBranch: repoData.default_branch,
        openIssues: repoData.open_issues_count,
      },
      manifestUrl: repo.manifestUrl,
      plugins,
      tags: repoData.topics,
      verified: repoData.owner.type === 'Organization', // Simple verification heuristic
      qualityScore: this.calculateMarketplaceQuality(repoData, plugins),
      lastScanned: new Date().toISOString(),
      addedAt: repoData.created_at,
    };
  }

  /**
   * Parse manifest plugins array to Plugin interfaces
   *
   * @param manifestPlugins - Raw plugin data from manifest
   * @param repoData - Repository data for context
   * @returns Array of Plugin objects
   */
  private parseManifestToPlugins(manifestPlugins: RawPluginManifest[], repoData: RawMarketplaceData): Plugin[] {
    return manifestPlugins.map((plugin, index) => ({
      id: `${repoData.owner.login}-${repoData.name}-${plugin.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name: plugin.name,
      description: plugin.description,
      version: plugin.version,
      author: plugin.author || repoData.owner.login,
      homepage: plugin.homepage,
      repository: plugin.repository || repoData.html_url,
      license: plugin.license || repoData.license?.key,
      keywords: plugin.keywords,
      category: plugin.category,
      tags: plugin.tags,
      commands: plugin.commands,
      agents: plugin.agents,
      hooks: plugin.hooks,
      mcpServers: plugin.mcpServers,
      source: plugin.source || {
        type: 'github',
        url: repoData.html_url,
      },
      marketplaceId: `${repoData.owner.login}-${repoData.name}`,
      validated: true, // Assume manifest plugins are validated
      qualityScore: 85, // Default quality score for manifest plugins
      lastScanned: new Date().toISOString(),
    }));
  }

  /**
   * Calculate quality score for a marketplace
   *
   * @param repoData - GitHub repository data
   * @param plugins - Array of plugins in the marketplace
   * @returns Quality score (0-100)
   */
  private calculateMarketplaceQuality(repoData: RawMarketplaceData, plugins: Plugin[]): number {
    let score = 0;

    // Base score from stars (max 30 points)
    score += Math.min(repoData.stargazers_count / 100, 30);

    // Fork contribution (max 15 points)
    score += Math.min(repoData.forks_count / 50, 15);

    // Plugin count contribution (max 25 points)
    score += Math.min(plugins.length * 2, 25);

    // Recent activity (max 15 points)
    const daysSinceUpdate = (Date.now() - new Date(repoData.updated_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate < 30) score += 15;
    else if (daysSinceUpdate < 90) score += 10;
    else if (daysSinceUpdate < 365) score += 5;

    // License presence (max 5 points)
    if (repoData.license) score += 5;

    // Topics/Tags (max 10 points)
    score += Math.min(repoData.topics.length * 2, 10);

    return Math.min(Math.round(score), 100);
  }

  /**
   * Collect plugins from a specific marketplace
   *
   * @param marketplace - Marketplace object
   * @returns Array of Plugin objects
   */
  private async collectPluginsFromMarketplace(marketplace: Marketplace): Promise<Plugin[]> {
    // In a real implementation, this would fetch individual plugin data
    // For now, return the plugins already loaded from the marketplace
    return marketplace.plugins;
  }

  /**
   * Generate mock marketplaces for development and testing
   *
   * @returns Array of mock Marketplace objects
   */
  private generateMockMarketplaces(): Marketplace[] {
    return MOCK_MARKETPLACE_REPOS.map((repo, index) => ({
      id: `${repo.owner}-${repo.repo}`,
      name: repo.repo
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '),
      description: repo.description,
      owner: {
        name: repo.owner,
        url: `https://github.com/${repo.owner}`,
        type: index === 0 ? 'Organization' : 'User', // First one is org, others are users
      },
      repository: {
        url: `https://github.com/${repo.owner}/${repo.repo}`,
        stars: Math.floor(Math.random() * 5000) + 100,
        forks: Math.floor(Math.random() * 500) + 50,
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        language: 'TypeScript',
        license: 'MIT',
        defaultBranch: 'main',
        openIssues: Math.floor(Math.random() * 20),
      },
      manifestUrl: repo.manifestUrl,
      plugins: [], // Will be populated separately
      tags: ['claude', 'plugins', 'ai', 'marketplace'],
      verified: index === 0, // First marketplace is verified
      qualityScore: Math.floor(Math.random() * 20) + 80, // 80-100 range
      lastScanned: new Date().toISOString(),
      addedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    }));
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    dataCache.clear();
    logger.debug('Cache cleared');
  }

  /**
   * Get cache statistics
   *
   * @returns Cache statistics object
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: dataCache.size(),
      keys: dataCache.getKeys(),
    };
  }
}

/**
 * Default instance of the ecosystem data service
 */
export const ecosystemDataService = new EcosystemDataService();

/**
 * Convenience functions for common operations
 */
export async function getEcosystemMarketplaces(refreshCache = false): Promise<CollectionResult<Marketplace>> {
  return ecosystemDataService.collectMarketplaces(refreshCache);
}

export async function getEcosystemPlugins(refreshCache = false): Promise<CollectionResult<Plugin>> {
  return ecosystemDataService.collectPlugins(refreshCache);
}

export function clearEcosystemCache(): void {
  ecosystemDataService.clearCache();
}

export function getEcosystemCacheStats(): { size: number; keys: string[] } {
  return ecosystemDataService.getCacheStats();
}