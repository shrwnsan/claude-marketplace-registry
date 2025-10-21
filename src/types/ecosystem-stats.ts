/**
 * Ecosystem Statistics Types
 *
 * Comprehensive type definitions for the Claude Code ecosystem statistics system.
 * This file contains all interfaces, types, and utilities for handling ecosystem-wide metrics,
 * growth trends, category analytics, community insights, and quality indicators.
 *
 * @fileoverview TypeScript foundation for ecosystem statistics
 * @author Claude Marketplace Team
 * @version 1.0.0
 * @since 2025-10-21
 */

import { z } from 'zod';

// ============================================================================
// CORE ECOSYSTEM DATA INTERFACES
// ============================================================================

/**
 * Main ecosystem overview metrics
 * Provides a high-level summary of the entire Claude Code plugin ecosystem
 *
 * @example
 * ```typescript
 * const overview: EcosystemOverview = {
 *   totalPlugins: 1250,
 *   totalMarketplaces: 15,
 *   totalDevelopers: 340,
 *   totalDownloads: 48200,
 *   lastUpdated: "2025-10-21T10:30:00Z",
 *   growthRate: {
 *     plugins: 15.2, // percentage growth over last 30 days
 *     marketplaces: 7.1,
 *     developers: 12.8,
 *     downloads: 23.4
 *   }
 * };
 * ```
 */
export interface EcosystemOverview {
  /** Total number of unique plugins across all marketplaces */
  totalPlugins: number;

  /** Total number of active marketplaces in the ecosystem */
  totalMarketplaces: number;

  /** Total number of unique plugin developers */
  totalDevelopers: number;

  /** Total download count across all plugins (aggregated) */
  totalDownloads: number;

  /** ISO timestamp when the data was last updated */
  lastUpdated: string;

  /** Growth rates over the last 30 days (percentages) */
  growthRate: {
    plugins: number;
    marketplaces: number;
    developers: number;
    downloads: number;
  };

  /** Ecosystem health score (0-100) */
  healthScore?: number;

  /** Number of active users (estimated) */
  activeUsers?: number;
}

/**
 * Time-series data point for trend analysis
 * Represents a single data point in a growth trend timeline
 */
export interface TrendDataPoint {
  /** ISO date string for the data point */
  date: string;

  /** Value at this point in time */
  value: number;

  /** Change from previous period (optional) */
  change?: number;

  /** Additional metadata for this data point */
  metadata?: Record<string, unknown>;
}

/**
 * Growth trends over time for different ecosystem metrics
 * Provides historical data and trend analysis for ecosystem growth
 *
 * @example
 * ```typescript
 * const trends: GrowthTrends = {
 *   plugins: [
 *     { date: "2025-09-21", value: 1080 },
 *     { date: "2025-09-28", value: 1150, change: 70 },
 *     { date: "2025-10-05", value: 1200, change: 50 },
 *     { date: "2025-10-21", value: 1250, change: 50 }
 *   ],
 *   period: '30d',
 *   aggregation: 'weekly'
 * };
 * ```
 */
export interface GrowthTrends {
  /** Plugin count growth over time */
  plugins: TrendDataPoint[];

  /** Marketplace count growth over time */
  marketplaces: TrendDataPoint[];

  /** Developer count growth over time */
  developers: TrendDataPoint[];

  /** Download count growth over time */
  downloads: TrendDataPoint[];

  /** Time period for these trends */
  period: '7d' | '30d' | '90d' | '1y';

  /** How data is aggregated */
  aggregation: 'daily' | 'weekly' | 'monthly';

  /** Predictions for future growth (optional) */
  predictions?: {
    plugins: TrendDataPoint[];
    marketplaces: TrendDataPoint[];
  };
}

/**
 * Category breakdown and analytics
 * Provides insights into plugin distribution across different categories
 */
export interface CategoryData {
  /** Category identifier */
  id: string;

  /** Human-readable category name */
  name: string;

  /** Number of plugins in this category */
  count: number;

  /** Percentage of total plugins */
  percentage: number;

  /** Growth rate for this category */
  growthRate: number;

  /** Top plugins in this category */
  topPlugins: Array<{
    id: string;
    name: string;
    downloads: number;
    rating?: number;
  }>;

  /** Whether this category is currently trending */
  trending: boolean;

  /** Category description */
  description?: string;
}

/**
 * Category analytics and insights
 * Comprehensive analysis of plugin categories and their performance
 *
 * @example
 * ```typescript
 * const analytics: CategoryAnalytics = {
 *   categories: [
 *     {
 *       id: 'development',
 *       name: 'Development Tools',
 *       count: 450,
 *       percentage: 36.0,
 *       growthRate: 18.2,
 *       topPlugins: [],
 *       trending: true
 *     }
 *   ],
 *   trending: ['development', 'ai-ml'],
 *   emerging: ['productivity', 'testing'],
 *   insights: ['AI tools saw 45% growth this month']
 * };
 * ```
 */
