/**
 * Type definitions for the Claude Marketplace Aggregator
 * Exports all types from individual type files
 */

// Core data types
export type { Marketplace, MarketplaceListItem, MarketplaceCreateInput, MarketplaceUpdateInput } from './marketplace';
export type { Plugin, PluginListItem, PluginCreateInput, PluginUpdateInput, PluginManifest, PluginValidationResult, PluginSearchFilters } from './plugin';

// GitHub API types
export type {
  GitHubUser,
  GitHubRepository,
  GitHubLicense,
  GitHubCommit,
  GitHubContent,
  GitHubSearchResponse,
  GitHubSearchRepositoryItem,
  GitHubRateLimit,
  GitHubError,
  GitHubPaginationLinks,
  RepositoryMetadata,
  GitHubSearchParams,
  ContentFetchOptions,
  GitHubApiResponse,
  GitHubClientConfig,
  RepositorySearchFilters
} from './github';

// Common utility types
export type {
  // Search and filtering
  SearchFilters,
  SortOptions,
  PaginationOptions,
  SearchResult
} from './common';

// Data processing types
export type {
  QualityMetrics,
  ValidationResult,
  ProcessingResult,
  ScanResult
} from './processing';