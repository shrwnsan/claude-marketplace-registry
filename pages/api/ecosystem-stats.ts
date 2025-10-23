/**
 * Ecosystem Statistics API Endpoint
 *
 * This API endpoint provides comprehensive ecosystem statistics for the Claude Code
 * plugin ecosystem. It serves as the main data source for the EcosystemStats component.
 *
 * Features:
 * - RESTful API design with proper HTTP methods
 * - Response caching and performance optimization
 * - Comprehensive error handling and status codes
 * - Support for different metric types and time ranges
 * - Rate limiting and request validation
 * - Mock data support for development
 * - Response format standardization
 *
 * Endpoints:
 * - GET /api/ecosystem-stats - Get complete ecosystem statistics
 * - GET /api/ecosystem-stats/overview - Get overview metrics only
 * - GET /api/ecosystem-stats/growth - Get growth trends
 * - GET /api/ecosystem-stats/categories - Get category analytics
 * - GET /api/ecosystem-stats/developers - Get developer analytics
 * - GET /api/ecosystem-stats/quality - Get quality metrics
 * - DELETE /api/ecosystem-stats/cache - Clear cache
 *
 * @author Claude Code Marketplace Team
 * @version 1.0.0
 */

import { NextApiRequest, NextApiResponse } from 'next';
import {
  getEcosystemStats,
  getCacheStatistics,
  clearAllCache,
} from '../../src/data/ecosystem-stats';
import {
  clearEcosystemCache,
} from '../../src/services/ecosystem-data';
import { TimeRange } from '../../src/utils/data-processor';

/**
 * API Response wrapper interface
 */
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  metadata?: {
    timestamp: string;
    processingTime: number;
    cache: {
      hit: boolean;
      ttl: number;
    };
    requestId: string;
  };
}

/**
 * Request query parameters interface
 */
interface EcosystemStatsQuery {
  /** Force cache refresh */
  refresh?: string;
  /** Time range for growth data */
  timeRange?: TimeRange;
  /** Limit for developer results */
  limit?: string;
  /** Specific metric to return */
  metric?: 'overview' | 'growth' | 'categories' | 'developers' | 'quality';
  /** Include detailed metadata */
  includeMetadata?: string;
  /** Response format */
  format?: 'json' | 'csv';
}

/**
 * Rate limiting interface
 */
interface RateLimitInfo {
  requests: number;
  windowMs: number;
  maxRequests: number;
  resetTime: number;
}

/**
 * In-memory rate limiting store
 */
const rateLimitStore = new Map<string, RateLimitInfo>();

/**
 * Rate limiting middleware
 */
