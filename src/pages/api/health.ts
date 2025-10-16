import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    dataFiles: boolean;
    githubApi: boolean;
    buildStatus: boolean;
    memoryUsage: boolean;
  };
  details?: {
    error?: string;
    dataFreshness?: string;
    lastScan?: string;
    memoryUsage?: NodeJS.MemoryUsage;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthResponse>
) {
  const startTime = Date.now();
  const version = process.env.npm_package_version || '1.0.0';

  try {
    // Basic health checks
    const checks = {
      dataFiles: false,
      githubApi: false,
      buildStatus: false,
      memoryUsage: false
    };

    const details: HealthResponse['details'] = {
      memoryUsage: process.memoryUsage()
    };

    // Check 1: Data files existence and freshness
    try {
      const dataDir = path.join(process.cwd(), 'public', 'data');
      const indexFile = path.join(dataDir, 'index.json');

      if (fs.existsSync(indexFile)) {
        const stats = fs.statSync(indexFile);
        const lastModified = stats.mtime;
        const hoursSinceModified = (Date.now() - lastModified.getTime()) / (1000 * 60 * 60);

        checks.dataFiles = true;
        details.dataFreshness = `${Math.round(hoursSinceModified)} hours ago`;
        details.lastScan = lastModified.toISOString();
      }
    } catch (error) {
      console.error('Data files check failed:', error);
    }

    // Check 2: GitHub API connectivity (simple check)
    try {
      const response = await fetch('https://api.github.com/rate_limit', {
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      checks.githubApi = response.ok;
    } catch (error) {
      console.error('GitHub API check failed:', error);
      checks.githubApi = false;
    }

    // Check 3: Build status (check if out directory exists)
    try {
      const outDir = path.join(process.cwd(), 'out');
      checks.buildStatus = fs.existsSync(outDir);
    } catch (error) {
      console.error('Build status check failed:', error);
    }

    // Check 4: Memory usage (check if under 500MB)
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = memoryUsage.heapUsed / 1024 / 1024;
    checks.memoryUsage = memoryUsageMB < 500;

    // Determine overall health
    const allChecksPass = Object.values(checks).every(check => check === true);
    const status = allChecksPass ? 'healthy' : 'unhealthy';

    // Calculate response time
    const responseTime = Date.now() - startTime;

    const healthResponse: HealthResponse = {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version,
      checks,
      details: status === 'unhealthy' ? details : undefined
    };

    // Set cache headers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('X-Response-Time', `${responseTime}ms`);

    return res.status(status === 'healthy' ? 200 : 503).json(healthResponse);

  } catch (error) {
    console.error('Health check failed:', error);

    const errorResponse: HealthResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version,
      checks: {
        dataFiles: false,
        githubApi: false,
        buildStatus: false,
        memoryUsage: false
      },
      details: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };

    return res.status(503).json(errorResponse);
  }
}

// Configure for static site generation compatibility
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    responseLimit: '1mb',
  },
};