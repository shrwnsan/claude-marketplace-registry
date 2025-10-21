/**
 * Ecosystem Statistics Data Storage and Interfaces
 *
 * This module defines the data structures, interfaces, and storage mechanisms
 * for ecosystem statistics, including time-series data, caching, and mock data
 * generation for development and testing.
 *
 * Key Features:
 * - Complete ecosystem metrics interfaces
 * - Time-series data structure for growth trends
 * - Caching mechanism for performance optimization
 * - Mock data generation for development
 * - Data validation and type safety
 * - Performance monitoring and metrics
 *
 * @author Claude Code Marketplace Team
 * @version 1.0.0
 */

import {
  EcosystemOverview,
  GrowthDataPoint,
  CategoryAnalytics,
  DeveloperAnalytics,
  QualityMetrics,
  TimeRange,
} from '../utils/data-processor';
import { CollectionResult } from '../services/ecosystem-data';

/**
 * Complete ecosystem statistics response
 */
export interface EcosystemStats {
  /** Overview metrics for the entire ecosystem */
  overview: EcosystemOverview;
  /** Growth trends over time */
  growth: {
    [key in TimeRange]: GrowthDataPoint[];
  };
  /** Category breakdown and analytics */
  categories: CategoryAnalytics[];
  /** Top developer analytics */
  developers: DeveloperAnalytics[];
  /** Quality and trust metrics */
  quality: QualityMetrics;
  /** Metadata about the data */
  metadata: EcosystemMetadata;
}

/**
 * Metadata about the ecosystem statistics
 */
export interface EcosystemMetadata {
  /** When the data was last updated */
  lastUpdated: string;
  /** Data sources used for collection */
  dataSources: string[];
  /** Total processing time in milliseconds */
  processingTime: number;
  /** Number of marketplaces included */
  marketplaceCount: number;
  /** Number of plugins included */
  pluginCount: number;
  /** Cache information */
  cacheInfo: {
    hit: boolean;
    ttl: number;
    remainingTtl: number;
  };
  /** Data freshness indicators */
  freshness: {
    marketplacesAge: number; // Hours since last marketplace scan
    pluginsAge: number; // Hours since last plugin scan
  };
}

/**
 * Cached data entry interface
 */
export interface CacheEntry<T> {
  /** Cached data */
  data: T;
  /** When the cache entry was created */
  createdAt: number;
  /** Time-to-live in milliseconds */
  ttl: number;
  /** Number of times this entry was accessed */
  accessCount: number;
  /** Last access timestamp */
  lastAccessed: number;
  /** Cache entry size in bytes (approximate) */
  size: number;
}

/**
 * Cache statistics interface
 */
export interface CacheStats {
  /** Total number of cached entries */
  totalEntries: number;
  /** Total cache size in bytes */
  totalSize: number;
  /** Cache hit rate as percentage */
  hitRate: number;
  /** Number of cache hits */
  hits: number;
  /** Number of cache misses */
  misses: number;
  /** Oldest entry age in milliseconds */
  oldestEntry: number;
  /** Newest entry age in milliseconds */
  newestEntry: number;
}

/**
 * Mock data generation configuration
 */
export interface MockDataConfig {
  /** Number of mock marketplaces to generate */
  marketplaceCount: number;
  /** Number of mock plugins per marketplace */
  pluginsPerMarketplace: number;
  /** Number of mock developers */
  developerCount: number;
  /** Number of categories to use */
  categoryCount: number;
  /** Generate historical data for growth trends */
  generateHistoricalData: boolean;
  /** Historical data range in months */
  historicalMonths: number;
  /** Enable realistic quality scores */
  realisticQuality: boolean;
  /** Enable realistic growth patterns */
  realisticGrowth: boolean;
}

/**
 * Data storage interface
 */
