/**
 * Type definitions for the Claude Marketplace Aggregator
 * Exports all types from individual type files
 */

// Core data types
export type {
  Marketplace,
  MarketplaceListItem,
  MarketplaceCreateInput,
  MarketplaceUpdateInput,
} from './marketplace';
export type {
  Plugin,
  PluginListItem,
  PluginCreateInput,
  PluginUpdateInput,
  PluginManifest,
  PluginValidationResult,
  PluginSearchFilters,
} from './plugin';

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
  RepositorySearchFilters,
} from './github';

// Common utility types
export type {
  // Search and filtering
  SearchFilters,
  SortOptions,
  PaginationOptions,
  SearchResult,
} from './common';

// Data processing types
export type { QualityMetrics, ValidationResult, ProcessingResult, ScanResult } from './processing';

// Ecosystem Statistics types
export type {
  // Core ecosystem interfaces
  EcosystemOverview,
  GrowthTrends,
  CategoryAnalytics,
  CommunityData,
  QualityIndicators,
  MarketplaceData,
  PluginData,

  // Data point and supporting types
  TrendDataPoint,
  CategoryData,
  MarketplaceFilter,
  PluginFilter,
  ChartData,
  ChartFormatting,

  // API response types
  EcosystemStatsResponse,
  EcosystemError,
  PaginationInfo,
  PaginatedResponse,
  CacheInfo,
  LastUpdated,

  // Query and filter types
  EcosystemStatsQuery,

  // Utility types
  PartialEcosystemUpdate,
  OptionalEcosystemOverview,
  ReadonlyEcosystemStats,
  PublicEcosystemStats,

  // Type guards
  isEcosystemOverview,
  isTrendDataPoint,
  isGrowthTrends,
} from './ecosystem-stats';

// Ecosystem Statistics validation schemas
export {
  // Base schemas
  isoDateString,
  nonNegativeNumber,
  percentage,
  qualityScore,
  growthRate,
  pluginId,
  marketplaceId,
  categoryId,

  // Core schemas
  ecosystemOverviewSchema,
  growthTrendsSchema,
  categoryAnalyticsSchema,
  communityDataSchema,
  qualityIndicatorsSchema,
  marketplaceDataSchema,
  pluginDataSchema,

  // API schemas
  ecosystemStatsResponseSchema,
  paginatedResponseSchema,
  ecosystemErrorSchema,
  paginationInfoSchema,
  lastUpdatedSchema,

  // Query schemas
  ecosystemStatsQuerySchema,
  marketplaceFilterSchema,
  pluginFilterSchema,

  // Chart schemas
  chartDataSchema,
  chartFormattingSchema,

  // Validators
  validators,
  safeValidators,

  // Utilities
  createValidator,
  createSafeValidator,
  sanitizeInput,
  sanitizeStringField,
} from './ecosystem-stats-validation';

// Ecosystem Statistics utilities
export {
  // Number formatting
  formatNumber,
  formatPercentage,
  formatGrowthRate,
  formatDownloads,
  formatFileSize,

  // Date formatting
  formatDate,
  getDateRange,

  // Calculations
  calculateGrowthRate,
  calculatePercentage,
  calculateAverage,
  calculateMedian,
  calculateCAGR,

  // Data transformation
  transformTrendsToChartData,
  transformCategoriesToPieChart,
  createPublicEcosystemStats,
  aggregatePluginsByMarketplace,
  filterAndSortData,

  // Chart preparation
  prepareRechartsData,
  generateChartConfig,

  // API helpers
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,
  validateApiResponse,

  // Performance utilities
  measureExecutionTime,
  debounce,
  throttle,

  // Grouped exports
  formatters,
  calculators,
  transformers,
  apiHelpers,
  performance,
} from './ecosystem-stats-utils';

// Ecosystem Statistics test data and examples
export {
  // Mock data
  mockEcosystemOverview,
  mockGrowthTrends,
  mockCategoryAnalytics,
  mockCommunityData,
  mockQualityIndicators,
  mockMarketplaceData,
  mockPluginData,

  // API responses
  mockEcosystemStatsResponse,
  mockErrorResponse,
  mockPaginatedPluginResponse,

  // Chart data
  mockPluginGrowthChart,
  mockCategoryPieChart,
  mockMarketplaceBarChart,

  // Edge cases
  mockEmptyEcosystem,
  mockMinimalEcosystem,
  mockLargeEcosystem,

  // Helper functions
  createCompleteEcosystemStats,
  createFilteredPluginData,
  generateSampleChartData,
} from './ecosystem-stats-examples';
