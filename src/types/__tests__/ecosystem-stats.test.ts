/**
 * Ecosystem Statistics Type Tests
 *
 * Tests to verify that all ecosystem statistics types work correctly
 * and can be instantiated and used as expected.
 */

import {
  EcosystemOverview,
  GrowthTrends,
  CategoryAnalytics,
  CommunityData,
  QualityIndicators,
  EcosystemStatsResponse,
  validators,
  createSuccessResponse,
  formatNumber,
  formatDate,
  calculateGrowthRate,
  mockEcosystemOverview,
  mockGrowthTrends,
} from '../index';

describe('Ecosystem Statistics Types', () => {
  describe('Type Instantiation', () => {
    test('should create valid EcosystemOverview', () => {
      const overview: EcosystemOverview = {
        totalPlugins: 1250,
        totalMarketplaces: 15,
        totalDevelopers: 340,
        totalDownloads: 48200,
        lastUpdated: '2025-10-21T10:30:00Z',
        growthRate: {
          plugins: 15.2,
          marketplaces: 7.1,
          developers: 12.8,
          downloads: 23.4,
        },
      };

      expect(overview.totalPlugins).toBe(1250);
      expect(overview.growthRate.plugins).toBe(15.2);
    });

    test('should create valid GrowthTrends', () => {
      const trends: GrowthTrends = {
        plugins: [
          { date: '2025-10-20T10:30:00Z', value: 1240 },
          { date: '2025-10-21T10:30:00Z', value: 1250, change: 10 },
        ],
        marketplaces: [
          { date: '2025-10-20T10:30:00Z', value: 14 },
          { date: '2025-10-21T10:30:00Z', value: 15, change: 1 },
        ],
        developers: [
          { date: '2025-10-20T10:30:00Z', value: 335 },
          { date: '2025-10-21T10:30:00Z', value: 340, change: 5 },
        ],
        downloads: [
          { date: '2025-10-20T10:30:00Z', value: 47950 },
          { date: '2025-10-21T10:30:00Z', value: 48200, change: 250 },
        ],
        period: '30d',
        aggregation: 'daily',
      };

      expect(trends.plugins).toHaveLength(2);
      expect(trends.period).toBe('30d');
    });

    test('should create valid CategoryAnalytics', () => {
      const analytics: CategoryAnalytics = {
        categories: [
          {
            id: 'development',
            name: 'Development Tools',
            count: 450,
            percentage: 36.0,
            growthRate: 18.2,
            topPlugins: [],
            trending: true,
          },
        ],
        trending: ['development'],
        emerging: ['ai-ml'],
        insights: ['Development tools continue to lead growth'],
      };

      expect(analytics.categories).toHaveLength(1);
      expect(analytics.categories[0].name).toBe('Development Tools');
    });
  });

  describe('API Response Types', () => {
    test('should create success response', () => {
      const response = createSuccessResponse(mockEcosystemOverview);

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.error).toBeUndefined();
      expect(response.meta.timestamp).toBeDefined();
    });

    test('should create valid EcosystemStatsResponse', () => {
      const response: EcosystemStatsResponse = {
        success: true,
        data: mockEcosystemOverview,
        meta: {
          timestamp: '2025-10-21T10:30:00Z',
          requestId: 'test-123',
          responseTime: 100,
        },
      };

      expect(response.success).toBe(true);
      expect(response.data?.totalPlugins).toBe(1250);
    });
  });

  describe('Utility Functions', () => {
    test('should format numbers correctly', () => {
      expect(formatNumber(1250)).toBe('1.3K');
      expect(formatNumber(2500000)).toBe('2.5M');
      expect(formatNumber(150)).toBe('150');
    });

    test('should format dates correctly', () => {
      const date = '2025-10-21T10:30:00Z';
      expect(formatDate(date, 'short')).toContain('2025');
    });

    test('should calculate growth rates', () => {
      expect(calculateGrowthRate(150, 100)).toBe(50);
      expect(calculateGrowthRate(100, 150)).toBeCloseTo(-33.33, 1);
    });
  });

  describe('Validation', () => {
    test('should validate ecosystem overview', () => {
      const result = validators.ecosystemOverview(mockEcosystemOverview);
      expect(result.totalPlugins).toBe(1250);
    });

    test('should validate growth trends', () => {
      const result = validators.growthTrends(mockGrowthTrends);
      expect(result.plugins.length).toBeGreaterThan(0);
      expect(result.period).toBe('30d');
    });

    test('should handle invalid data gracefully', () => {
      expect(() => {
        validators.ecosystemOverview({
          totalPlugins: -1, // Invalid: negative number
          totalMarketplaces: 15,
          totalDevelopers: 340,
          totalDownloads: 48200,
          lastUpdated: '2025-10-21T10:30:00Z',
          growthRate: {
            plugins: 15.2,
            marketplaces: 7.1,
            developers: 12.8,
            downloads: 23.4,
          },
        });
      }).toThrow();
    });
  });

  describe('Type Guards', () => {
    test('should identify valid ecosystem overview', () => {
      expect(validators.ecosystemOverview(mockEcosystemOverview)).toBeDefined();
    });

    test('should reject invalid ecosystem overview', () => {
      const invalid = { ...mockEcosystemOverview, totalPlugins: 'invalid' };
      expect(() => validators.ecosystemOverview(invalid)).toThrow();
    });
  });

  describe('Complex Data Structures', () => {
    test('should handle nested ecosystem data', () => {
      const complexData = {
        overview: mockEcosystemOverview,
        growthTrends: mockGrowthTrends,
        categoryAnalytics: {
          categories: [],
          trending: [],
          emerging: [],
          insights: [],
        } as CategoryAnalytics,
        communityData: {
          activeDevelopers: 340,
          developerParticipation: {
            newDevelopers: 42,
            multiPluginDevelopers: 128,
            retentionRate: 78.5,
            avgContributions: 2.8,
          },
          engagement: {
            avgRating: 4.5,
            totalReviews: 3240,
            activeDiscussions: 487,
            contributions: 1250,
          },
        } as CommunityData,
        qualityIndicators: {
          verification: {
            verifiedPlugins: 525,
            verificationRate: 42.0,
            badges: [],
          },
          maintenance: {
            recentlyUpdated: 892,
            activeMaintenanceRate: 71.4,
            avgUpdateFrequency: 14.5,
            abandonedPlugins: 45,
          },
          qualityMetrics: {
            avgQualityScore: 76.8,
            highQualityPlugins: 475,
            commonIssues: [],
          },
        } as QualityIndicators,
      };

      expect(complexData.overview.totalPlugins).toBe(1250);
      expect(complexData.growthTrends.plugins.length).toBeGreaterThan(0);
      expect(complexData.communityData.activeDevelopers).toBe(340);
      expect(complexData.qualityIndicators.verification.verificationRate).toBe(42.0);
    });
  });
});
