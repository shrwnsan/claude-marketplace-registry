/**
 * Main entry point for Claude Marketplace Aggregator GitHub API integration
 */

// Export types explicitly
export type {
  // GitHub types
  GitHubUser,
  GitHubRepository,
  GitHubLicense,
  GitHubCommit,
  GitHubContent,
  GitHubSearchResponse,
  GitHubSearchRepositoryItem,
  GitHubRateLimit,
  GitHubError,
  RepositoryMetadata,
  GitHubApiResponse,
  GitHubClientConfig,
  GitHubSearchParams,
  ContentFetchOptions,
  RepositorySearchFilters,

  // Marketplace types
  Marketplace,
  MarketplaceListItem,
  MarketplaceCreateInput,
  MarketplaceUpdateInput,

  // Plugin types
  Plugin,
  PluginListItem,
  PluginCreateInput,
  PluginUpdateInput,
  PluginManifest,
  PluginValidationResult,
  PluginSearchFilters,
} from './types';

// Export utilities
export {
  GitHubClient,
  createGitHubClient,
  getDefaultGitHubClient,
} from './utils/github-client';

export {
  ContentFetcher,
  createContentFetcher,
  getDefaultContentFetcher,
} from './utils/content-fetcher';

// Export services
export {
  GitHubSearchService,
  createGitHubSearchService,
  getDefaultGitHubSearchService,
} from './services/github-search';

export {
  GitHubMetadataService,
  createGitHubMetadataService,
  getDefaultGitHubMetadataService,
} from './services/github-metadata';