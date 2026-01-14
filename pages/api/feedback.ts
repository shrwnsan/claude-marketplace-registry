/**
 * Simple feedback API for testing
 */

import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  try {
    const body = req.body;
    console.log('Feedback received:', body);

    res.status(200).json({
      success: true,
      message: 'Feedback received successfully',
      feedbackId: `test_${Date.now()}`,
    });
  } catch (error) {
    console.error('Feedback submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}