export interface IDataStorage {
  /** Store ecosystem statistics */
  storeEcosystemStats(stats: EcosystemStats): Promise<void>;
  /** Retrieve ecosystem statistics */
  getEcosystemStats(key: string): Promise<EcosystemStats | null>;
  /** Store collection result */
  storeCollectionResult<T>(key: string, result: CollectionResult<T>): Promise<void>;
  /** Retrieve collection result */
  getCollectionResult<T>(key: string): Promise<CollectionResult<T> | null>;
  /** Clear all cached data */
  clearCache(): Promise<void>;
  /** Get cache statistics */
  getCacheStats(): Promise<CacheStats>;
}

/**
 * In-memory implementation of data storage
 */
export class InMemoryDataStorage implements IDataStorage {
  private cache = new Map<string, CacheEntry<any>>();
  private stats = {
    hits: 0,
    misses: 0,
    totalSize: 0,
  };

  async storeEcosystemStats(stats: EcosystemStats): Promise<void> {
    const key = 'ecosystem-stats';
    const entry: CacheEntry<EcosystemStats> = {
      data: stats,
      createdAt: Date.now(),
      ttl: 6 * 60 * 60 * 1000, // 6 hours
      accessCount: 0,
      lastAccessed: Date.now(),
      size: this.estimateSize(stats),
    };

    this.cache.set(key, entry);
    this.stats.totalSize += entry.size;

    console.log('💾 Ecosystem stats cached:', {
      overview: stats.overview.totalPlugins,
      categories: stats.categories.length,
      size: entry.size,
    });
  }

  async getEcosystemStats(key: string): Promise<EcosystemStats | null> {
    const entry = this.cache.get(key) as CacheEntry<EcosystemStats> | undefined;

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check TTL
    if (Date.now() - entry.createdAt > entry.ttl) {
      this.cache.delete(key);
      this.stats.totalSize -= entry.size;
      this.stats.misses++;
      return null;
    }

    // Update access stats
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;

    console.log('📦 Cache hit for ecosystem stats');
    return entry.data;
  }

  async storeCollectionResult<T>(key: string, result: CollectionResult<T>): Promise<void> {
    const entry: CacheEntry<CollectionResult<T>> = {
      data: result,
      createdAt: Date.now(),
      ttl: 6 * 60 * 60 * 1000, // 6 hours
      accessCount: 0,
      lastAccessed: Date.now(),
      size: this.estimateSize(result),
    };

    // Remove old entry if exists
    const oldEntry = this.cache.get(key);
    if (oldEntry) {
      this.stats.totalSize -= oldEntry.size;
    }

    this.cache.set(key, entry);
    this.stats.totalSize += entry.size;
  }

  async getCollectionResult<T>(key: string): Promise<CollectionResult<T> | null> {
    const entry = this.cache.get(key) as CacheEntry<CollectionResult<T>> | undefined;

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check TTL
    if (Date.now() - entry.createdAt > entry.ttl) {
      this.cache.delete(key);
      this.stats.totalSize -= entry.size;
      this.stats.misses++;
      return null;
    }

    // Update access stats
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;

    return entry.data;
  }

  async clearCache(): Promise<void> {
    this.cache.clear();
    this.stats.totalSize = 0;
    this.stats.hits = 0;
    this.stats.misses = 0;
    console.log('🗑️ Cache cleared');
  }

  async getCacheStats(): Promise<CacheStats> {
    const entries = Array.from(this.cache.values());
    const now = Date.now();
    const ages = entries.map(e => now - e.createdAt);

    return {
      totalEntries: this.cache.size,
      totalSize: this.stats.totalSize,
      hitRate: this.stats.hits + this.stats.misses > 0
        ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100
        : 0,
      hits: this.stats.hits,
      misses: this.stats.misses,
      oldestEntry: Math.min(...ages),
      newestEntry: Math.max(...ages),
    };
  }

  /**
   * Estimate object size in bytes (rough approximation)
   */
  private estimateSize(obj: any): number {
    return JSON.stringify(obj).length * 2; // Rough estimate
  }
}

/**
 * Mock Data Generator
 *
 * Generates realistic mock data for development and testing
 */