export interface CategoryAnalytics {
  /** All categories with their metrics */
  categories: CategoryData[];

  /** Currently trending categories (highest growth) */
  trending: string[];

  /** Emerging categories (rapid recent growth) */
  emerging: string[];

  /** Under-served categories (high opportunity) */
  underserved?: string[];

  /** AI-generated insights about categories */
  insights: string[];

  /** Category performance comparison */
  performance?: {
    bestPerforming: string;
    fastestGrowing: string;
    mostPopular: string;
  };
}

/**
 * Community participation and engagement metrics
 * Provides insights into developer and user engagement within the ecosystem
 */
export interface CommunityData {
  /** Total number of active developers */
  activeDevelopers: number;

  /** Developer participation metrics */
  developerParticipation: {
    /** New developers this month */
    newDevelopers: number;

    /** Developers contributing to multiple plugins */
    multiPluginDevelopers: number;

    /** Developer retention rate (percentage) */
    retentionRate: number;

    /** Average contributions per developer */
    avgContributions: number;
  };

  /** Geographic distribution (if available) */
  geographicDistribution?: Array<{
    country: string;
    count: number;
    percentage: number;
  }>;

  /** Community engagement metrics */
  engagement: {
    /** Average rating across all plugins */
    avgRating: number;

    /** Total number of reviews/ratings */
    totalReviews: number;

    /** Number of active discussions/issues */
    activeDiscussions: number;

    /** Community contributions (PRs, issues, etc.) */
    contributions: number;
  };

  /** Top contributors in the ecosystem */
  topContributors?: Array<{
    username: string;
    contributions: number;
    plugins: string[];
    avatar?: string;
  }>;
}

/**
 * Quality indicators and trust signals
 * Provides metrics about ecosystem quality, verification, and maintenance
 */
export interface QualityIndicators {
  /** Verification status breakdown */
  verification: {
    /** Number of verified plugins */
    verifiedPlugins: number;

    /** Percentage of verified plugins */
    verificationRate: number;

    /** Verification badges earned */
    badges: Array<{
      type: 'security' | 'quality' | 'popularity' | 'maintenance';
      count: number;
    }>;
  };

  /** Maintenance and activity indicators */
  maintenance: {
    /** Plugins updated in last 30 days */
    recentlyUpdated: number;

    /** Percentage of actively maintained plugins */
    activeMaintenanceRate: number;

    /** Average time between updates (days) */
    avgUpdateFrequency: number;

    /** Abandoned plugins (no updates in 6+ months) */
    abandonedPlugins: number;
  };

  /** Quality metrics based on automated analysis */
  qualityMetrics: {
    /** Average quality score across all plugins */
    avgQualityScore: number;

    /** Number of plugins with high quality (80+ score) */
    highQualityPlugins: number;

    /** Common quality issues found */
    commonIssues: Array<{
      issue: string;
      frequency: number;
      severity: 'low' | 'medium' | 'high';
    }>;
  };

  /** Security indicators */
  security?: {
    /** Plugins with security scan reports */
    scannedPlugins: number;

    /** Critical security issues found */
    criticalIssues: number;

    /** Security score for the ecosystem */
    securityScore: number;
  };
}

/**
 * Individual marketplace data
 * Extended marketplace interface with ecosystem-specific metrics
 */
export interface MarketplaceData {
  /** Base marketplace information */
  marketplace: {
    id: string;
    name: string;
    description: string;
    url: string;
    verified: boolean;
    qualityScore: number;
  };

  /** Plugin statistics for this marketplace */
  pluginStats: {
    totalPlugins: number;
    verifiedPlugins: number;
    avgDownloadsPerPlugin: number;
    avgQualityScore: number;
  };

  /** Growth metrics for this marketplace */
  growth: {
    newPluginsThisMonth: number;
    growthRate: number;
    trendDirection: 'up' | 'down' | 'stable';
  };

  /** Community metrics for this marketplace */
  community: {
    activeDevelopers: number;
    totalContributors: number;
    avgRating: number;
  };

  /** Last updated timestamp */
  lastUpdated: string;
}

/**
 * Individual plugin data
 * Extended plugin interface with ecosystem-specific metrics
 */
export interface PluginData {
  /** Base plugin information */
  plugin: {
    id: string;
    name: string;
    description: string;
    version?: string;
    author?: string;
    category?: string;
    marketplaceId: string;
    marketplaceName: string;
  };