function checkRateLimit(req: NextApiRequest): { allowed: boolean; remaining: number; resetTime: number } {
  const clientId = req.headers['x-forwarded-for'] as string ||
                   req.headers['x-real-ip'] as string ||
                   req.connection.remoteAddress ||
                   'unknown';

  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 100; // 100 requests per minute

  let rateLimitInfo = rateLimitStore.get(clientId);

  if (!rateLimitInfo || now - rateLimitInfo.windowMs > windowMs) {
    rateLimitInfo = {
      requests: 0,
      windowMs: now,
      maxRequests,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(clientId, rateLimitInfo);
  }

  rateLimitInfo.requests++;

  const allowed = rateLimitInfo.requests <= maxRequests;
  const remaining = Math.max(0, maxRequests - rateLimitInfo.requests);

  // Cleanup old entries
  if (now > rateLimitInfo.resetTime) {
    rateLimitStore.delete(clientId);
  }

  return {
    allowed,
    remaining,
    resetTime: rateLimitInfo.resetTime,
  };
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate and parse query parameters
 */
function parseQueryParams(query: any): EcosystemStatsQuery {
  const params: EcosystemStatsQuery = {};

  if (query.refresh === 'true') params.refresh = query.refresh;
  if (query.timeRange && ['7d', '30d', '90d', '6m', '1y', 'all'].includes(query.timeRange)) {
    params.timeRange = query.timeRange as TimeRange;
  }
  if (query.limit && !isNaN(parseInt(query.limit))) {
    params.limit = query.limit;
  }
  if (query.metric && ['overview', 'growth', 'categories', 'developers', 'quality'].includes(query.metric)) {
    params.metric = query.metric;
  }
  if (query.includeMetadata === 'true') params.includeMetadata = query.includeMetadata;
  if (query.format && ['json', 'csv'].includes(query.format)) {
    params.format = query.format;
  }

  return params;
}

/**
 * Create standardized API response
 */
function createApiResponse<T>(
  success: boolean,
  data?: T,
  error?: string,
  message?: string,
  metadata?: any
): ApiResponse<T> {
  return {
    success,
    data,
    error,
    message,
    metadata: {
      timestamp: new Date().toISOString(),
      processingTime: metadata?.processingTime || 0,
      cache: metadata?.cache || { hit: false, ttl: 0 },
      requestId: metadata?.requestId || '',
    },
  };
}

/**
 * Handle CORS headers
 */
function setCorsHeaders(res: NextApiResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
}

/**
 * Handle OPTIONS request for CORS
 */
function handleOptions(res: NextApiResponse): void {
  setCorsHeaders(res);
  res.status(200).end();
}

/**
 * Main API handler
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
): Promise<void> {
  // Set CORS headers
  setCorsHeaders(res);

  // Handle OPTIONS requests
  if (req.method === 'OPTIONS') {
    handleOptions(res);
    return;
  }

  const startTime = Date.now();
  const requestId = generateRequestId();

  try {
    // Rate limiting check
    const rateLimit = checkRateLimit(req);
    res.setHeader('X-RateLimit-Limit', '100');
    res.setHeader('X-RateLimit-Remaining', rateLimit.remaining.toString());
    res.setHeader('X-RateLimit-Reset', rateLimit.resetTime.toString());

    if (!rateLimit.allowed) {
          res.status(429).json(
        createApiResponse(false, null, 'Rate limit exceeded', undefined, {
          requestId,
          processingTime: Date.now() - startTime,
        })
      );
      return;
    }

    // Parse query parameters
    const params = parseQueryParams(req.query);
    const _refreshCache = params.refresh === 'true';

  
    // Route based on HTTP method and path
    switch (req.method) {
      case 'GET':
        await handleGetRequest(req, res, params, requestId, startTime);
        break;
      case 'POST':
        await handlePostRequest(req, res, params, requestId, startTime);
        break;
      case 'DELETE':
        await handleDeleteRequest(req, res, params, requestId, startTime);
        break;
      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        res.status(405).json(
          createApiResponse(false, null, 'Method not allowed', undefined, {
            requestId,
            processingTime: Date.now() - startTime,
          })
        );
        break;
    }
  } catch (error) {
    const processingTime = Date.now() - startTime;
  
    res.status(500).json(
      createApiResponse(
        false,
        null,
        'Internal server error',
        error instanceof Error ? error.message : 'Unknown error',
        {
          requestId,
          processingTime,
        }
      )
    );
  }
}

/**
 * Handle GET requests
 */
async function handleGetRequest(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  params: EcosystemStatsQuery,
  requestId: string,
  startTime: number
): Promise<void> {
  const { metric, timeRange = '1y', limit } = params;

  try {
    let data: any;
    let cacheHit = false;

    // Route based on metric parameter
    if (metric) {
      switch (metric) {
        case 'overview':
          data = await getOverviewData(params.refresh === 'true');
          break;
        case 'growth':
          data = await getGrowthData(timeRange, params.refresh === 'true');
          break;
        case 'categories':
          data = await getCategoriesData(params.refresh === 'true');
          break;
        case 'developers':
          data = await getDevelopersData(parseInt(limit || '50'), params.refresh === 'true');
          break;
        case 'quality':
          data = await getQualityData(params.refresh === 'true');
          break;
        default:
          res.status(400).json(
            createApiResponse(false, null, 'Invalid metric parameter', undefined, {
              requestId,
              processingTime: Date.now() - startTime,
            })
          );
          return;
      }
    } else {
      // Get complete ecosystem stats
      const stats = await getEcosystemStats(params.refresh === 'true');
      data = stats;
      cacheHit = !params.refresh;
    }

    // Handle CSV format if requested
    if (params.format === 'csv' && metric) {
      const csv = convertToCSV(data, metric);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="ecosystem-${metric}.csv"`);
      res.status(200).send(csv as any);
      return;
    }

    const processingTime = Date.now() - startTime;
    const response = createApiResponse(true, data, undefined, undefined, {
      requestId,
      processingTime,
      cache: {
        hit: cacheHit,
        ttl: 6 * 60 * 60 * 1000, // 6 hours
      },
    });

    res.status(200).json(response);

  } catch (error) {
      res.status(500).json(
      createApiResponse(
        false,
        null,
        'Failed to fetch ecosystem statistics',
        error instanceof Error ? error.message : 'Unknown error',
        {
          requestId,
          processingTime: Date.now() - startTime,
        }
      )
    );
  }
}

/**
 * Handle POST requests (cache refresh, data updates)
 */
async function handlePostRequest(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  params: EcosystemStatsQuery,
  requestId: string,
  startTime: number
): Promise<void> {
  try {
    // Clear cache and regenerate data
    await clearAllCache();
    await clearEcosystemCache();

    const stats = await getEcosystemStats(true); // Force refresh

    const processingTime = Date.now() - startTime;
    const response = createApiResponse(
      true,
      stats,
      undefined,
      'Ecosystem statistics refreshed successfully',
      {
        requestId,
        processingTime,
        cache: {
          hit: false,
          ttl: 6 * 60 * 60 * 1000,
        },
      }
    );

    res.status(200).json(response);

  } catch (error) {
        res.status(500).json(
      createApiResponse(
        false,
        null,
        'Failed to refresh ecosystem statistics',
        error instanceof Error ? error.message : 'Unknown error',
        {
          requestId,
          processingTime: Date.now() - startTime,
        }
      )
    );
  }
}

/**
 * Handle DELETE requests (cache management)
 */
async function handleDeleteRequest(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  params: EcosystemStatsQuery,
  requestId: string,
  startTime: number
): Promise<void> {
  try {
    const cacheStatsBefore = await getCacheStatistics();

    // Clear caches
    await clearAllCache();
    await clearEcosystemCache();

    const cacheStatsAfter = await getCacheStatistics();

    const processingTime = Date.now() - startTime;
    const response = createApiResponse(
      true,
      {
        before: cacheStatsBefore,
        after: cacheStatsAfter,
      },
      undefined,
      'Cache cleared successfully',
      {
        requestId,
        processingTime,
        cache: {
          hit: false,
          ttl: 0,
        },
      }
    );

    res.status(200).json(response);

  } catch (error) {
        res.status(500).json(
      createApiResponse(
        false,
        null,
        'Failed to clear cache',
        error instanceof Error ? error.message : 'Unknown error',
        {
          requestId,
          processingTime: Date.now() - startTime,
        }
      )
    );
  }
}

/**
 * Get overview data
 */
async function getOverviewData(refreshCache = false) {

  // In a real implementation, this would use actual data collection
  // For now, use mock data
  const stats = await getEcosystemStats(refreshCache);
  return stats.overview;
}

/**
 * Get growth data
 */
async function getGrowthData(timeRange: TimeRange, refreshCache = false) {

  const stats = await getEcosystemStats(refreshCache);
  return stats.growth[timeRange];
}

/**
 * Get categories data
 */
async function getCategoriesData(refreshCache = false) {

  const stats = await getEcosystemStats(refreshCache);
  return stats.categories;
}

/**
 * Get developers data
 */
async function getDevelopersData(limit: number, refreshCache = false) {

  const stats = await getEcosystemStats(refreshCache);
  return stats.developers.slice(0, limit);
}

/**
 * Get quality data
 */
async function getQualityData(refreshCache = false) {

  const stats = await getEcosystemStats(refreshCache);
  return stats.quality;
}

/**
 * Convert data to CSV format
 */
function convertToCSV(data: any, metric: string): string {
  let csv = '';
  let headers: string[] = [];
  let rows: any[] = [];

  switch (metric) {
    case 'overview':
      headers = ['Metric', 'Value'];
      rows = Object.entries(data).map(([key, value]) => [key, value]);
      break;

    case 'growth':
      if (data && data.length > 0) {
        headers = Object.keys(data[0]);
        rows = data;
      }
      break;

    case 'categories':
      if (data && data.length > 0) {
        headers = ['Category', 'Plugin Count', 'Percentage', 'Avg Quality Score', 'Downloads', 'Developers'];
        rows = data.map((cat: any) => [
          cat.category,
          cat.pluginCount,
          cat.percentage.toFixed(2),
          cat.averageQualityScore,
          cat.totalDownloads,
          cat.developerCount,
        ]);
      }
      break;

    case 'developers':
      if (data && data.length > 0) {
        headers = ['Developer', 'Plugin Count', 'Total Downloads', 'Total Stars', 'Avg Quality Score', 'Categories'];
        rows = data.map((dev: any) => [
          dev.developer,
          dev.pluginCount,
          dev.totalDownloads,
          dev.totalStars,
          dev.averageQualityScore,
          dev.categories.join('; '),
        ]);
      }
      break;

    case 'quality':
      headers = ['Metric', 'Value'];
      rows = Object.entries(data).map(([key, value]) => {
        if (typeof value === 'object') {
          return [key, JSON.stringify(value)];
        }
        return [key, value];
      });
      break;

    default:
      return 'Invalid metric for CSV export';
  }

  // Build CSV string
  csv += headers.join(',') + '\n';
  for (const row of rows) {
    csv += row.map((cell: any) => `"${cell}"`).join(',') + '\n';
  }

  return csv;
}

/**
 * Health check endpoint
 */
export async function healthCheck(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    dataCollection: boolean;
    dataProcessing: boolean;
    cache: boolean;
  };
  metrics: {
    cacheSize: number;
    cacheHitRate: number;
    lastUpdate: string;
  };
}> {
  try {
    const cacheStats = await getCacheStatistics();
    const stats = await getEcosystemStats();

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        dataCollection: true,
        dataProcessing: true,
        cache: cacheStats.totalEntries > 0,
      },
      metrics: {
        cacheSize: cacheStats.totalSize,
        cacheHitRate: cacheStats.hitRate,
        lastUpdate: stats.metadata.lastUpdated,
      },
    };
  } catch (error) {
        return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        dataCollection: false,
        dataProcessing: false,
        cache: false,
      },
      metrics: {
        cacheSize: 0,
        cacheHitRate: 0,
        lastUpdate: 'Unknown',
      },
    };
  }
}