export class MockDataGenerator {
  private config: MockDataConfig;

  constructor(config: Partial<MockDataConfig> = {}) {
    this.config = {
      marketplaceCount: 5,
      pluginsPerMarketplace: 20,
      developerCount: 15,
      categoryCount: 8,
      generateHistoricalData: true,
      historicalMonths: 12,
      realisticQuality: true,
      realisticGrowth: true,
      ...config,
    };
  }

  /**
   * Generate complete mock ecosystem statistics
   */
  generateMockEcosystemStats(): EcosystemStats {
    console.log('🎭 Generating mock ecosystem data with config:', this.config);

    const startTime = Date.now();

    // Generate overview metrics
    const overview = this.generateMockOverview();

    // Generate growth trends
    const growth = this.generateMockGrowth();

    // Generate category analytics
    const categories = this.generateMockCategories();

    // Generate developer analytics
    const developers = this.generateMockDevelopers();

    // Generate quality metrics
    const quality = this.generateMockQuality();

    // Generate metadata
    const metadata = this.generateMockMetadata(Date.now() - startTime);

    const stats: EcosystemStats = {
      overview,
      growth,
      categories,
      developers,
      quality,
      metadata,
    };

    console.log('✅ Mock ecosystem data generated:', {
      plugins: overview.totalPlugins,
      marketplaces: overview.totalMarketplaces,
      categories: categories.length,
      processingTime: metadata.processingTime,
    });

    return stats;
  }