  /** Popularity metrics */
  popularity: {
    downloads: number;
    stars?: number;
    forks?: number;
    rating?: number;
    reviewCount?: number;
  };

  /** Quality and maintenance metrics */
  quality: {
    qualityScore: number;
    verified: boolean;
    lastUpdated: string;
    updateFrequency: number; // days between updates
    hasSecurityScan: boolean;
    securityScore?: number;
  };

  /** Community engagement */
  engagement: {
    activeIssues?: number;
    activePRs?: number;
    communityContributions?: number;
    discussionActivity?: number;
  };

  /** Usage analytics (if available) */
  usage?: {
    activeUsers?: number;
    avgSessionDuration?: number;
    retentionRate?: number;
  };
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Standard API response wrapper for ecosystem data
 * Provides consistent structure for all ecosystem statistics API responses
 */
export interface EcosystemStatsResponse<T = any> {
  /** Whether the request was successful */
  success: boolean;

  /** Response data (if successful) */
  data?: T;

  /** Error information (if unsuccessful) */
  error?: EcosystemError;

  /** Response metadata */
  meta: {
    /** Response timestamp */
    timestamp: string;

    /** Request ID for tracking */
    requestId: string;

    /** Response time in milliseconds */
    responseTime: number;

    /** Cache information */
    cache?: CacheInfo;
  };
}

/**
 * Error information for failed API responses
 */
export interface EcosystemError {
  /** Error code for programmatic handling */
  code: string;

  /** Human-readable error message */
  message: string;

  /** Detailed error description */
  details?: string;

  /** Suggested actions for the user */
  suggestions?: string[];

  /** Stack trace (development only) */
  stack?: string;
}

/**
 * Cache metadata for API responses
 */
export interface CacheInfo {
  /** Whether this response was served from cache */
  hit: boolean;

  /** Cache TTL in seconds */
  ttl: number;

  /** When the cache will expire */
  expiresAt?: string;

  /** Cache key used */
  key?: string;
}

/**
 * Pagination information for large datasets
 */
export interface PaginationInfo {
  /** Current page number (1-based) */
  page: number;

  /** Items per page */
  limit: number;

  /** Total number of items */
  total: number;

  /** Total number of pages */
  totalPages: number;

  /** Whether there's a next page */
  hasNext: boolean;

  /** Whether there's a previous page */
  hasPrev: boolean;

  /** Offset for API calls */
  offset: number;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> extends EcosystemStatsResponse<T[]> {
  /** Pagination information */
  pagination: PaginationInfo;
}

/**
 * Last updated information for different data types
 */
export interface LastUpdated {
  /** When overview data was last updated */
  overview: string;

  /** When growth trends were last calculated */
  growthTrends: string;

  /** When category analytics were last updated */
  categoryAnalytics: string;

  /** When community data was last refreshed */
  communityData: string;

  /** When quality indicators were last calculated */
  qualityIndicators: string;

  /** When marketplace data was last synced */
  marketplaceData: string;

  /** When plugin data was last updated */
  pluginData: string;
}

// ============================================================================
// QUERY AND FILTER TYPES
// ============================================================================

/**
 * Query parameters for ecosystem statistics API
 */
export interface EcosystemStatsQuery {
  /** Which data sections to include */
  sections?: Array<
    'overview' | 'growthTrends' | 'categoryAnalytics' |
    'communityData' | 'qualityIndicators' | 'marketplaceData' | 'pluginData'
  >;

  /** Time period for trend data */
  period?: '7d' | '30d' | '90d' | '1y';

  /** Data aggregation level */
  aggregation?: 'daily' | 'weekly' | 'monthly';

  /** Include predictions in response */
  includePredictions?: boolean;

  /** Force refresh (bypass cache) */
  forceRefresh?: boolean;

  /** Response format */
  format?: 'json' | 'csv' | 'xml';
}

/**
 * Filters for marketplace data queries
 */
export interface MarketplaceFilter {
  /** Filter by verification status */
  verified?: boolean;

  /** Filter by minimum plugin count */
  minPlugins?: number;

  /** Filter by minimum quality score */
  minQualityScore?: number;

  /** Filter by marketplace tags */
  tags?: string[];

  /** Sort order */
  sortBy?: 'name' | 'pluginCount' | 'qualityScore' | 'growthRate';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Filters for plugin data queries
 */
export interface PluginFilter {
  /** Filter by category */
  category?: string;

  /** Filter by marketplace */
  marketplaceId?: string;

  /** Filter by verification status */
  verified?: boolean;

  /** Filter by minimum quality score */
  minQualityScore?: number;

  /** Filter by minimum downloads */
  minDownloads?: number;

  /** Filter by tags */
  tags?: string[];

