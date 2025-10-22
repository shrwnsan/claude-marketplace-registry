import { NextApiRequest, NextApiResponse } from 'next';
import {
  EcosystemStatsResponse,
  CategoryAnalytics as ICategoryAnalytics,
  CategoryData
} from '../../../src/types/ecosystem-stats';

// ============================================================================
// MOCK DATA - In production, this would come from your database
// ============================================================================

const mockCategoryData: ICategoryAnalytics = {
  categories: [
    {
      id: 'development',
      name: 'Development Tools',
      count: 450,
      percentage: 36.0,
      growthRate: 18.2,
      topPlugins: [
        { id: 'code-assist', name: 'Code Assistant', downloads: 15420, rating: 4.8 },
        { id: 'debug-pro', name: 'Debug Pro', downloads: 12300, rating: 4.6 },
        { id: 'syntax-enhancer', name: 'Syntax Enhancer', downloads: 9800, rating: 4.7 }
      ],
      trending: true,
      description: 'Tools for software development and coding productivity'
    },
    {
      id: 'ai-ml',
      name: 'AI & Machine Learning',
      count: 280,
      percentage: 22.4,
      growthRate: 45.3,
      topPlugins: [
        { id: 'ml-helper', name: 'ML Helper', downloads: 18900, rating: 4.9 },
        { id: 'ai-companion', name: 'AI Companion', downloads: 22100, rating: 4.8 },
        { id: 'data-analyzer', name: 'Data Analyzer', downloads: 14500, rating: 4.5 }
      ],
      trending: true,
      description: 'Artificial intelligence and machine learning tools'
    },
    {
      id: 'productivity',
      name: 'Productivity',
      count: 200,
      percentage: 16.0,
      growthRate: 12.8,
      topPlugins: [
        { id: 'task-master', name: 'Task Master', downloads: 8900, rating: 4.4 },
        { id: 'time-tracker', name: 'Time Tracker', downloads: 7600, rating: 4.3 },
        { id: 'focus-mode', name: 'Focus Mode', downloads: 6200, rating: 4.6 }
      ],
      trending: false,
      description: 'Productivity and workflow optimization tools'
    },
    {
      id: 'testing',
      name: 'Testing & QA',
      count: 120,
      percentage: 9.6,
      growthRate: -3.2,
      topPlugins: [
        { id: 'test-runner', name: 'Test Runner Pro', downloads: 5400, rating: 4.5 },
        { id: 'coverage-analyzer', name: 'Coverage Analyzer', downloads: 4800, rating: 4.2 },
        { id: 'mock-generator', name: 'Mock Generator', downloads: 3900, rating: 4.4 }
      ],
      trending: false,
      description: 'Testing tools and quality assurance utilities'
    },
    {
      id: 'documentation',
      name: 'Documentation',
      count: 85,
      percentage: 6.8,
      growthRate: 8.7,
      topPlugins: [
        { id: 'doc-generator', name: 'Doc Generator', downloads: 3200, rating: 4.6 },
        { id: 'markdown-helper', name: 'Markdown Helper', downloads: 2800, rating: 4.3 },
        { id: 'api-docs', name: 'API Docs', downloads: 2400, rating: 4.7 }
      ],
      trending: false,
      description: 'Documentation generation and management tools'
    },
    {
      id: 'security',
      name: 'Security',
      count: 75,
      percentage: 6.0,
      growthRate: 22.1,
      topPlugins: [
        { id: 'security-scanner', name: 'Security Scanner', downloads: 4100, rating: 4.8 },
        { id: 'vuln-checker', name: 'Vulnerability Checker', downloads: 3600, rating: 4.6 },
        { id: 'auth-helper', name: 'Auth Helper', downloads: 2900, rating: 4.5 }
      ],
      trending: true,
      description: 'Security analysis and authentication tools'
    },
    {
      id: 'design',
      name: 'Design & UI',
      count: 40,
      percentage: 3.2,
      growthRate: 35.6,
      topPlugins: [
        { id: 'ui-builder', name: 'UI Builder', downloads: 2100, rating: 4.4 },
        { id: 'color-picker', name: 'Color Picker Pro', downloads: 1800, rating: 4.7 },
        { id: 'design-system', name: 'Design System Helper', downloads: 1500, rating: 4.5 }
      ],
      trending: true,
      description: 'User interface design and development tools'
    }
  ],
  trending: ['ai-ml', 'development', 'security', 'design'],
  emerging: ['productivity', 'documentation'],
  underserved: ['deployment', 'monitoring', 'analytics'],
  insights: [
    'AI & Machine Learning category shows exceptional 45.3% growth, indicating strong developer interest',
    'Development Tools remain the largest category with 450 plugins, showing steady growth at 18.2%',
    'Security tools are gaining momentum with 22.1% growth as security becomes increasingly important',
    'Design & UI tools, while smaller, are rapidly expanding at 35.6% growth rate',
    'Testing & QA category shows slight decline (-3.2%), possibly due to market saturation',
    'Emerging categories like Productivity and Documentation show potential for new plugin opportunities'
  ],
  performance: {
    bestPerforming: 'ai-ml',
    fastestGrowing: 'ai-ml',
    mostPopular: 'development'
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const createResponse = <T,>(
  success: boolean,
  data?: T,
  error?: { code: string; message: string; details?: string }
): EcosystemStatsResponse<T> => {
  return {
    success,
    data,
    error,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: Math.random().toString(36).substring(7),
      responseTime: 0, // Would be calculated in production
    }
  };
};

const validateQueryParams = (query: NextApiQuery) => {
  const { period, aggregation, includePredictions, forceRefresh, format } = query;

  const validPeriods = ['7d', '30d', '90d', '1y'];
  const validAggregations = ['daily', 'weekly', 'monthly'];
  const validFormats = ['json', 'csv', 'xml'];

  if (period && !validPeriods.includes(period as string)) {
    throw new Error('Invalid period parameter');
  }

  if (aggregation && !validAggregations.includes(aggregation as string)) {
    throw new Error('Invalid aggregation parameter');
  }

  if (format && !validFormats.includes(format as string)) {
    throw new Error('Invalid format parameter');
  }

  return {
    period: (period as string) || '30d',
    aggregation: (aggregation as string) || 'weekly',
    includePredictions: includePredictions === 'true',
    forceRefresh: forceRefresh === 'true',
    format: (format as string) || 'json'
  };
};

// ============================================================================
// API HANDLER
// ============================================================================

interface NextApiQuery {
  [key: string]: string | string[] | undefined;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json(
      createResponse(false, undefined, {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only GET method is allowed'
      })
    );
  }

  try {
    const startTime = Date.now();

    // Validate and parse query parameters
    const params = validateQueryParams(req.query);

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 200));

    let responseData: unknown;

    // Handle different query types
    if (req.query.quality === '' || req.query.metric === 'quality') {
      // Return quality indicators
      responseData = {
        verification: {
          verifiedPlugins: 875,
          verificationRate: 70.0,
          badges: [
            { type: 'security', count: 525 },
            { type: 'quality', count: 700 },
            { type: 'popularity', count: 350 },
            { type: 'maintenance', count: 613 }
          ]
        },
        maintenance: {
          recentlyUpdated: 750,
          activeMaintenanceRate: 60.0,
          avgUpdateFrequency: 21,
          abandonedPlugins: 125
        },
        qualityMetrics: {
          avgQualityScore: 85.2,
          highQualityPlugins: 500,
          commonIssues: [
            { issue: 'Missing documentation', frequency: 375, severity: 'medium' },
            { issue: 'No recent updates', frequency: 125, severity: 'high' },
            { issue: 'Low test coverage', frequency: 250, severity: 'medium' },
            { issue: 'Security vulnerabilities', frequency: 63, severity: 'high' }
          ]
        },
        security: {
          scannedPlugins: 1000,
          criticalIssues: 25,
          securityScore: 82.5
        }
      };
    } else if (req.query.categories) {
      // Return category analytics
      responseData = mockCategoryData;

      // Apply period-based filtering (in a real app, this would query different time ranges)
      if (params.period === '7d') {
        // Simulate more recent data with higher growth rates
        responseData = {
          ...(responseData as object),
          categories: (responseData as any).categories.map((cat: CategoryData) => ({
            ...cat,
            growthRate: cat.growthRate * 1.2, // Exaggerate growth for demo
            count: Math.floor(cat.count * 0.95) // Slightly lower counts for shorter period
          }))
        } as typeof responseData;
      } else if (params.period === '90d') {
        // Simulate longer-term data with more stable growth
        responseData = {
          ...(responseData as object),
          categories: (responseData as any).categories.map((cat: CategoryData) => ({
            ...cat,
            growthRate: cat.growthRate * 0.8, // More moderate growth
            count: Math.floor(cat.count * 1.1) // Higher counts for longer period
          }))
        } as typeof responseData;
      }
    } else if (req.query.overview) {
      // Return ecosystem overview (placeholder for future implementation)
      responseData = {
        totalPlugins: 1250,
        totalMarketplaces: 15,
        totalDevelopers: 340,
        totalDownloads: 48200,
        lastUpdated: new Date().toISOString(),
        growthRate: {
          plugins: 15.2,
          marketplaces: 7.1,
          developers: 12.8,
          downloads: 23.4
        }
      };
      } else if (req.query.metric === 'growth') {
      // Generate time-series growth data
      const generateGrowthData = (baseValue: number, growthRate: number, periods: number) => {
        const data = [];
        let currentValue = baseValue * Math.pow(1 - growthRate/100, periods); // Start from past value

        for (let i = 0; i < periods; i++) {
          const date = new Date();
          if (params.aggregation === 'daily') {
            date.setDate(date.getDate() - (periods - i));
          } else if (params.aggregation === 'weekly') {
            date.setDate(date.getDate() - ((periods - i) * 7));
          } else if (params.aggregation === 'monthly') {
            date.setMonth(date.getMonth() - (periods - i));
          }

          currentValue = currentValue * (1 + growthRate/100/periods);
          data.push({
            date: date.toISOString().split('T')[0],
            value: Math.round(currentValue)
          });
        }
        return data;
      };

      const periods = params.period === '7d' ? 7 : params.period === '30d' ? 30 : params.period === '90d' ? 90 : 365;

      responseData = {
        plugins: generateGrowthData(1250, 15.2, Math.min(periods, 12)),
        marketplaces: generateGrowthData(15, 7.1, Math.min(periods, 12)),
        developers: generateGrowthData(340, 12.8, Math.min(periods, 12)),
        downloads: generateGrowthData(48200, 23.4, Math.min(periods, 12)),
        period: params.period,
        aggregation: params.aggregation
      };
    } else {
      // Return full ecosystem stats (placeholder for future implementation)
      responseData = {
        overview: {
          totalPlugins: 1250,
          totalMarketplaces: 15,
          totalDevelopers: 340,
          totalDownloads: 48200,
          lastUpdated: new Date().toISOString(),
          growthRate: {
            plugins: 15.2,
            marketplaces: 7.1,
            developers: 12.8,
            downloads: 23.4
          }
        },
        categoryAnalytics: mockCategoryData,
        growthTrends: {
          plugins: [],
          marketplaces: [],
          developers: [],
          downloads: [],
          period: params.period,
          aggregation: params.aggregation
        }
      };
    }

    const responseTime = Date.now() - startTime;

    // Create final response with metadata
    const finalResponse = createResponse(true, responseData);
    finalResponse.meta.responseTime = responseTime;

    // Add cache headers
    const cacheTTL = params.forceRefresh ? 0 : 300; // 5 minutes cache
    res.setHeader('Cache-Control', `public, max-age=${cacheTTL}`);
    res.setHeader('X-Response-Time', `${responseTime}ms`);

    return res.status(200).json(finalResponse);

  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Ecosystem stats API error:', error);

    const errorCode = error instanceof Error ? error.message : 'UNKNOWN_ERROR';

    return res.status(500).json(
      createResponse(false, undefined, {
        code: errorCode,
        message: 'Failed to fetch ecosystem statistics',
        details: error instanceof Error ? error.stack : undefined
      })
    );
  }
}