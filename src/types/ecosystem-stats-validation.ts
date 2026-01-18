/**
 * Ecosystem Statistics Validation Schemas
 *
 * Zod schemas for runtime validation of all ecosystem statistics data.
 * Provides type-safe validation for API responses, user input, and data processing.
 *
 * @fileoverview Runtime validation schemas for ecosystem statistics
 * @author Claude Marketplace Team
 * @version 1.0.0
 * @since 2025-10-21
 */

import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// ============================================================================
// BASE SCHEMAS
// ============================================================================

/**
 * Schema for ISO date strings
 */
export const isoDateString = z
  .string()
  .datetime()
  .refine((date) => !isNaN(Date.parse(date)), { message: 'Invalid ISO date string' });

/**
 * Schema for non-negative numbers
 */
export const nonNegativeNumber = z.number().min(0);

/**
 * Schema for percentages (0-100)
 */
export const percentage = z.number().min(0).max(100);

/**
 * Schema for quality scores (0-100)
 */
export const qualityScore = z.number().min(0).max(100);

/**
 * Schema for growth rates (can be negative)
 */
export const growthRate = z.number().min(-100).max(1000);

/**
 * Schema for plugin ID
 */
export const pluginId = z.string().min(1).max(50);

/**
 * Schema for marketplace ID
 */
export const marketplaceId = z.string().min(1).max(50);

/**
 * Schema for category ID
 */
export const categoryId = z.string().min(1).max(30);

// ============================================================================
// DATA POINT SCHEMAS
// ============================================================================

/**
 * Schema for trend data points
 */
