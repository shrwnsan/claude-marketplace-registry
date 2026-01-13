/**
 * Mock API endpoint for feedback testing
 * In production, this would store feedback data
 */

import type { NextApiRequest, NextApiResponse } from 'next';

// Enable CORS for development
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only GET and POST requests are supported',
      },
    });
  }

  try {
    // Simulate some processing delay
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));

    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Content-Type', 'application/json');

    return res.status(200).json({
      success: true,
      data: {
        received: req.method === 'POST' ? req.body : null,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        responseTime: Math.round(200 + Math.random() * 300),
      },
    });

  } catch (error) {
    console.error('Feedback test API error:', error);

    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to process feedback',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}_error`,
        responseTime: 0,
      },
    });
  }
}