  /** Sort order */
  sortBy?: 'name' | 'downloads' | 'qualityScore' | 'lastUpdated';
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// CHART AND VISUALIZATION TYPES
// ============================================================================

/**
 * Chart data configuration for different visualization types
 */
export interface ChartData {
  /** Chart type */
  type: 'line' | 'bar' | 'pie' | 'donut' | 'area' | 'scatter';

  /** Chart title */
  title: string;

  /** X-axis configuration */
  xAxis?: {
    label: string;
    type: 'category' | 'datetime' | 'linear';
    format?: string;
  };

  /** Y-axis configuration */
  yAxis?: {
    label: string;
    type: 'linear' | 'logarithmic';
    format?: string;
    min?: number;
    max?: number;
  };

  /** Data series */
  series: Array<{
    name: string;
    data: Array<[string | number, number]> | TrendDataPoint[];
    color?: string;
    type?: 'line' | 'bar' | 'area';
  }>;

  /** Chart options */
  options?: {
    responsive?: boolean;
    interactive?: boolean;
    animation?: boolean;
    legend?: boolean;
    grid?: boolean;
    tooltips?: boolean;
  };
}

/**
 * Chart formatting utilities
 */
export interface ChartFormatting {
  /** Number formatting options */
  numberFormat: {
    /** Use K, M, B notation for large numbers */
    compact?: boolean;

    /** Number of decimal places */
    decimals?: number;

    /** Include thousands separator */
    thousandsSeparator?: boolean;

    /** Prefix for numbers */
    prefix?: string;

    /** Suffix for numbers */
    suffix?: string;
  };

  /** Date formatting options */
  dateFormat: {
    /** Date format string */
    format?: string;

    /** Use relative dates (e.g., "2 days ago") */
    relative?: boolean;

    /** Time zone */
    timezone?: string;
  };
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Partial update type for ecosystem data
 * Allows partial updates to ecosystem statistics
 */
export type PartialEcosystemUpdate = Partial<
  Pick<EcosystemOverview, 'totalPlugins' | 'totalMarketplaces' | 'totalDevelopers' | 'totalDownloads'>
> & {
  /** Update timestamp */
  lastUpdated: string;
};

/**
 * Optional fields for ecosystem overview
 * Makes all fields in EcosystemOverview optional
 */
export type OptionalEcosystemOverview = Partial<EcosystemOverview>;

/**
 * Deep readonly type for immutable ecosystem data
 */
export type ReadonlyEcosystemStats = Readonly<{
  overview: EcosystemOverview;
  growthTrends: GrowthTrends;
  categoryAnalytics: CategoryAnalytics;
  communityData: CommunityData;
  qualityIndicators: QualityIndicators;
  lastUpdated: LastUpdated;
}>;

/**
 * Export-friendly types for public APIs
 * Strips internal implementation details
 */
export interface PublicEcosystemStats {
  /** Basic overview metrics */
  overview: {
    totalPlugins: number;
    totalMarketplaces: number;
    totalDevelopers: number;
    totalDownloads: number;
    lastUpdated: string;
  };

  /** Growth data */
  growth: {
    currentPeriod: TrendDataPoint[];
    previousPeriod: TrendDataPoint[];
  };

  /** Top categories */
  categories: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;

  /** Quality summary */
  quality: {
    verificationRate: number;
    avgQualityScore: number;
    activeMaintenanceRate: number;
  };
}

/**
 * Type guards for runtime type checking
 */
export const isEcosystemOverview = (obj: unknown): obj is EcosystemOverview => {
  return typeof obj === 'object' && obj !== null &&
         'totalPlugins' in obj && typeof (obj as any).totalPlugins === 'number' &&
         'totalMarketplaces' in obj && typeof (obj as any).totalMarketplaces === 'number' &&
         'totalDevelopers' in obj && typeof (obj as any).totalDevelopers === 'number' &&
         'totalDownloads' in obj && typeof (obj as any).totalDownloads === 'number' &&
         'lastUpdated' in obj && typeof (obj as any).lastUpdated === 'string';
};

export const isTrendDataPoint = (obj: unknown): obj is TrendDataPoint => {
  return typeof obj === 'object' && obj !== null &&
         'date' in obj && typeof (obj as any).date === 'string' &&
         'value' in obj && typeof (obj as any).value === 'number';
};

export const isGrowthTrends = (obj: unknown): obj is GrowthTrends => {
  return typeof obj === 'object' && obj !== null &&
         'plugins' in obj && Array.isArray((obj as any).plugins) &&
         'marketplaces' in obj && Array.isArray((obj as any).marketplaces) &&
         'period' in obj && ['7d', '30d', '90d', '1y'].includes((obj as any).period);
};

// ============================================================================
// EXPORTS
// ============================================================================