export const trendDataPointSchema = z.object({
  date: isoDateString,
  value: nonNegativeNumber,
  change: z.number().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Schema for growth rate information
 */
export const growthRateSchema = z.object({
  plugins: growthRate,
  marketplaces: growthRate,
  developers: growthRate,
  downloads: growthRate,
});

/**
 * Schema for category data
 */
export const categoryDataSchema = z.object({
  id: categoryId,
  name: z.string().min(1).max(50),
  count: nonNegativeNumber,
  percentage: percentage,
  growthRate: growthRate,
  topPlugins: z
    .array(
      z.object({
        id: pluginId,
        name: z.string().min(1).max(100),
        downloads: nonNegativeNumber,
        rating: z.number().min(0).max(5).optional(),
      })
    )
    .max(10),
  trending: z.boolean(),
  description: z.string().max(200).optional(),
});

/**
 * Schema for verification badges
 */
export const verificationBadgeSchema = z.object({
  type: z.enum(['security', 'quality', 'popularity', 'maintenance']),
  count: nonNegativeNumber,
});

/**
 * Schema for quality issue
 */
export const qualityIssueSchema = z.object({
  issue: z.string().min(1).max(100),
  frequency: nonNegativeNumber,
  severity: z.enum(['low', 'medium', 'high']),
});

/**
 * Schema for geographic distribution
 */
export const geographicDistributionSchema = z.object({
  country: z.string().min(2).max(2), // ISO country code
  count: nonNegativeNumber,
  percentage: percentage,
});

/**
 * Schema for top contributor
 */
export const topContributorSchema = z.object({
  username: z.string().min(1).max(39), // GitHub username limit
  contributions: nonNegativeNumber,
  plugins: z.array(z.string()).max(50),
  avatar: z.string().url().optional(),
});

// ============================================================================
// CORE INTERFACE SCHEMAS
// ============================================================================

/**
 * Schema for EcosystemOverview
 */
export const ecosystemOverviewSchema = z.object({
  totalPlugins: nonNegativeNumber,
  totalMarketplaces: nonNegativeNumber,
  totalDevelopers: nonNegativeNumber,
  totalDownloads: nonNegativeNumber,
  lastUpdated: isoDateString,
  growthRate: growthRateSchema,
  healthScore: qualityScore.optional(),
  activeUsers: nonNegativeNumber.optional(),
});

/**
 * Schema for GrowthTrends
 */
export const growthTrendsSchema = z.object({
  plugins: z.array(trendDataPointSchema).min(1),
  marketplaces: z.array(trendDataPointSchema).min(1),
  developers: z.array(trendDataPointSchema).min(1),
  downloads: z.array(trendDataPointSchema).min(1),
  period: z.enum(['7d', '30d', '90d', '1y']),
  aggregation: z.enum(['daily', 'weekly', 'monthly']),
  predictions: z
    .object({
      plugins: z.array(trendDataPointSchema),
      marketplaces: z.array(trendDataPointSchema),
    })
    .optional(),
});

/**
 * Schema for CategoryAnalytics
 */
export const categoryAnalyticsSchema = z.object({
  categories: z.array(categoryDataSchema).min(1),
  trending: z.array(z.string()).max(10),
  emerging: z.array(z.string()).max(10),
  underserved: z.array(z.string()).max(10).optional(),
  insights: z.array(z.string().max(200)).max(5),
  performance: z
    .object({
      bestPerforming: z.string(),
      fastestGrowing: z.string(),
      mostPopular: z.string(),
    })
    .optional(),
});

/**
 * Schema for CommunityData
 */
export const communityDataSchema = z.object({
  activeDevelopers: nonNegativeNumber,
  developerParticipation: z.object({
    newDevelopers: nonNegativeNumber,
    multiPluginDevelopers: nonNegativeNumber,
    retentionRate: percentage,
    avgContributions: nonNegativeNumber,
  }),
  geographicDistribution: z.array(geographicDistributionSchema).optional(),
  engagement: z.object({
    avgRating: z.number().min(0).max(5),
    totalReviews: nonNegativeNumber,
    activeDiscussions: nonNegativeNumber,
    contributions: nonNegativeNumber,
  }),
  topContributors: z.array(topContributorSchema).max(20).optional(),
});

/**
 * Schema for QualityIndicators
 */
export const qualityIndicatorsSchema = z.object({
  verification: z.object({
    verifiedPlugins: nonNegativeNumber,
    verificationRate: percentage,
    badges: z.array(verificationBadgeSchema),
  }),
  maintenance: z.object({
    recentlyUpdated: nonNegativeNumber,
    activeMaintenanceRate: percentage,
    avgUpdateFrequency: nonNegativeNumber,
    abandonedPlugins: nonNegativeNumber,
  }),
  qualityMetrics: z.object({
    avgQualityScore: qualityScore,
    highQualityPlugins: nonNegativeNumber,
    commonIssues: z.array(qualityIssueSchema).max(10),
  }),
  security: z
    .object({
      scannedPlugins: nonNegativeNumber,
      criticalIssues: nonNegativeNumber,
      securityScore: qualityScore,
    })
    .optional(),
});

/**
 * Schema for MarketplaceData
 */
export const marketplaceDataSchema = z.object({
  marketplace: z.object({
    id: marketplaceId,
    name: z.string().min(1).max(100),
    description: z.string().max(500),
    url: z.string().url(),
    verified: z.boolean(),
    qualityScore: qualityScore,
  }),
  pluginStats: z.object({
    totalPlugins: nonNegativeNumber,
    verifiedPlugins: nonNegativeNumber,
    avgDownloadsPerPlugin: nonNegativeNumber,
    avgQualityScore: qualityScore,
  }),
  growth: z.object({
    newPluginsThisMonth: nonNegativeNumber,
    growthRate: growthRate,
    trendDirection: z.enum(['up', 'down', 'stable']),
  }),
  community: z.object({
    activeDevelopers: nonNegativeNumber,
    totalContributors: nonNegativeNumber,
    avgRating: z.number().min(0).max(5),
  }),
  lastUpdated: isoDateString,
});

/**
 * Schema for PluginData
 */
export const pluginDataSchema = z.object({
  plugin: z.object({
    id: pluginId,
    name: z.string().min(1).max(100),
    description: z.string().max(500),
    version: z.string().max(20).optional(),
    author: z.string().max(100).optional(),
    category: z.string().max(50).optional(),
    marketplaceId: marketplaceId,
    marketplaceName: z.string().max(100),
  }),
  popularity: z.object({
    downloads: nonNegativeNumber,
    stars: nonNegativeNumber.optional(),
    forks: nonNegativeNumber.optional(),
    rating: z.number().min(0).max(5).optional(),
    reviewCount: nonNegativeNumber.optional(),
  }),
  quality: z.object({
    qualityScore: qualityScore,
    verified: z.boolean(),
    lastUpdated: isoDateString,
    updateFrequency: nonNegativeNumber,
    hasSecurityScan: z.boolean(),
    securityScore: qualityScore.optional(),
  }),
  engagement: z.object({
    activeIssues: nonNegativeNumber.optional(),
    activePRs: nonNegativeNumber.optional(),
    communityContributions: nonNegativeNumber.optional(),
    discussionActivity: nonNegativeNumber.optional(),
  }),
  usage: z
    .object({
      activeUsers: nonNegativeNumber.optional(),
      avgSessionDuration: nonNegativeNumber.optional(),
      retentionRate: percentage.optional(),
    })
    .optional(),
});

// ============================================================================
// API RESPONSE SCHEMAS
// ============================================================================

/**
 * Schema for error information
 */
export const ecosystemErrorSchema = z.object({
  code: z.string().min(1).max(50),
  message: z.string().min(1).max(500),
  details: z.string().max(1000).optional(),
  suggestions: z.array(z.string().max(200)).max(5).optional(),
  stack: z.string().optional(),
});

/**
 * Schema for cache information
 */
export const cacheInfoSchema = z.object({
  hit: z.boolean(),
  ttl: z.number().min(0),
  expiresAt: isoDateString.optional(),
  key: z.string().optional(),
});

/**
 * Schema for response metadata
 */
export const responseMetaSchema = z.object({
  timestamp: isoDateString,
  requestId: z.string().min(1).max(50),
  responseTime: z.number().min(0),
  cache: cacheInfoSchema.optional(),
});

/**
 * Schema for pagination information
 */
export const paginationInfoSchema = z.object({
  page: z.number().min(1),
  limit: z.number().min(1).max(100),
  total: nonNegativeNumber,
  totalPages: z.number().min(0),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
  offset: z.number().min(0),
});

/**
 * Schema for last updated information
 */
export const lastUpdatedSchema = z.object({
  overview: isoDateString,
  growthTrends: isoDateString,
  categoryAnalytics: isoDateString,
  communityData: isoDateString,
  qualityIndicators: isoDateString,
  marketplaceData: isoDateString,
  pluginData: isoDateString,
});

/**
 * Schema for EcosystemStatsResponse
 */
export const ecosystemStatsResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z
    .object({
      success: z.boolean(),
      data: dataSchema.optional(),
      error: ecosystemErrorSchema.optional(),
      meta: responseMetaSchema,
    })
    .refine(
      (data) => {
        // Either data or error must be present, but not both
        const hasData = data.data !== undefined;
        const hasError = data.error !== undefined;
        return hasData !== hasError; // XOR
      },
      { message: 'Either data or error must be present, but not both' }
    );

/**
 * Schema for PaginatedResponse
 */
export const paginatedResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: z.array(dataSchema),
    error: ecosystemErrorSchema.optional(),
    meta: responseMetaSchema,
    pagination: paginationInfoSchema,
  });

