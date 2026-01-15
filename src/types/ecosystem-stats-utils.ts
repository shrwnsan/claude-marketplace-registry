/**
 * Ecosystem Statistics Utility Functions
 *
 * Helper functions, utilities, and transformations for ecosystem statistics data.
 * Provides common operations for data formatting, calculations, and chart preparation.
 *
 * @fileoverview Utility functions for ecosystem statistics
 * @author Claude Marketplace Team
 * @version 1.0.0
 * @since 2025-10-21
 */

import type {
  EcosystemOverview,
  GrowthTrends,
  CategoryAnalytics,
  QualityIndicators,
  PluginData,
  ChartData,
  EcosystemStatsResponse,
  PaginatedResponse,
  PaginationInfo,
  PublicEcosystemStats,
} from './ecosystem-stats';

// ============================================================================
// NUMBER FORMATTING UTILITIES
// ============================================================================

/**
 * Format numbers with K, M, B notation for large values
 *
 * @param value - Number to format
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string
 *
 * @example
 * formatNumber(1250) // "1.3K"
 * formatNumber(2500000) // "2.5M"
 * formatNumber(150) // "150"
 */
export const formatNumber = (value: number, decimals: number = 1): string => {
  if (value < 1000) return value.toString();

  const units = ['K', 'M', 'B', 'T'];
  let unitIndex = -1;
  let scaledValue = value;

  while (scaledValue >= 1000 && unitIndex < units.length - 1) {
    scaledValue /= 1000;
    unitIndex++;
  }

  return `${scaledValue.toFixed(decimals)}${units[unitIndex]}`;
};

/**
 * Format percentages with appropriate precision
 *
 * @param value - Percentage value (0-100)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string with % symbol
 *
 * @example
 * formatPercentage(15.234) // "15.2%"
 * formatPercentage(7) // "7.0%"
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format growth rates with + or - prefix
 *
 * @param value - Growth rate (can be negative)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string with +/- prefix
 *
 * @example
 * formatGrowthRate(15.2) // "+15.2%"
 * formatGrowthRate(-5.3) // "-5.3%"
 */
export const formatGrowthRate = (value: number, decimals: number = 1): string => {
  const prefix = value >= 0 ? '+' : '';
  return `${prefix}${value.toFixed(decimals)}%`;
};

/**
 * Format large download numbers with appropriate units
 *
 * @param downloads - Download count
 * @returns Formatted download string
 *
 * @example
 * formatDownloads(1250) // "1.3K downloads"
 * formatDownloads(50000) // "50K downloads"
 */
export const formatDownloads = (downloads: number): string => {
  const formatted = formatNumber(downloads);
  return `${formatted} download${downloads === 1 ? '' : 's'}`;
};

/**
 * Format file sizes in bytes to human-readable format
 *
 * @param bytes - Size in bytes
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted size string
 *
 * @example
 * formatFileSize(1024) // "1.0 KB"
 * formatFileSize(1048576) // "1.0 MB"
 */