  /**
   * Generate mock overview metrics
   */
  private generateMockOverview(): EcosystemOverview {
    const totalPlugins = this.config.marketplaceCount * this.config.pluginsPerMarketplace;
    const totalMarketplaces = this.config.marketplaceCount;
    const totalDevelopers = this.config.developerCount;
    const totalDownloads = totalPlugins * Math.floor(Math.random() * 1000 + 500);
    const totalStars = totalPlugins * Math.floor(Math.random() * 50 + 10);
    const totalForks = Math.floor(totalStars * 0.3);
    const verifiedMarketplaces = Math.floor(totalMarketplaces * 0.6);
    const verifiedPlugins = Math.floor(totalPlugins * 0.7);
    const averageQualityScore = Math.floor(Math.random() * 15 + 75);
    const totalCategories = this.config.categoryCount;

    return {
      totalPlugins,
      totalMarketplaces,
      totalDevelopers,
      totalDownloads,
      totalStars,
      totalForks,
      verifiedMarketplaces,
      verifiedPlugins,
      averageQualityScore,
      totalCategories,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Generate mock growth trends
   */
  private generateMockGrowth(): { [key in TimeRange]: GrowthDataPoint[] } {
    const timeRanges: TimeRange[] = ['7d', '30d', '90d', '6m', '1y', 'all'];
    const growth: any = {};

    for (const range of timeRanges) {
      growth[range] = this.generateGrowthDataPoints(range);
    }

    return growth;
  }

  /**
   * Generate growth data points for a specific time range
   */
  private generateGrowthDataPoints(timeRange: TimeRange): GrowthDataPoint[] {
    const points: GrowthDataPoint[] = [];
    const now = new Date();
    let startDate = new Date(now);
    let interval = 1; // days

    switch (timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        interval = 1;
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        interval = 3;
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        interval = 7;
        break;
      case '6m':
        startDate.setMonth(now.getMonth() - 6);
        interval = 14;
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        interval = 30;
        break;
      case 'all':
        startDate.setFullYear(2023, 0, 1); // Start of 2023
        interval = 30;
        break;
    }

    const currentDate = new Date(startDate);
    const finalPlugins = this.config.marketplaceCount * this.config.pluginsPerMarketplace;
    const finalMarketplaces = this.config.marketplaceCount;
    const finalDevelopers = this.config.developerCount;
    const finalDownloads = finalPlugins * (Math.floor(Math.random() * 1000 + 500));

    while (currentDate <= now) {
      const progress = (currentDate.getTime() - startDate.getTime()) / (now.getTime() - startDate.getTime());

      // Apply realistic growth curves
      let growthProgress = progress;
      if (this.config.realisticGrowth) {
        // S-curve growth pattern
        growthProgress = this.sCurveGrowth(progress);
      }

      points.push({
        date: currentDate.toISOString(),
        plugins: Math.floor(finalPlugins * growthProgress),
        marketplaces: Math.floor(finalMarketplaces * growthProgress),
        developers: Math.floor(finalDevelopers * growthProgress),
        downloads: Math.floor(finalDownloads * growthProgress),
      });

      currentDate.setDate(currentDate.getDate() + interval);
    }

    return points;
  }

  /**
   * S-curve growth function for realistic growth patterns
   */
  private sCurveGrowth(t: number): number {
    // Sigmoid function scaled to 0-1
    const k = 6; // Steepness
    const x0 = 0.5; // Midpoint
    return 1 / (1 + Math.exp(-k * (t - x0)));
  }

  /**
   * Generate mock category analytics
   */
  private generateMockCategories(): CategoryAnalytics[] {
    const categories = [
      'Development Tools',
      'Documentation',
      'Database',
      'Testing',
      'Security',
      'Frontend',
      'Backend',
      'DevOps',
      'AI/ML',
      'Design',
    ].slice(0, this.config.categoryCount);

    const totalPlugins = this.config.marketplaceCount * this.config.pluginsPerMarketplace;
    const categoryData: CategoryAnalytics[] = [];

    // Distribute plugins across categories
    let remainingPlugins = totalPlugins;
    for (let i = 0; i < categories.length; i++) {
      const isLast = i === categories.length - 1;
      const categoryPlugins = isLast
        ? remainingPlugins
        : Math.floor(remainingPlugins / (categories.length - i));

      remainingPlugins -= categoryPlugins;

      const developerCount = Math.floor(Math.random() * 5 + 2);
      const totalDownloads = categoryPlugins * (Math.floor(Math.random() * 800 + 200));
      const averageQualityScore = this.config.realisticQuality
        ? Math.floor(Math.random() * 20 + 75)
        : Math.floor(Math.random() * 30 + 60);

      categoryData.push({
        category: categories[i],
        pluginCount: categoryPlugins,
        percentage: (categoryPlugins / totalPlugins) * 100,
        averageQualityScore,
        totalDownloads,
        developerCount,
        growthRate: Math.random() * 20 - 5, // -5% to +15% growth
        popularTags: this.generateMockTags(),
        topPlugins: this.generateMockTopPlugins(Math.min(5, categoryPlugins)),
      });
    }

    return categoryData.sort((a, b) => b.pluginCount - a.pluginCount);
  }

  /**
   * Generate mock developer analytics
   */
  private generateMockDevelopers(): DeveloperAnalytics[] {
    const developers: DeveloperAnalytics[] = [];
    const categories = [
      'Development Tools',
      'Documentation',
      'Database',
      'Testing',
      'Security',
      'Frontend',
      'Backend',
      'DevOps',
    ];

    for (let i = 0; i < this.config.developerCount; i++) {
      const pluginCount = Math.floor(Math.random() * 5 + 1);
      const totalDownloads = pluginCount * (Math.floor(Math.random() * 1000 + 100));
      const totalStars = pluginCount * (Math.floor(Math.random() * 50 + 10));
      const averageQualityScore = this.config.realisticQuality
        ? Math.floor(Math.random() * 20 + 75)
        : Math.floor(Math.random() * 30 + 60);

      const developerCategories = categories
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.floor(Math.random() * 3 + 1));

      const firstPluginDate = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
      const lastPluginDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);

      developers.push({
        developer: `Developer ${i + 1}`,
        pluginCount,
        totalDownloads,
        totalStars,
        averageQualityScore,
        categories: developerCategories,
        firstPluginDate: firstPluginDate.toISOString(),
        lastPluginDate: lastPluginDate.toISOString(),
        verifiedPluginCount: Math.floor(Math.random() * pluginCount),
      });
    }

    return developers.sort((a, b) => b.totalDownloads - a.totalDownloads);
  }

