import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface AnalyticsData {
  overview: {
    totalMarketplaces: number;
    totalPlugins: number;
    totalDownloads: number;
    totalStars: number;
    activeDevelopers: number;
    languages: Array<{ name: string; count: number; percentage: number }>;
    categories: Array<{ name: string; count: number; percentage: number }>;
  };
  trends: {
    daily: Array<{
      date: string;
      marketplaces: number;
      plugins: number;
      stars: number;
      downloads: number;
    }>;
    weekly: Array<{
      week: string;
      marketplaces: number;
      plugins: number;
      stars: number;
      downloads: number;
    }>;
    monthly: Array<{
      month: string;
      marketplaces: number;
      plugins: number;
      stars: number;
      downloads: number;
    }>;
  };
  ecosystem: {
    topMarketplaces: Array<{
      name: string;
      url: string;
      stars: number;
      forks: number;
      plugins: number;
      lastUpdated: string;
    }>;
    topPlugins: Array<{
      name: string;
      repository: string;
      stars: number;
      downloads: number;
      author: string;
      lastUpdated: string;
    }>;
    activeContributors: Array<{
      username: string;
      contributions: number;
      repositories: number;
    }>;
  };
  health: {
    dataFreshness: string;
    lastScan: string;
    scanDuration: number;
    errorCount: number;
    successRate: number;
    githubApiStatus: 'healthy' | 'degraded' | 'down';
    rateLimitStatus: {
      limit: number;
      remaining: number;
      reset: string;
    };
  };
  performance: {
    averageResponseTime: number;
    uptime: number;
    memoryUsage: {
      used: number;
      total: number;
      percentage: number;
    };
    errorRate: number;
    requestsPerMinute: number;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnalyticsData>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' } as any);
  }

  try {
    const startTime = Date.now();

    // Load data files
    const dataDir = path.join(process.cwd(), 'public', 'data');
    const analyticsData: AnalyticsData = {
      overview: {
        totalMarketplaces: 0,
        totalPlugins: 0,
        totalDownloads: 0,
        totalStars: 0,
        activeDevelopers: 0,
        languages: [],
        categories: []
      },
      trends: {
        daily: [],
        weekly: [],
        monthly: []
      },
      ecosystem: {
        topMarketplaces: [],
        topPlugins: [],
        activeContributors: []
      },
      health: {
        dataFreshness: '',
        lastScan: '',
        scanDuration: 0,
        errorCount: 0,
        successRate: 0,
        githubApiStatus: 'healthy',
        rateLimitStatus: {
          limit: 0,
          remaining: 0,
          reset: ''
        }
      },
      performance: {
        averageResponseTime: 0,
        uptime: process.uptime(),
        memoryUsage: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)
        },
        errorRate: 0,
        requestsPerMinute: 0
      }
    };

    // Load and analyze marketplaces data
    try {
      const marketplacesPath = path.join(dataDir, 'marketplaces.json');
      if (fs.existsSync(marketplacesPath)) {
        const marketplacesData = JSON.parse(fs.readFileSync(marketplacesPath, 'utf8'));
        const marketplaces = Array.isArray(marketplacesData) ? marketplacesData : Object.values(marketplacesData);

        analyticsData.overview.totalMarketplaces = marketplaces.length;

        // Calculate total stars and forks
        let totalStars = 0;
        let totalForks = 0;
        const languageCount: Record<string, number> = {};

        marketplaces.forEach((marketplace: any) => {
          totalStars += marketplace.stars || 0;
          totalForks += marketplace.forks || 0;

          if (marketplace.language) {
            languageCount[marketplace.language] = (languageCount[marketplace.language] || 0) + 1;
          }
        });

        analyticsData.overview.totalStars = totalStars;

        // Convert language counts to percentages
        const totalLanguageCount = Object.values(languageCount).reduce((sum, count) => sum + count, 0);
        analyticsData.overview.languages = Object.entries(languageCount)
          .map(([name, count]) => ({
            name,
            count,
            percentage: Math.round((count / totalLanguageCount) * 100)
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        // Get top marketplaces
        analyticsData.ecosystem.topMarketplaces = marketplaces
          .sort((a: any, b: any) => (b.stars || 0) - (a.stars || 0))
          .slice(0, 10)
          .map((marketplace: any) => ({
            name: marketplace.name,
            url: marketplace.url,
            stars: marketplace.stars || 0,
            forks: marketplace.forks || 0,
            plugins: marketplace.pluginCount || 0,
            lastUpdated: marketplace.updatedAt || ''
          }));

        // Count active developers (unique repository owners)
        const uniqueDevelopers = new Set(
          marketplaces.map((m: any) => m.owner || m.url?.split('/')[3]).filter(Boolean)
        );
        analyticsData.overview.activeDevelopers = uniqueDevelopers.size;
      }
    } catch (error) {
      console.error('Error loading marketplaces data:', error);
    }

    // Load and analyze plugins data
    try {
      const pluginsPath = path.join(dataDir, 'plugins.json');
      if (fs.existsSync(pluginsPath)) {
        const pluginsData = JSON.parse(fs.readFileSync(pluginsPath, 'utf8'));
        const plugins = Array.isArray(pluginsData) ? pluginsData : Object.values(pluginsData);

        analyticsData.overview.totalPlugins = plugins.length;

        // Calculate total downloads and categorize plugins
        let totalDownloads = 0;
        const categoryCount: Record<string, number> = {};

        plugins.forEach((plugin: any) => {
          totalDownloads += plugin.downloads || 0;

          if (plugin.category) {
            categoryCount[plugin.category] = (categoryCount[plugin.category] || 0) + 1;
          }
        });

        analyticsData.overview.totalDownloads = totalDownloads;

        // Convert category counts to percentages
        const totalCategoryCount = Object.values(categoryCount).reduce((sum, count) => sum + count, 0);
        analyticsData.overview.categories = Object.entries(categoryCount)
          .map(([name, count]) => ({
            name,
            count,
            percentage: Math.round((count / totalCategoryCount) * 100)
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        // Get top plugins
        analyticsData.ecosystem.topPlugins = plugins
          .sort((a: any, b: any) => (b.stars || b.downloads || 0) - (a.stars || a.downloads || 0))
          .slice(0, 10)
          .map((plugin: any) => ({
            name: plugin.name,
            repository: plugin.repository || plugin.url,
            stars: plugin.stars || 0,
            downloads: plugin.downloads || 0,
            author: plugin.author || '',
            lastUpdated: plugin.updatedAt || ''
          }));

        // Get unique plugin authors (active contributors)
        const uniqueAuthors = new Set(plugins.map((p: any) => p.author).filter(Boolean));
        analyticsData.ecosystem.activeContributors = Array.from(uniqueAuthors)
          .slice(0, 10)
          .map(author => ({
            username: author as string,
            contributions: plugins.filter((p: any) => p.author === author).length,
            repositories: 0 // Would need additional data to calculate this
          }));
      }
    } catch (error) {
      console.error('Error loading plugins data:', error);
    }

    // Load index data for additional statistics
    try {
      const indexPath = path.join(dataDir, 'index.json');
      if (fs.existsSync(indexPath)) {
        const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));

        if (indexData.stats) {
          // Override with more accurate stats if available
          analyticsData.overview.totalMarketplaces = indexData.stats.totalMarketplaces || analyticsData.overview.totalMarketplaces;
          analyticsData.overview.totalPlugins = indexData.stats.totalPlugins || analyticsData.overview.totalPlugins;
          analyticsData.overview.totalDownloads = indexData.stats.totalDownloads || analyticsData.overview.totalDownloads;
          analyticsData.overview.totalStars = indexData.stats.totalStars || analyticsData.overview.totalStars;
        }

        if (indexData.metadata) {
          analyticsData.health.lastScan = indexData.metadata.lastScan || '';
          analyticsData.health.scanDuration = indexData.metadata.scanDuration || 0;
          analyticsData.health.errorCount = indexData.metadata.errorCount || 0;
          analyticsData.health.successRate = indexData.metadata.successRate || 100;
        }
      }
    } catch (error) {
      console.error('Error loading index data:', error);
    }

    // Calculate data freshness
    try {
      const indexPath = path.join(dataDir, 'index.json');
      if (fs.existsSync(indexPath)) {
        const stats = fs.statSync(indexPath);
        const hoursSinceModified = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);
        analyticsData.health.dataFreshness = `${Math.round(hoursSinceModified)} hours ago`;
        analyticsData.health.lastScan = stats.mtime.toISOString();
      }
    } catch (error) {
      analyticsData.health.dataFreshness = 'Unknown';
    }

    // Check GitHub API status
    try {
      const response = await fetch('https://api.github.com/rate_limit', {
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
        },
        signal: AbortSignal.timeout(3000)
      });

      if (response.ok) {
        const rateLimitData = await response.json();
        analyticsData.health.rateLimitStatus = {
          limit: rateLimitData.rate.limit,
          remaining: rateLimitData.rate.remaining,
          reset: new Date(rateLimitData.rate.reset * 1000).toISOString()
        };

        const percentageUsed = (rateLimitData.rate.used / rateLimitData.rate.limit) * 100;
        if (percentageUsed > 90) {
          analyticsData.health.githubApiStatus = 'degraded';
        } else {
          analyticsData.health.githubApiStatus = 'healthy';
        }
      } else {
        analyticsData.health.githubApiStatus = 'down';
      }
    } catch (error) {
      analyticsData.health.githubApiStatus = 'down';
    }

    // Generate mock trend data (in a real implementation, this would come from historical data)
    const now = new Date();
    analyticsData.trends.daily = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      return {
        date: date.toISOString().split('T')[0],
        marketplaces: Math.floor(Math.random() * 5) + 1,
        plugins: Math.floor(Math.random() * 20) + 5,
        stars: Math.floor(Math.random() * 100) + 10,
        downloads: Math.floor(Math.random() * 500) + 50
      };
    }).reverse();

    analyticsData.trends.weekly = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (i * 7));
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      return {
        week: weekStart.toISOString().split('T')[0],
        marketplaces: Math.floor(Math.random() * 25) + 5,
        plugins: Math.floor(Math.random() * 100) + 20,
        stars: Math.floor(Math.random() * 500) + 100,
        downloads: Math.floor(Math.random() * 2500) + 500
      };
    }).reverse();

    analyticsData.trends.monthly = Array.from({ length: 6 }, (_, i) => {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      return {
        month: date.toISOString().slice(0, 7),
        marketplaces: Math.floor(Math.random() * 50) + 10,
        plugins: Math.floor(Math.random() * 200) + 50,
        stars: Math.floor(Math.random() * 1000) + 200,
        downloads: Math.floor(Math.random() * 5000) + 1000
      };
    }).reverse();

    // Calculate response time
    analyticsData.performance.averageResponseTime = Date.now() - startTime;

    // Set cache headers
    res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
    res.setHeader('X-Response-Time', `${analyticsData.performance.averageResponseTime}ms`);

    return res.status(200).json(analyticsData);

  } catch (error) {
    console.error('Analytics endpoint error:', error);

    const errorResponse = {
      error: 'Failed to retrieve analytics data',
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