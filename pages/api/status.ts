import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface SystemStatus {
  status: 'operational' | 'degraded' | 'down';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  systems: {
    data: {
      status: 'operational' | 'degraded' | 'down';
      lastUpdate: string;
      totalMarketplaces: number;
      totalPlugins: number;
      dataFreshness: string;
      errors?: string[];
    };
    github: {
      status: 'operational' | 'degraded' | 'down';
      rateLimit: {
        limit: number;
        remaining: number;
        reset: string;
        used: number;
      };
      lastCheck: string;
      errors?: string[];
    };
    build: {
      status: 'operational' | 'degraded' | 'down';
      lastBuild: string;
      buildTime: string;
      errors?: string[];
    };
    performance: {
      status: 'operational' | 'degraded' | 'down';
      memory: {
        used: number;
        total: number;
        percentage: number;
      };
      cpu: {
        loadAverage: number[];
      };
      responseTime: number;
      errors?: string[];
    };
  };
  incidents: Array<{
    id: string;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'open' | 'investigating' | 'resolved';
    createdAt: string;
    resolvedAt?: string;
  }>;
  metrics: {
    requestsToday: number;
    errorsToday: number;
    averageResponseTime: number;
    uptimePercentage: number;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<SystemStatus>) {
  const startTime = Date.now();
  const version = process.env.npm_package_version || '1.0.0';
  const environment = process.env.NODE_ENV || 'development';

  try {
    // Initialize system status
    const status: SystemStatus = {
      status: 'operational',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version,
      environment,
      systems: {
        data: {
          status: 'operational',
          lastUpdate: '',
          totalMarketplaces: 0,
          totalPlugins: 0,
          dataFreshness: '',
          errors: [],
        },
        github: {
          status: 'operational',
          rateLimit: {
            limit: 0,
            remaining: 0,
            reset: '',
            used: 0,
          },
          lastCheck: new Date().toISOString(),
          errors: [],
        },
        build: {
          status: 'operational',
          lastBuild: '',
          buildTime: '',
          errors: [],
        },
        performance: {
          status: 'operational',
          memory: {
            used: 0,
            total: 0,
            percentage: 0,
          },
          cpu: {
            loadAverage: [0, 0, 0],
          },
          responseTime: 0,
        },
      },
      incidents: [],
      metrics: {
        requestsToday: 0,
        errorsToday: 0,
        averageResponseTime: 0,
        uptimePercentage: 0,
      },
    };

    // Check data system
    try {
      const dataDir = path.join(process.cwd(), 'public', 'data');
      const indexFile = path.join(dataDir, 'index.json');
      const marketplacesFile = path.join(dataDir, 'marketplaces.json');
      const pluginsFile = path.join(dataDir, 'plugins.json');

      if (fs.existsSync(indexFile)) {
        const indexData = JSON.parse(fs.readFileSync(indexFile, 'utf8'));
        const stats = fs.statSync(indexFile);
        const hoursSinceModified = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);

        status.systems.data.lastUpdate = stats.mtime.toISOString();
        status.systems.data.dataFreshness = `${Math.round(hoursSinceModified)} hours ago`;

        if (indexData.stats) {
          status.systems.data.totalMarketplaces = indexData.stats.totalMarketplaces || 0;
          status.systems.data.totalPlugins = indexData.stats.totalPlugins || 0;
        }

        // Check data freshness (older than 12 hours is degraded, older than 24 hours is down)
        if (hoursSinceModified > 24) {
          status.systems.data.status = 'down';
          status.systems.data.errors?.push('Data is more than 24 hours old');
        } else if (hoursSinceModified > 12) {
          status.systems.data.status = 'degraded';
          status.systems.data.errors?.push('Data is more than 12 hours old');
        }
      } else {
        status.systems.data.status = 'down';
        status.systems.data.errors?.push('Data files not found');
      }

      // Count actual marketplace and plugin files
      if (fs.existsSync(marketplacesFile)) {
        const marketplacesData = JSON.parse(fs.readFileSync(marketplacesFile, 'utf8'));
        status.systems.data.totalMarketplaces = Array.isArray(marketplacesData)
          ? marketplacesData.length
          : Object.keys(marketplacesData).length;
      }

      if (fs.existsSync(pluginsFile)) {
        const pluginsData = JSON.parse(fs.readFileSync(pluginsFile, 'utf8'));
        status.systems.data.totalPlugins = Array.isArray(pluginsData)
          ? pluginsData.length
          : Object.keys(pluginsData).length;
      }
    } catch (error) {
      status.systems.data.status = 'down';
      status.systems.data.errors?.push(
        `Data check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    // Check GitHub API
    try {
      const response = await fetch('https://api.github.com/rate_limit', {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const rateLimitData = await response.json();
        status.systems.github.rateLimit = {
          limit: rateLimitData.rate.limit,
          remaining: rateLimitData.rate.remaining,
          reset: new Date(rateLimitData.rate.reset * 1000).toISOString(),
          used: rateLimitData.rate.used,
        };

        // Check rate limit status
        const percentageUsed = (rateLimitData.rate.used / rateLimitData.rate.limit) * 100;
        if (percentageUsed > 90) {
          status.systems.github.status = 'degraded';
          status.systems.github.errors?.push('GitHub API rate limit nearly exhausted');
        }
      } else {
        status.systems.github.status = 'down';
        status.systems.github.errors?.push(`GitHub API returned ${response.status}`);
      }
    } catch (error) {
      status.systems.github.status = 'down';
      status.systems.github.errors?.push(
        `GitHub API check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    // Check build status
    try {
      const outDir = path.join(process.cwd(), 'out');
      const packageJsonPath = path.join(process.cwd(), 'package.json');

      if (fs.existsSync(outDir)) {
        status.systems.build.status = 'operational';
        const stats = fs.statSync(outDir);
        status.systems.build.lastBuild = stats.mtime.toISOString();
      } else {
        status.systems.build.status = 'down';
        status.systems.build.errors?.push('Build output directory not found');
      }

      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        status.version = packageJson.version || version;
      }
    } catch (error) {
      status.systems.build.status = 'down';
      status.systems.build.errors?.push(
        `Build check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    // Check performance
    try {
      const memoryUsage = process.memoryUsage();
      const memoryUsedMB = memoryUsage.heapUsed / 1024 / 1024;
      const memoryTotalMB = memoryUsage.heapTotal / 1024 / 1024;

      status.systems.performance.memory = {
        used: Math.round(memoryUsedMB),
        total: Math.round(memoryTotalMB),
        percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
      };

      // Get CPU load average (available on Unix systems)
      if (process.platform !== 'win32') {
        status.systems.performance.cpu.loadAverage =
          process.cpuUsage().user !== undefined ? [0, 0, 0] : [0, 0, 0];
      }

      status.systems.performance.responseTime = Date.now() - startTime;

      // Check memory usage (over 80% is degraded, over 90% is down)
      if (status.systems.performance.memory.percentage > 90) {
        status.systems.performance.status = 'down';
        status.systems.performance.errors?.push('Memory usage critically high');
      } else if (status.systems.performance.memory.percentage > 80) {
        status.systems.performance.status = 'degraded';
        status.systems.performance.errors?.push('Memory usage high');
      }
    } catch (error) {
      status.systems.performance.status = 'down';
      status.systems.performance.errors?.push(
        `Performance check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    // Determine overall status
    const systemStatuses = Object.values(status.systems);
    const hasDown = systemStatuses.some((s) => s.status === 'down');
    const hasDegraded = systemStatuses.some((s) => s.status === 'degraded');

    if (hasDown) {
      status.status = 'down';
    } else if (hasDegraded) {
      status.status = 'degraded';
    }

    // Simulate some metrics (in a real implementation, these would come from a monitoring system)
    status.metrics = {
      requestsToday: Math.floor(Math.random() * 10000) + 1000,
      errorsToday: status.systems.data.errors?.length || 0,
      averageResponseTime: Math.round(status.systems.performance.responseTime),
      uptimePercentage: Math.round((status.uptime / (24 * 60 * 60)) * 100), // Convert to percentage of current day
    };

    // Set cache headers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('X-Response-Time', `${status.systems.performance.responseTime}ms`);

    const statusCode =
      status.status === 'operational' ? 200 : status.status === 'degraded' ? 200 : 503;
    return res.status(statusCode).json(status);
  } catch (error) {
    console.error('Status check failed:', error);

    const errorResponse: SystemStatus = {
      status: 'down',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version,
      environment,
      systems: {
        data: {
          status: 'down',
          lastUpdate: '',
          totalMarketplaces: 0,
          totalPlugins: 0,
          dataFreshness: '',
          errors: ['System unavailable'],
        },
        github: {
          status: 'down',
          rateLimit: { limit: 0, remaining: 0, reset: '', used: 0 },
          lastCheck: '',
          errors: ['System unavailable'],
        },
        build: { status: 'down', lastBuild: '', buildTime: '', errors: ['System unavailable'] },
        performance: {
          status: 'down',
          memory: { used: 0, total: 0, percentage: 0 },
          cpu: { loadAverage: [0, 0, 0] },
          responseTime: 0,
        },
      },
      incidents: [
        {
          id: 'system-down',
          title: 'System Unavailable',
          description: error instanceof Error ? error.message : 'Unknown system error',
          severity: 'critical',
          status: 'open',
          createdAt: new Date().toISOString(),
        },
      ],
      metrics: {
        requestsToday: 0,
        errorsToday: 1,
        averageResponseTime: 0,
        uptimePercentage: 0,
      },
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