  /**
   * Generate mock quality metrics
   */
  private generateMockQuality(): QualityMetrics {
    const totalPlugins = this.config.marketplaceCount * this.config.pluginsPerMarketplace;
    const verifiedPlugins = Math.floor(totalPlugins * 0.7);
    const highQualityPlugins = Math.floor(totalPlugins * 0.4);

    return {
      verifiedPluginPercentage: (verifiedPlugins / totalPlugins) * 100,
      verifiedMarketplacePercentage: 60, // Fixed for mock data
      highQualityPlugins,
      recentlyUpdatedPlugins: Math.floor(totalPlugins * 0.6),
      activeDevelopers: Math.floor(this.config.developerCount * 0.8),
      averagePluginAge: Math.random() * 180 + 30, // 30-210 days
      qualityDistribution: {
        excellent: Math.floor(totalPlugins * 0.2),
        good: Math.floor(totalPlugins * 0.3),
        fair: Math.floor(totalPlugins * 0.3),
        poor: Math.floor(totalPlugins * 0.2),
      },
    };
  }

  /**
   * Generate mock metadata
   */
  private generateMockMetadata(processingTime: number): EcosystemMetadata {
    return {
      lastUpdated: new Date().toISOString(),
      dataSources: ['mock-data-generator'],
      processingTime,
      marketplaceCount: this.config.marketplaceCount,
      pluginCount: this.config.marketplaceCount * this.config.pluginsPerMarketplace,
      cacheInfo: {
        hit: false,
        ttl: 6 * 60 * 60 * 1000,
        remainingTtl: 6 * 60 * 60 * 1000,
      },
      freshness: {
        marketplacesAge: 0,
        pluginsAge: 0,
      },
    };
  }

  /**
   * Generate mock tags
   */
  private generateMockTags(): string[] {
    const allTags = [
      'automation', 'productivity', 'development', 'testing', 'documentation',
      'api', 'database', 'security', 'frontend', 'backend', 'devops',
      'ai', 'machine-learning', 'code-review', 'debugging', 'monitoring',
    ];

    return allTags.sort(() => Math.random() - 0.5).slice(0, 5);
  }

  /**
   * Generate mock top plugins
   */
  private generateMockTopPlugins(count: number): Array<{
    id: string;
    name: string;
    stars: number;
    downloads: number;
    qualityScore: number;
  }> {
    const plugins = [];

    for (let i = 0; i < count; i++) {
      plugins.push({
        id: `mock-plugin-${i + 1}`,
        name: `Mock Plugin ${i + 1}`,
        stars: Math.floor(Math.random() * 500 + 50),
        downloads: Math.floor(Math.random() * 5000 + 500),
        qualityScore: this.config.realisticQuality
          ? Math.floor(Math.random() * 20 + 75)
          : Math.floor(Math.random() * 30 + 60),
      });
    }

    return plugins.sort((a, b) => b.stars - a.stars);
  }
}

/**
 * Default storage instance
 */
export const dataStorage = new InMemoryDataStorage();

/**
 * Default mock data generator
 */
export const mockDataGenerator = new MockDataGenerator();

/**
 * Convenience functions
 */
export async function getEcosystemStats(refreshCache = false): Promise<EcosystemStats> {
  const cacheKey = 'ecosystem-stats';

  if (!refreshCache) {
    const cached = await dataStorage.getEcosystemStats(cacheKey);
    if (cached) {
      return cached;
    }
  }

  // Generate fresh mock data
  const stats = mockDataGenerator.generateMockEcosystemStats();
  await dataStorage.storeEcosystemStats(stats);
  return stats;
}

export async function getCacheStatistics(): Promise<CacheStats> {
  return dataStorage.getCacheStats();
}

export async function clearAllCache(): Promise<void> {
  return dataStorage.clearCache();
}