export const formatFileSize = (bytes: number, decimals: number = 1): string => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(decimals)} ${units[unitIndex]}`;
};

// ============================================================================
// DATE FORMATTING UTILITIES
// ============================================================================

/**
 * Format ISO date strings to human-readable format
 *
 * @param isoString - ISO date string
 * @param format - Output format ('short', 'medium', 'long', 'relative')
 * @returns Formatted date string
 *
 * @example
 * formatDate("2025-10-21T10:30:00Z", "short") // "Oct 21, 2025"
 * formatDate("2025-10-21T10:30:00Z", "relative") // "2 hours ago"
 */
export const formatDate = (
  isoString: string,
  format: 'short' | 'medium' | 'long' | 'relative' = 'short'
): string => {
  const date = new Date(isoString);
  const now = new Date();

  if (format === 'relative') {
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 30) {
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } else if (diffDays > 0) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    } else {
      return 'Just now';
    }
  }

  const options: Intl.DateTimeFormatOptions =
    format === 'short'
      ? { month: 'short', day: 'numeric', year: 'numeric' }
      : format === 'medium'
        ? { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }
        : {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          };

  return date.toLocaleDateString('en-US', options);
};

/**
 * Get date range for a given period
 *
 * @param period - Time period ('7d', '30d', '90d', '1y')
 * @returns Object with start and end dates
 *
 * @example
 * getDateRange('30d') // { start: "2025-09-21T...", end: "2025-10-21T..." }
 */
export const getDateRange = (
  period: '7d' | '30d' | '90d' | '1y'
): { start: string; end: string } => {
  const end = new Date();
  const start = new Date();

  const periodInDays = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365,
  }[period];

  start.setDate(start.getDate() - periodInDays);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
};

// ============================================================================
// CALCULATION UTILITIES
// ============================================================================

/**
 * Calculate growth rate between two values
 *
 * @param current - Current value
 * @param previous - Previous value
 * @returns Growth rate as percentage
 *
 * @example
 * calculateGrowthRate(150, 100) // 50.0
 * calculateGrowthRate(100, 150) // -33.3
 */
export const calculateGrowthRate = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

/**
 * Calculate percentage of total
 *
 * @param value - Part value
 * @param total - Total value
 * @param decimals - Number of decimal places (default: 1)
 * @returns Percentage
 *
 * @example
 * calculatePercentage(25, 100) // 25.0
 * calculatePercentage(15, 30) // 50.0
 */
export const calculatePercentage = (value: number, total: number, decimals: number = 1): number => {
  if (total === 0) return 0;
  return Number(((value / total) * 100).toFixed(decimals));
};

/**
 * Calculate average from array of numbers
 *
 * @param values - Array of numbers
 * @returns Average value or 0 for empty array
 *
 * @example
 * calculateAverage([1, 2, 3, 4, 5]) // 3
 * calculateAverage([]) // 0
 */
export const calculateAverage = (values: number[]): number => {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

/**
 * Calculate median from array of numbers
 *
 * @param values - Array of numbers
 * @returns Median value or 0 for empty array
 *
 * @example
 * calculateMedian([1, 2, 3, 4, 5]) // 3
 * calculateMedian([1, 2, 3, 4]) // 2.5
 */
export const calculateMedian = (values: number[]): number => {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};

/**
 * Calculate compound annual growth rate (CAGR)
 *
 * @param startValue - Starting value
 * @param endValue - Ending value
 * @param periods - Number of periods (usually years)
 * @returns CAGR as percentage
 *
 * @example
 * calculateCAGR(100, 150, 2) // 22.5
 */
export const calculateCAGR = (startValue: number, endValue: number, periods: number): number => {
  if (startValue <= 0 || periods <= 0) return 0;
  return (Math.pow(endValue / startValue, 1 / periods) - 1) * 100;
};

// ============================================================================
// DATA TRANSFORMATION UTILITIES
// ============================================================================

/**
 * Transform trend data points for chart consumption
 *
 * @param trends - Growth trends data
 * @param metrics - Which metrics to include
 * @returns Chart-ready data
 *
 * @example
 * transformTrendsToChartData(growthTrends, ['plugins', 'marketplaces'])
 * // Returns data formatted for Recharts or similar
 */
export const transformTrendsToChartData = (
  trends: GrowthTrends,
  metrics: Array<'plugins' | 'marketplaces' | 'developers' | 'downloads'>
): Array<{ date: string; [key: string]: string | number }> => {
  const maxLength = Math.max(...metrics.map((metric) => trends[metric].length));

  return Array.from({ length: maxLength }, (_, index) => {
    const dataPoint: any = {};

    metrics.forEach((metric) => {
      const trendData = trends[metric][index];
      if (trendData) {
        dataPoint.date = trendData.date;
        dataPoint[metric] = trendData.value;
        if (trendData.change !== undefined) {
          dataPoint[`${metric}Change`] = trendData.change;
        }
      }
    });

    return dataPoint;
  }).filter((point) => point.date);
};

/**
 * Transform category data to pie chart format
 *
 * @param categories - Category analytics data
 * @param limit - Maximum number of categories to include (default: 10)
 * @returns Pie chart ready data
 *
 * @example
 * transformCategoriesToPieChart(categoryAnalytics)
 * // Returns [{ name: "Development", value: 450 }, ...]
 */
export const transformCategoriesToPieChart = (
  categories: CategoryAnalytics,
  limit: number = 10
): Array<{ name: string; value: number; percentage: number }> => {
  return categories.categories
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((category) => ({
      name: category.name,
      value: category.count,
      percentage: category.percentage,
    }));
};

/**
 * Create public-friendly version of ecosystem stats
 *
 * @param fullStats - Complete ecosystem statistics
 * @returns Public-friendly version with sensitive data removed
 *
 * @example
 * createPublicEcosystemStats(completeStats)
 * // Returns version suitable for public API consumption
 */
export const createPublicEcosystemStats = (fullStats: {
  overview: EcosystemOverview;
  growthTrends: GrowthTrends;
  categoryAnalytics: CategoryAnalytics;
  qualityIndicators: QualityIndicators;
}): PublicEcosystemStats => {
  const currentPeriod = fullStats.growthTrends.plugins.slice(-7); // Last 7 data points
  const previousPeriod = fullStats.growthTrends.plugins.slice(-14, -7); // Previous 7 data points

  return {
    overview: {
      totalPlugins: fullStats.overview.totalPlugins,
      totalMarketplaces: fullStats.overview.totalMarketplaces,
      totalDevelopers: fullStats.overview.totalDevelopers,
      totalDownloads: fullStats.overview.totalDownloads,
      lastUpdated: fullStats.overview.lastUpdated,
    },
    growth: {
      currentPeriod,
      previousPeriod,
    },
    categories: fullStats.categoryAnalytics.categories
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((cat) => ({
        name: cat.name,
        count: cat.count,
        percentage: cat.percentage,
      })),
    quality: {
      verificationRate: fullStats.qualityIndicators.verification.verificationRate,
      avgQualityScore: fullStats.qualityIndicators.qualityMetrics.avgQualityScore,
      activeMaintenanceRate: fullStats.qualityIndicators.maintenance.activeMaintenanceRate,
    },
  };
};

/**
 * Aggregate plugin data by marketplace
 *
 * @param plugins - Array of plugin data
 * @returns Object with marketplace IDs as keys and aggregated stats as values
 *
 * @example
 * aggregatePluginsByMarketplace(plugins)
 * // Returns { "marketplace1": { count: 5, avgQuality: 85 }, ... }
 */
export const aggregatePluginsByMarketplace = (
  plugins: PluginData[]
): Record<string, { count: number; avgQuality: number; totalDownloads: number }> => {
  return plugins.reduce(
    (acc, plugin) => {
      const marketplaceId = plugin.plugin.marketplaceId;

      if (!acc[marketplaceId]) {
        acc[marketplaceId] = {
          count: 0,
          avgQuality: 0,
          totalDownloads: 0,
        };
      }

      acc[marketplaceId].count++;
      acc[marketplaceId].totalDownloads += plugin.popularity.downloads;
      acc[marketplaceId].avgQuality =
        (acc[marketplaceId].avgQuality * (acc[marketplaceId].count - 1) +
          plugin.quality.qualityScore) /
        acc[marketplaceId].count;

      return acc;
    },
    {} as Record<string, { count: number; avgQuality: number; totalDownloads: number }>
  );
};

/**
 * Filter and sort data based on criteria
 *
 * @param data - Array of data to filter
 * @param filters - Filter criteria
 * @param sortBy - Sort field
 * @param sortOrder - Sort order
 * @returns Filtered and sorted array
 *
 * @example
 * filterAndSortData(plugins, { verified: true }, 'downloads', 'desc')
 */
export const filterAndSortData = <T>(
  data: T[],
  filters: Partial<Record<string, any>>,
  sortBy?: string,
  sortOrder: 'asc' | 'desc' = 'desc'
): T[] => {
  let filtered = data;

  // Apply filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      filtered = filtered.filter((item) => {
        const itemValue = (item as any)[key];
        if (typeof value === 'boolean') {
          return itemValue === value;
        }
        if (typeof value === 'number') {
          return itemValue >= value;
        }
        if (Array.isArray(value)) {
          return value.includes(itemValue);
        }
        return itemValue === value;
      });
    }
  });

  // Apply sorting
  if (sortBy) {
    filtered = [...filtered].sort((a, b) => {
      const aValue = (a as any)[sortBy];
      const bValue = (b as any)[sortBy];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });
  }

  return filtered;
};

// ============================================================================
// CHART PREPARATION UTILITIES
// ============================================================================

/**
 * Prepare chart data for Recharts library
 *
 * @param data - Raw data array
 * @param xField - Field name for x-axis
 * @param yField - Field name for y-axis
 * @param options - Chart options
 * @returns Recharts-compatible data
 */
export const prepareRechartsData = (
  data: any[],
  xField: string,
  yField: string,
  options: {
    formatX?: (value: any) => string;
    formatY?: (value: any) => string;
    sortX?: boolean;
  } = {}
): any[] => {
  const prepared = data.map((item) => ({
    ...item,
    [xField]: options.formatX ? options.formatX(item[xField]) : item[xField],
    [yField]: options.formatY ? options.formatY(item[yField]) : item[yField],
  }));

  if (options.sortX) {
    prepared.sort((a, b) => {
      if (typeof a[xField] === 'string' && typeof b[xField] === 'string') {
        return a[xField].localeCompare(b[xField]);
      }
      return a[xField] - b[xField];
    });
  }

  return prepared;
};

/**
 * Generate chart configuration
 *
 * @param type - Chart type
 * @param title - Chart title
 * @param data - Chart data
 * @param options - Additional options
 * @returns Complete chart configuration
 */
export const generateChartConfig = (
  type: ChartData['type'],
  title: string,
  data: any,
  options: Partial<ChartData> = {}
): ChartData => {
  return {
    type,
    title,
    series: Array.isArray(data) ? [{ name: title, data }] : [data],
    options: {
      responsive: true,
      interactive: true,
      animation: true,
      legend: true,
      grid: true,
      tooltips: true,
      ...options.options,
    },
    ...options,
  };
};

// ============================================================================
// API RESPONSE UTILITIES
// ============================================================================

/**
 * Create successful API response
 *
 * @param data - Response data
 * @param meta - Additional metadata
 * @returns Formatted success response
 */
export const createSuccessResponse = <T>(
  data: T,
  meta?: Partial<EcosystemStatsResponse<T>['meta']>
): EcosystemStatsResponse<T> => ({
  success: true,
  data,
  meta: {
    timestamp: new Date().toISOString(),
    requestId:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 15),
    responseTime: 0,
    ...meta,
  },
});

/**
 * Create error API response
 *
 * @param code - Error code
 * @param message - Error message
 * @param details - Error details
 * @param suggestions - Suggested actions
 * @returns Formatted error response
 */
export const createErrorResponse = (
  code: string,
  message: string,
  details?: string,
  suggestions?: string[]
): EcosystemStatsResponse => ({
  success: false,
  error: {
    code,
    message,
    details,
    suggestions,
  },
  meta: {
    timestamp: new Date().toISOString(),
    requestId:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 15),
    responseTime: 0,
  },
});

/**
 * Create paginated response
 *
 * @param data - Data array
 * @param pagination - Pagination information
 * @param meta - Additional metadata
 * @returns Formatted paginated response
 */
export const createPaginatedResponse = <T>(
  data: T[],
  pagination: PaginationInfo,
  meta?: Partial<EcosystemStatsResponse<T[]>['meta']>
): PaginatedResponse<T> => ({
  success: true,
  data,
  meta: {
    timestamp: new Date().toISOString(),
    requestId:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 15),
    responseTime: 0,
    ...meta,
  },
  pagination,
});

/**
 * Validate and sanitize API response
 *
 * @param response - Raw API response
 * @param validator - Validation function
 * @returns Validated and sanitized response
 */
export const validateApiResponse = <T>(
  response: unknown,
  validator: (data: unknown) => T
): EcosystemStatsResponse<T> => {
  try {
    const validatedData = validator(response);
    return createSuccessResponse(validatedData);
  } catch (error) {
    return createErrorResponse(
      'VALIDATION_ERROR',
      'Invalid response data',
      error instanceof Error ? error.message : 'Unknown validation error'
    );
  }
};

// ============================================================================
// PERFORMANCE UTILITIES
// ============================================================================

/**
 * Measure execution time of a function
 *
 * @param fn - Function to measure
 * @returns Object with result and execution time
 *
 * @example
 * const { result, time } = measureExecutionTime(() => heavyCalculation())
 * console.log(`Calculation took ${time}ms`)
 */
export const measureExecutionTime = <T>(fn: () => T): { result: T; time: number } => {
  const start = Date.now();
  const result = fn();
  const end = Date.now();

  return {
    result,
    time: Math.round(end - start),
  };
};

/**
 * Debounce function calls
 *
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 *
 * @example
 * const debouncedSearch = debounce(searchFunction, 300)
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Throttle function calls
 *
 * @param func - Function to throttle
 * @param delay - Delay in milliseconds
 * @returns Throttled function
 *
 * @example
 * const throttledUpdate = throttle(updateFunction, 1000)
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

// ============================================================================
// GROUPED EXPORTS
// ============================================================================

// Grouped exports for better organization
export const formatters = {
  formatNumber,
  formatPercentage,
  formatGrowthRate,
  formatDownloads,
  formatFileSize,
  formatDate,
  getDateRange,
};

export const calculators = {
  calculateGrowthRate,
  calculatePercentage,
  calculateAverage,
  calculateMedian,
  calculateCAGR,
};

export const transformers = {
  transformTrendsToChartData,
  transformCategoriesToPieChart,
  createPublicEcosystemStats,
  aggregatePluginsByMarketplace,
  filterAndSortData,
};

export const apiHelpers = {
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,
  validateApiResponse,
};

export const performance = {
  measureExecutionTime,
  debounce,
  throttle,
};

// ============================================================================
// EXPORTS
// ============================================================================