// ============================================================================
// QUERY AND FILTER SCHEMAS
// ============================================================================

/**
 * Schema for ecosystem stats query parameters
 */
export const ecosystemStatsQuerySchema = z.object({
  sections: z
    .array(
      z.enum([
        'overview',
        'growthTrends',
        'categoryAnalytics',
        'communityData',
        'qualityIndicators',
        'marketplaceData',
        'pluginData',
      ])
    )
    .optional(),
  period: z.enum(['7d', '30d', '90d', '1y']).optional(),
  aggregation: z.enum(['daily', 'weekly', 'monthly']).optional(),
  includePredictions: z.boolean().optional(),
  forceRefresh: z.boolean().optional(),
  format: z.enum(['json', 'csv', 'xml']).optional(),
});

/**
 * Schema for marketplace filters
 */
export const marketplaceFilterSchema = z.object({
  verified: z.boolean().optional(),
  minPlugins: z.number().min(0).optional(),
  minQualityScore: qualityScore.optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  sortBy: z.enum(['name', 'pluginCount', 'qualityScore', 'growthRate']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * Schema for plugin filters
 */
export const pluginFilterSchema = z.object({
  category: z.string().max(50).optional(),
  marketplaceId: marketplaceId.optional(),
  verified: z.boolean().optional(),
  minQualityScore: qualityScore.optional(),
  minDownloads: nonNegativeNumber.optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  sortBy: z.enum(['name', 'downloads', 'qualityScore', 'lastUpdated']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// ============================================================================
// CHART AND VISUALIZATION SCHEMAS
// ============================================================================

/**
 * Schema for chart data
 */
export const chartDataSchema = z.object({
  type: z.enum(['line', 'bar', 'pie', 'donut', 'area', 'scatter']),
  title: z.string().min(1).max(100),
  xAxis: z
    .object({
      label: z.string().max(50),
      type: z.enum(['category', 'datetime', 'linear']),
      format: z.string().max(20).optional(),
    })
    .optional(),
  yAxis: z
    .object({
      label: z.string().max(50),
      type: z.enum(['linear', 'logarithmic']),
      format: z.string().max(20).optional(),
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .optional(),
  series: z
    .array(
      z.object({
        name: z.string().min(1).max(50),
        data: z.union([
          z.array(z.tuple([z.union([z.string(), z.number()]), z.number()])),
          z.array(trendDataPointSchema),
        ]),
        color: z
          .string()
          .regex(/^#[0-9A-Fa-f]{6}$/)
          .optional(),
        type: z.enum(['line', 'bar', 'area']).optional(),
      })
    )
    .min(1)
    .max(10),
  options: z
    .object({
      responsive: z.boolean().optional(),
      interactive: z.boolean().optional(),
      animation: z.boolean().optional(),
      legend: z.boolean().optional(),
      grid: z.boolean().optional(),
      tooltips: z.boolean().optional(),
    })
    .optional(),
});

/**
 * Schema for chart formatting
 */
export const chartFormattingSchema = z.object({
  numberFormat: z.object({
    compact: z.boolean().optional(),
    decimals: z.number().min(0).max(10).optional(),
    thousandsSeparator: z.boolean().optional(),
    prefix: z.string().max(10).optional(),
    suffix: z.string().max(10).optional(),
  }),
  dateFormat: z.object({
    format: z.string().max(20).optional(),
    relative: z.boolean().optional(),
    timezone: z.string().max(50).optional(),
  }),
});

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Create a validator function from a Zod schema
 */
export const createValidator = <T>(schema: z.ZodType<T>) => {
  return (data: unknown): T => {
    const result = schema.safeParse(data);
    if (!result.success) {
      const errorMessages = result.error.issues
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join(', ');
      throw new Error(`Validation failed: ${errorMessages}`);
    }
    return result.data;
  };
};

/**
 * Safe validator that returns null instead of throwing
 */
export const createSafeValidator = <T>(schema: z.ZodType<T>) => {
  return (data: unknown): T | null => {
    const result = schema.safeParse(data);
    return result.success ? result.data : null;
  };
};

/**
 * Pre-built validators for common use cases
 */
export const validators = {
  ecosystemOverview: createValidator(ecosystemOverviewSchema),
  growthTrends: createValidator(growthTrendsSchema),
  categoryAnalytics: createValidator(categoryAnalyticsSchema),
  communityData: createValidator(communityDataSchema),
  qualityIndicators: createValidator(qualityIndicatorsSchema),
  marketplaceData: createValidator(marketplaceDataSchema),
  pluginData: createValidator(pluginDataSchema),
  trendDataPoint: createValidator(trendDataPointSchema),
  categoryData: createValidator(categoryDataSchema),
  ecosystemStatsQuery: createValidator(ecosystemStatsQuerySchema),
  marketplaceFilter: createValidator(marketplaceFilterSchema),
  pluginFilter: createValidator(pluginFilterSchema),
  chartData: createValidator(chartDataSchema),
  chartFormatting: createValidator(chartFormattingSchema),
};

/**
 * Safe validators for optional data
 */
export const safeValidators = {
  ecosystemOverview: createSafeValidator(ecosystemOverviewSchema),
  growthTrends: createSafeValidator(growthTrendsSchema),
  categoryAnalytics: createSafeValidator(categoryAnalyticsSchema),
  communityData: createSafeValidator(communityDataSchema),
  qualityIndicators: createSafeValidator(qualityIndicatorsSchema),
  marketplaceData: createSafeValidator(marketplaceDataSchema),
  pluginData: createSafeValidator(pluginDataSchema),
};

/**
 * Sanitize user input by removing potentially harmful content
 * Uses DOMPurify for robust HTML sanitization instead of regex patterns
 */
export const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'span', 'p', 'br'],
    ALLOWED_ATTR: ['class'],
  }).trim();
};

/**
 * Sanitize and validate a string field
 */
export const sanitizeStringField = (value: unknown, maxLength: number = 1000): string => {
  if (typeof value !== 'string') {
    throw new Error('Expected string value');
  }
  const sanitized = sanitizeInput(value);
  if (sanitized.length > maxLength) {
    throw new Error(`String exceeds maximum length of ${maxLength}`);
  }
  return sanitized;
};

// ============================================================================
// EXPORTS
// ============================================================================
