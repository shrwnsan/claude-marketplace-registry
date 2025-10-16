import type { NextApiRequest, NextApiResponse } from 'next';
import performanceMonitor from '../../utils/performance-monitor';

interface MetricsResponse {
  timestamp: string;
  uptime: number;
  version: string;
  performance: {
    report: any;
    prometheus?: string;
  };
  system: {
    nodeVersion: string;
    platform: string;
    arch: string;
    memory: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MetricsResponse | string>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' } as any);
  }

  try {
    // Record memory usage for monitoring
    performanceMonitor.recordMemoryUsage();

    const startTime = Date.now();

    // Get performance report
    const report = performanceMonitor.getReport();

    // Prepare system information
    const system = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      memory: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    };

    // Determine response format based on Accept header
    const acceptHeader = req.headers.accept || '';
    const format = req.query.format as string || 'json';

    const responseTime = Date.now() - startTime;

    if (format === 'prometheus' || acceptHeader.includes('text/plain')) {
      // Return Prometheus format
      const prometheusMetrics = performanceMonitor.exportPrometheusMetrics();

      res.setHeader('Content-Type', 'text/plain; version=0.0.4');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('X-Response-Time', `${responseTime}ms`);

      return res.status(200).send(prometheusMetrics);
    } else {
      // Return JSON format
      const response: MetricsResponse = {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        performance: {
          report,
          // Include Prometheus metrics if requested
          prometheus: req.query.include === 'prometheus' ? performanceMonitor.exportPrometheusMetrics() : undefined
        },
        system
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('X-Response-Time', `${responseTime}ms`);

      return res.status(200).json(response);
    }

  } catch (error) {
    console.error('Metrics endpoint error:', error);

    const errorResponse = {
      error: 'Failed to retrieve metrics',
      timestamp: new Date().toISOString(),
      details: error instanceof Error ? error.message : 'Unknown error'
    };

    return res.status(500).json(errorResponse as any);
  }
}

// Configure for static site generation compatibility
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    responseLimit: '10mb',
  },
};