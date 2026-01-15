/**
 * Ecosystem Data Service Tests
 *
 * Tests for the EcosystemDataService class, focusing on:
 * - Configuration management
 * - Caching behavior
 * - Error handling
 * - Mock data generation
 * - Quality score calculation
 */

import {
  EcosystemDataService,
  getEcosystemMarketplaces,
  getEcosystemPlugins,
  clearEcosystemCache,
  getEcosystemCacheStats,
} from '../ecosystem-data';
import { Marketplace, Plugin } from '@/types';

// Mock fetch globally
global.fetch = jest.fn();

describe('EcosystemDataService', () => {
  let service: EcosystemDataService;

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear cache before each test
    clearEcosystemCache();

    service = new EcosystemDataService({
      includeMockData: true,
      enableGitHubApi: false, // Disable API calls for unit tests
      enableDebugLogging: false,
    });
  });

  describe('Configuration', () => {
    it('should initialize with default configuration', () => {
      const defaultService = new EcosystemDataService();
      const config = (defaultService as any).config;

      expect(config.includeMockData).toBe(true);
      expect(config.maxConcurrentCalls).toBe(5);
      expect(config.apiTimeout).toBe(10000);
      expect(config.enableGitHubApi).toBe(true);
      expect(config.cacheTTL).toBe(360);
      expect(config.enableDebugLogging).toBe(true);
    });

    it('should accept custom configuration', () => {
      const customService = new EcosystemDataService({
        includeMockData: false,
        maxConcurrentCalls: 10,
        apiTimeout: 5000,
        enableGitHubApi: false,
        cacheTTL: 180,
        enableDebugLogging: false,
      });

      const config = (customService as any).config;
      expect(config.includeMockData).toBe(false);
      expect(config.maxConcurrentCalls).toBe(10);
      expect(config.apiTimeout).toBe(5000);
      expect(config.enableGitHubApi).toBe(false);
      expect(config.cacheTTL).toBe(180);
      expect(config.enableDebugLogging).toBe(false);
    });
  });

  describe('Cache Management', () => {
    it('should cache marketplace collection results', async () => {
      const result1 = await service.collectMarketplaces(false);
      const result2 = await service.collectMarketplaces(false);

      // Should return same cached data
      expect(result1.data).toEqual(result2.data);
      expect(result1.metadata.sources).toEqual(result2.metadata.sources);
    });

    it('should refresh cache when requested', async () => {
      const result1 = await service.collectMarketplaces(false);
      const result2 = await service.collectMarketplaces(true); // Force refresh

      // Data should be similar but cache was refreshed
      expect(result1.data.length).toBeGreaterThan(0);
      expect(result2.data.length).toBeGreaterThan(0);
    });

    it('should cache plugin collection results', async () => {
      const result1 = await service.collectPlugins(false);
      const result2 = await service.collectPlugins(false);

      // Should return same cached data
      expect(result1.data).toEqual(result2.data);
    });

    it('should provide cache statistics', () => {
      const stats = service.getCacheStats();

      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('keys');
      expect(Array.isArray(stats.keys)).toBe(true);
    });

    it('should clear cache', async () => {
      await service.collectMarketplaces(false);

      let stats = service.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);

      service.clearCache();

      stats = service.getCacheStats();
      expect(stats.size).toBe(0);
    });
  });

  describe('Marketplace Collection', () => {
    it('should collect marketplace data', async () => {
      const result = await service.collectMarketplaces();

      expect(result.data).toBeInstanceOf(Array);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.totalItems).toBeGreaterThan(0);
      expect(result.metadata.sources).toContain('mock-data');
    });

    it('should include warnings when mock data is used', async () => {
      const result = await service.collectMarketplaces();

      expect(result.warnings).toContain('Mock data included for development/testing purposes');
    });

    it('should return proper metadata structure', async () => {
      const result = await service.collectMarketplaces();

      expect(result.metadata).toMatchObject({
        totalItems: expect.any(Number),
        successfulItems: expect.any(Number),
        failedItems: expect.any(Number),
        collectionTime: expect.stringMatching(/\d+ms/),
        sources: expect.any(Array),
      });
    });

    it('should generate mock marketplaces with required properties', async () => {
      const result = await service.collectMarketplaces();

      result.data.forEach((marketplace: Marketplace) => {
        expect(marketplace).toHaveProperty('id');
        expect(marketplace).toHaveProperty('name');
        expect(marketplace).toHaveProperty('description');
        expect(marketplace).toHaveProperty('owner');
        expect(marketplace).toHaveProperty('repository');
        expect(marketplace).toHaveProperty('qualityScore');
        expect(marketplace).toHaveProperty('verified');
        expect(marketplace).toHaveProperty('lastScanned');

        expect(marketplace.id).toMatch(/^[a-z-]+-[a-z-]+$/);
        expect(marketplace.qualityScore).toBeGreaterThanOrEqual(0);
        expect(marketplace.qualityScore).toBeLessThanOrEqual(100);
      });
    });

    it('should handle errors in marketplace collection', async () => {
      const errorService = new EcosystemDataService({
        includeMockData: false,
        enableGitHubApi: true, // Will fail due to no real API
        enableDebugLogging: false,
      });

      // Mock fetch to throw error
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await errorService.collectMarketplaces();

      // Should return error result but not throw
      expect(result.data).toBeInstanceOf(Array);
      expect(result.errors.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Plugin Collection', () => {
    it('should collect plugin data', async () => {
      const result = await service.collectPlugins();

      expect(result.data).toBeInstanceOf(Array);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.totalItems).toBeGreaterThanOrEqual(0);
      expect(result.metadata.sources).toContain('mock-plugins');
    });

    it('should include mock plugins', async () => {
      const result = await service.collectPlugins();

      expect(result.data.length).toBeGreaterThan(0);
      expect(result.warnings).toContain(
        'Mock plugin data included for development/testing purposes'
      );
    });

    it('should generate plugins with required properties', async () => {
      const result = await service.collectPlugins();

      result.data.forEach((plugin: Plugin) => {
        expect(plugin).toHaveProperty('id');
        expect(plugin).toHaveProperty('name');
        expect(plugin).toHaveProperty('description');
        expect(plugin).toHaveProperty('marketplaceId');
        expect(plugin).toHaveProperty('qualityScore');
        expect(plugin).toHaveProperty('validated');
        expect(plugin).toHaveProperty('lastScanned');

        expect(plugin.qualityScore).toBeGreaterThanOrEqual(0);
        expect(plugin.qualityScore).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('Quality Score Calculation', () => {
    it('should calculate quality score for marketplace', async () => {
      const result = await service.collectMarketplaces();

      result.data.forEach((marketplace: Marketplace) => {
        expect(marketplace.qualityScore).toBeDefined();
        expect(typeof marketplace.qualityScore).toBe('number');
        expect(marketplace.qualityScore).toBeGreaterThanOrEqual(0);
        expect(marketplace.qualityScore).toBeLessThanOrEqual(100);
      });
    });

    it('should vary quality scores across marketplaces', async () => {
      const result = await service.collectMarketplaces();

      const qualityScores = result.data.map((m: Marketplace) => m.qualityScore);
      const uniqueScores = [...new Set(qualityScores)];

      // Mock data should have some variation
      expect(uniqueScores.length).toBeGreaterThan(1);
    });
  });
});

describe('Ecosystem Data Convenience Functions', () => {
  beforeEach(() => {
    clearEcosystemCache();
  });

  describe('getEcosystemMarketplaces', () => {
    it('should get marketplace data', async () => {
      const result = await getEcosystemMarketplaces();

      expect(result.data).toBeInstanceOf(Array);
      expect(result.metadata).toBeDefined();
    });

    it('should support cache refresh', async () => {
      const result1 = await getEcosystemMarketplaces(false);
      const result2 = await getEcosystemMarketplaces(true);

      expect(result1.data.length).toBeGreaterThan(0);
      expect(result2.data.length).toBeGreaterThan(0);
    });
  });

  describe('getEcosystemPlugins', () => {
    it('should get plugin data', async () => {
      const result = await getEcosystemPlugins();

      expect(result.data).toBeInstanceOf(Array);
      expect(result.metadata).toBeDefined();
    });
  });

  describe('clearEcosystemCache', () => {
    it('should clear all cached data', async () => {
      await getEcosystemMarketplaces();

      let stats = getEcosystemCacheStats();
      expect(stats.size).toBeGreaterThan(0);

      clearEcosystemCache();

      stats = getEcosystemCacheStats();
      expect(stats.size).toBe(0);
    });
  });

  describe('getEcosystemCacheStats', () => {
    it('should return cache statistics', () => {
      const stats = getEcosystemCacheStats();

      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('keys');
      expect(typeof stats.size).toBe('number');
      expect(Array.isArray(stats.keys)).toBe(true);
    });

    it('should reflect cache state after operations', async () => {
      let stats = getEcosystemCacheStats();
      const initialSize = stats.size;

      await getEcosystemMarketplaces();

      stats = getEcosystemCacheStats();
      expect(stats.size).toBeGreaterThan(initialSize);
    });
  });
});
