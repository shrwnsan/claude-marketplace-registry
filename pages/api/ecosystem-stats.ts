/**
 * Mock API endpoint for ecosystem statistics
 * In production, this would fetch real data from various sources
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createCompleteEcosystemStats } from '@/types/ecosystem-stats-examples';

// Enable CORS for development
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res
      .status(200)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type')
      .end();
  }

  if (req.method !== 'GET') {
    return res
      .status(405)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type')
      .setHeader('Content-Type', 'application/json')
      .json({
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

    return res
      .status(200)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type')
      .setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
      .setHeader('Content-Type', 'application/json')
      .json({
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

    return res
      .status(500)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type')
      .setHeader('Content-Type', 'application/json')
      .json({
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
