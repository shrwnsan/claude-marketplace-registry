/**
 * Mock API endpoint for ecosystem statistics
 * In production, this would fetch real data from various sources
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createCompleteEcosystemStats } from '@/types/ecosystem-stats-examples';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function setCorsHeaders(res: NextApiResponse): void {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    setCorsHeaders(res);
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only GET requests are supported',
      },
    });
  }

  try {
    const { overview, quality, growth, categories } = req.query;

    const mockEcosystemData = createCompleteEcosystemStats();
    let responseData;

    // Return specific data based on query parameters
    if (overview !== undefined) {
      responseData = mockEcosystemData.overview;
    } else if (quality !== undefined) {
      responseData = mockEcosystemData.qualityIndicators;
    } else if (growth !== undefined) {
      responseData = mockEcosystemData.growthTrends;
    } else if (categories !== undefined) {
      responseData = mockEcosystemData.categoryAnalytics;
    } else {
      // Return all data by default
      responseData = mockEcosystemData;
    }

    // Simulate some processing delay
    await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 300));

    setCorsHeaders(res);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      success: true,
      data: responseData,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
        responseTime: Math.round(200 + Math.random() * 300),
        cacheStatus: 'miss',
        dataFreshness: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Ecosystem stats API error:', error);

    setCorsHeaders(res);
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch ecosystem statistics',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}_error`,
        responseTime: 0,
      },
    });
  }
}
