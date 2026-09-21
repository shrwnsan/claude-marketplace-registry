#!/usr/bin/env ts-node

/**
 * Data Generator
 *
 * This script processes marketplace and plugin data to generate
 * the final data files used by the website.
 */

import fs from 'fs';
import path from 'path';
import { format, parseISO } from 'date-fns';
import { canonicalAuthor } from './validate-plugins';
import { applyJevEnrichment, loadJevEnrichment } from './jev-categorize';

interface Marketplace {
  id: string;
  name: string;
  description: string;
  url: string;
  stars: number;
  forks: number;
  language: string;
  updatedAt: string;
  createdAt: string;
  license: string;
  topics: string[];
  hasManifest: boolean;
  manifest?: any;
}

interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  repository: string;
  manifestPath: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata: any;
}

interface GeneratedData {
  marketplaces: Marketplace[];
  plugins: Plugin[];
  stats: {
    totalMarketplaces: number;
    totalPlugins: number;
    validPlugins: number;
    lastUpdated: string;
    topLanguages: Array<{ language: string; count: number }>;
    topMarketplaces: Array<{ name: string; stars: number; url: string }>;
    recentActivity: Array<{ name: string; updatedAt: string; url: string }>;
  };
  categories: Array<{
    id: string;
    name: string;
    description: string;
    count: number;
    marketplaces: string[];
  }>;
  tags: Array<{
    id: string;
    name: string;
    count: number;
  }>;
}

/**
 * Normalize an author value from a manifest (string or {name|login,email}).
 */
function normalizeAuthor(author: unknown): string {
  if (typeof author === 'string') return author.trim();
  if (author && typeof author === 'object') {
    const a = author as { name?: string; login?: string };
    return (a.name || a.login || '').trim();
  }
  return '';
}

/** GitHub user/org that publishes the marketplace repo. */
function ownerFromUrl(url: string): string {
  const match = url?.match(/github\.com\/([^/]+)/);
  return match ? match[1] : '';
}

class DataGenerator {
  private inputDir: string;
  private outputDir: string;
  private websiteOutputDir: string;

  constructor() {
    this.inputDir = path.join(process.cwd(), 'data');
    this.outputDir = path.join(this.inputDir, 'generated');
    this.websiteOutputDir = path.join(process.cwd(), 'public', 'data');

    // Ensure output directories exist
    [this.outputDir, this.websiteOutputDir].forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async generateAllData(): Promise<void> {
    console.log('🔧 Starting data generation...');

    try {
      // Load raw data
      const marketplaces = this.loadMarketplaceData();
      const plugins = this.loadPluginData();

      console.log(`📁 Loaded ${marketplaces.length} marketplaces and ${plugins.length} plugins`);

      // Generate comprehensive data structure
      const data: GeneratedData = {
        marketplaces,
        plugins,
        stats: this.generateStats(marketplaces, plugins),
        categories: this.generateCategories(marketplaces, plugins),
        tags: this.generateTags(marketplaces),
      };

      // Save generated data
      await this.saveGeneratedData(data);

      // Generate website-specific data files
      await this.generateWebsiteData(data);

      // Generate sitemap
      await this.generateSitemap(data);

      // Generate RSS feed
      await this.generateRSSFeed(data);

      // Generate static API files
      await this.generateStaticApiFiles(data);

      console.log('✅ Data generation completed successfully!');
    } catch (error) {
      console.error('❌ Data generation failed:', error);
      throw error;
    }
  }

  private loadMarketplaceData(): Marketplace[] {
    const dataPath = path.join(this.inputDir, 'marketplaces', 'processed.json');

    if (!fs.existsSync(dataPath)) {
      console.warn('⚠️ Marketplace data not found, using empty array');
      return [];
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    // Handle both wrapped format { marketplaces: [...] } and direct array format [...]
    let marketplaces: any[];
    if (
      data &&
      typeof data === 'object' &&
      !Array.isArray(data) &&
      Array.isArray(data.marketplaces)
    ) {
      marketplaces = data.marketplaces;
    } else {
      marketplaces = Array.isArray(data) ? data : [];
    }

    // Normalize marketplace data to handle different formats (scanner vs UI format),
    // then re-attach Jev-inferred categories for marketplaces the topic aliases
    // could not classify (see scripts/jev-categorize.ts).
    const normalized = marketplaces.map((mp: any) => ({
      id: mp.id || '',
      name: mp.name || '',
      description: mp.description || '',
      url: mp.url || mp.repository?.url || '',
      stars: mp.stars ?? mp.repository?.stars ?? 0,
      forks: mp.forks ?? mp.repository?.forks ?? 0,
      language: mp.language || mp.repository?.language || 'Unknown',
      updatedAt:
        mp.updatedAt || mp.lastScanned || mp.repository?.updatedAt || new Date().toISOString(),
      createdAt: mp.createdAt || mp.repository?.createdAt || new Date().toISOString(),
      license: mp.license || mp.repository?.license || 'None',
      topics: mp.topics || mp.tags || [],
      hasManifest: mp.hasManifest ?? !!mp.manifest,
      manifest: mp.manifest,
    }));
    return applyJevEnrichment(normalized, loadJevEnrichment(this.inputDir));
  }

  private loadPluginData(): Plugin[] {
    // First, try loading validated plugin data
    const validatedPath = path.join(this.inputDir, 'plugins', 'valid-plugins.json');
    if (fs.existsSync(validatedPath)) {
      const plugins = JSON.parse(fs.readFileSync(validatedPath, 'utf-8'));
      if (plugins.length > 0) {
        return plugins;
      }
    }

    // Fallback: extract plugins directly from raw marketplace data
    console.log('ℹ️ No validated plugin data found, extracting from raw marketplace data...');
    return this.extractPluginsFromRawData();
  }

  private extractPluginsFromRawData(): Plugin[] {
    const rawPath = path.join(this.inputDir, 'marketplaces', 'raw.json');
    if (!fs.existsSync(rawPath)) {
      console.warn('⚠️ Raw marketplace data not found, no plugins available');
      return [];
    }

    const marketplaces = JSON.parse(fs.readFileSync(rawPath, 'utf-8'));
    const plugins: Plugin[] = [];

    for (const mp of marketplaces) {
      const manifestPlugins = mp.manifest?.plugins || [];
      const discoveredPlugins = mp.plugins || [];

      // Extract from manifest plugins array
      for (const entry of manifestPlugins) {
        const pluginName = entry.name || 'unknown';
        const id = `${mp.id}-${pluginName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

        plugins.push({
          id,
          name: pluginName,
          description: entry.description || '',
          version: entry.version || mp.manifest?.metadata?.version || '',
          author:
            normalizeAuthor(entry.author) ||
            ownerFromUrl(mp.url) ||
            normalizeAuthor(mp.manifest?.owner) ||
            mp.name,
          repository: mp.url,
          manifestPath: entry.source || entry.path || '',
          isValid: true,
          errors: [],
          warnings: [],
          metadata: {
            marketplaceId: mp.id,
            marketplaceName: mp.name,
            skills: entry.skills || [],
            strict: entry.strict ?? false,
          },
        });
      }

      // Also include scanner-discovered plugins (skill directories)
      for (const disc of discoveredPlugins) {
        const existingIds = new Set(plugins.map((p) => p.id));
        const id = `${mp.id}-${(disc.name || disc.path || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        if (existingIds.has(id)) continue; // skip duplicates

        plugins.push({
          id,
          name: disc.name || disc.path || 'unknown',
          description: disc.description || '',
          version: '1.0.0',
          author: ownerFromUrl(mp.url) || mp.name,
          repository: mp.url,
          manifestPath: disc.path || '',
          isValid: disc.hasSkillMd ?? true,
          errors: [],
          warnings: disc.hasSkillMd ? [] : ['No skill.md found'],
          metadata: {
            marketplaceId: mp.id,
            marketplaceName: mp.name,
            hasSkillMd: disc.hasSkillMd,
          },
        });
      }

      // Author canonicalization — same rule as validate-plugins.ts: one
      // declared author across the marketplace's entries is the publisher's
      // display name for all of them.
      const canonical = canonicalAuthor(
        manifestPlugins.map((entry: any) => normalizeAuthor(entry.author))
      );
      if (canonical) {
        for (const plugin of plugins) {
          if (plugin.repository === mp.url) {
            plugin.author = canonical;
          }
        }
      }
    }

    console.log(`📦 Extracted ${plugins.length} plugins from raw marketplace data`);

    // Also persist extracted plugins for next time
    const pluginsDir = path.join(this.inputDir, 'plugins');
    if (!fs.existsSync(pluginsDir)) {
      fs.mkdirSync(pluginsDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(pluginsDir, 'valid-plugins.json'),
      JSON.stringify(
        plugins.filter((p) => p.isValid),
        null,
        2
      )
    );

    return plugins;
  }

  private generateStats(marketplaces: Marketplace[], plugins: Plugin[]) {
    const stats = {
      totalMarketplaces: marketplaces.length,
      totalPlugins: plugins.length,
      validPlugins: plugins.filter((p) => p.isValid).length,
      lastUpdated: new Date().toISOString(),
      topLanguages: this.getTopLanguages(marketplaces),
      topMarketplaces: this.getTopMarketplaces(marketplaces),
      recentActivity: this.getRecentActivity(marketplaces),
    };

    console.log('📊 Generated statistics:');
    console.log(`  - Marketplaces: ${stats.totalMarketplaces}`);
    console.log(`  - Plugins: ${stats.totalPlugins}`);
    console.log(`  - Valid plugins: ${stats.validPlugins}`);

    return stats;
  }

  /**
   * Generate the comprehensive ecosystem stats JSON consumed by frontend components.
   * Every number here is derived from scan/manifest data or the accumulated
   * history snapshot — no synthetic formulas, no hardcoded scores.
   */
  private generateEcosystemStats(data: GeneratedData): any {
    const now = new Date();
    const totalStars = data.marketplaces.reduce((s, m) => s + m.stars, 0);
    const uniqueAuthors = new Set(data.plugins.map((p) => p.author)).size;

    // Load history, replace any same-day snapshot (repeat runs), append current
    const historyPath = path.join(this.websiteOutputDir, 'history.json');
    let history: Array<{
      date: string;
      marketplaces: number;
      plugins: number;
      stars: number;
      developers?: number;
    }> = [];
    try {
      history = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
    } catch {
      /* ignore missing/corrupt history */
    }
    const today = now.toISOString().split('T')[0];
    history = history.filter((h) => h.date.split('T')[0] !== today);
    history.push({
      date: now.toISOString(),
      marketplaces: data.stats.totalMarketplaces,
      plugins: data.stats.totalPlugins,
      stars: totalStars,
      developers: uniqueAuthors,
    });
    if (history.length > 365) history = history.slice(-365);
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));

    // Growth rates: compare against the oldest snapshot within the last 30 days.
    // Null when no meaningful baseline exists yet — the UI renders "—".
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const baseline = history.find(
      (h) => new Date(h.date) >= thirtyDaysAgo && h.date.split('T')[0] !== today
    );
    const growthRate = (current: number, previous?: number): number | null =>
      previous !== undefined && previous > 0
        ? Number((((current - previous) / previous) * 100).toFixed(1))
        : null;

    // ── Overview (for OverviewMetrics + homepage hero) ──
    const overview = {
      totalPlugins: data.stats.totalPlugins,
      totalMarketplaces: data.stats.totalMarketplaces,
      totalDevelopers: uniqueAuthors,
      totalStars,
      lastUpdated: now.toISOString(),
      growthRate: {
        plugins: growthRate(data.stats.totalPlugins, baseline?.plugins),
        marketplaces: growthRate(data.stats.totalMarketplaces, baseline?.marketplaces),
        developers: growthRate(uniqueAuthors, baseline?.developers),
        stars: growthRate(totalStars, baseline?.stars),
      },
    };

    // ── Trend series built ONLY from real history snapshots ──
    const toTrend = (
      key: 'plugins' | 'marketplaces' | 'developers' | 'stars'
    ): Array<{ date: string; value: number | null; change?: number }> =>
      history.map((h, i) => {
        const value = (h as Record<string, unknown>)[key];
        const prev = i > 0 ? (history[i - 1] as Record<string, unknown>)[key] : undefined;
        return {
          date: h.date.split('T')[0],
          value: typeof value === 'number' ? value : null,
          change: typeof value === 'number' && typeof prev === 'number' ? value - prev : undefined,
        };
      });

    // ── Categories: real topic counts (topics overlap — never render as pie %) ──
    const catCount: Record<string, number> = {};
    for (const p of data.plugins) {
      const mp = data.marketplaces.find((m) => m.id === p.metadata?.marketplaceId);
      for (const t of mp?.topics || []) {
        catCount[t] = (catCount[t] || 0) + 1;
      }
    }
    const categories = Object.entries(catCount)
      .map(([name, count]) => ({
        id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name,
        count,
        description: `Plugins from marketplaces tagged "${name}" (topics overlap)`,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // ── Quality signals (all computed from real fields) ──
    const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const withManifest = data.marketplaces.filter((m) => m.hasManifest).length;
    const recentlyUpdated = data.marketplaces.filter(
      (m) => new Date(m.updatedAt) >= daysAgo(30)
    ).length;
    const stale = data.marketplaces.filter((m) => new Date(m.updatedAt) < daysAgo(180)).length;

    const quality = {
      manifestCoverage: {
        withManifest,
        total: data.marketplaces.length,
        rate:
          data.marketplaces.length > 0
            ? Number(((withManifest / data.marketplaces.length) * 100).toFixed(1))
            : 0,
      },
      maintenance: {
        recentlyUpdated,
        recentlyUpdatedRate:
          data.marketplaces.length > 0
            ? Number(((recentlyUpdated / data.marketplaces.length) * 100).toFixed(1))
            : 0,
        staleOver180Days: stale,
      },
      avgStarsPerMarketplace:
        data.marketplaces.length > 0 ? Math.round(totalStars / data.marketplaces.length) : 0,
    };

    const topMarketplace = [...data.marketplaces].sort((a, b) => b.stars - a.stars)[0];
    const insights = [
      `${data.stats.totalPlugins} plugins discovered across ${data.stats.totalMarketplaces} marketplaces`,
      topMarketplace
        ? `Most starred: ${topMarketplace.name} (${topMarketplace.stars.toLocaleString()} stars)`
        : '',
      categories[0]
        ? `Most common topic: ${categories[0].name} (${categories[0].count} plugins)`
        : '',
      `${recentlyUpdated} marketplaces updated in the last 30 days`,
    ].filter(Boolean);

    return {
      success: true,
      data: {
        overview,
        // Trend series for GrowthTrends
        plugins: toTrend('plugins'),
        marketplaces: toTrend('marketplaces'),
        developers: toTrend('developers'),
        stars: toTrend('stars'),
        period: 'all' as const,
        aggregation: 'daily' as const,
        // CategoryAnalytics
        categories,
        insights,
        // QualityIndicators
        ...quality,
      },
      meta: {
        timestamp: now.toISOString(),
        requestId: 'static-build',
        responseTime: 0,
      },
    };
  }

  private getTopLanguages(marketplaces: Marketplace[]): Array<{ language: string; count: number }> {
    const languageCount: Record<string, number> = {};

    for (const mp of marketplaces) {
      const lang = mp.language || 'Unknown';
      languageCount[lang] = (languageCount[lang] || 0) + 1;
    }

    return Object.entries(languageCount)
      .map(([language, count]) => ({ language, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private getTopMarketplaces(
    marketplaces: Marketplace[]
  ): Array<{ name: string; stars: number; url: string }> {
    return marketplaces
      .sort((a, b) => b.stars - a.stars)
      .slice(0, 10)
      .map((mp) => ({
        name: mp.name,
        stars: mp.stars,
        url: mp.url,
      }));
  }

  private getRecentActivity(
    marketplaces: Marketplace[]
  ): Array<{ name: string; updatedAt: string; url: string }> {
    return marketplaces
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 10)
      .map((mp) => ({
        name: mp.name,
        updatedAt: mp.updatedAt,
        url: mp.url,
      }));
  }

  private generateCategories(
    marketplaces: Marketplace[],
    _plugins: Plugin[]
  ): Array<{
    id: string;
    name: string;
    description: string;
    count: number;
    marketplaces: string[];
  }> {
    const categories = [
      {
        id: 'development',
        name: 'Development Tools',
        description: 'Tools for software development and coding',
        count: 0,
        marketplaces: [] as string[],
      },
      {
        id: 'productivity',
        name: 'Productivity',
        description: 'Tools to boost productivity and workflow',
        count: 0,
        marketplaces: [] as string[],
      },
      {
        id: 'ai-ml',
        name: 'AI & Machine Learning',
        description: 'Artificial intelligence and machine learning tools',
        count: 0,
        marketplaces: [] as string[],
      },
      {
        id: 'design',
        name: 'Design & Creative',
        description: 'Design tools and creative applications',
        count: 0,
        marketplaces: [] as string[],
      },
      {
        id: 'data',
        name: 'Data & Analytics',
        description: 'Data analysis and visualization tools',
        count: 0,
        marketplaces: [] as string[],
      },
      {
        id: 'utilities',
        name: 'Utilities',
        description: 'General utilities and helper tools',
        count: 0,
        marketplaces: [] as string[],
      },
    ];

    // Categorize marketplaces based on topics and description
    for (const mp of marketplaces) {
      const keywords = [
        ...mp.topics.map((t) => t.toLowerCase()),
        ...(mp.description || '').toLowerCase().split(' '),
        mp.name.toLowerCase(),
      ];

      for (const category of categories) {
        const categoryKeywords = this.getCategoryKeywords(category.id);
        if (keywords.some((keyword) => categoryKeywords.includes(keyword))) {
          category.marketplaces.push(mp.name);
          category.count++;
        }
      }
    }

    return categories.filter((cat) => cat.count > 0);
  }

  private getCategoryKeywords(categoryId: string): string[] {
    const keywordMap: Record<string, string[]> = {
      development: ['development', 'coding', 'programming', 'developer', 'code', 'git', 'github'],
      productivity: ['productivity', 'workflow', 'automation', 'efficiency', 'task', 'management'],
      'ai-ml': ['ai', 'machine learning', 'ml', 'artificial intelligence', 'neural', 'model'],
      design: ['design', 'creative', 'ui', 'ux', 'graphics', 'visual', 'art'],
      data: ['data', 'analytics', 'visualization', 'database', 'charts', 'statistics'],
      utilities: ['utility', 'helper', 'tool', 'utility', 'general', 'misc'],
    };

    return keywordMap[categoryId] || [];
  }

  private generateTags(
    marketplaces: Marketplace[]
  ): Array<{ id: string; name: string; count: number }> {
    const tagCount: Record<string, number> = {};

    for (const mp of marketplaces) {
      for (const topic of mp.topics) {
        tagCount[topic] = (tagCount[topic] || 0) + 1;
      }
    }

    return Object.entries(tagCount)
      .map(([name, count]) => ({
        id: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50); // Top 50 tags
  }

  private async saveGeneratedData(data: GeneratedData): Promise<void> {
    console.log('💾 Saving generated data...');

    // Save marketplaces only
    const marketplacesPath = path.join(this.outputDir, 'marketplaces.json');
    fs.writeFileSync(marketplacesPath, JSON.stringify(data.marketplaces, null, 2));

    // Save plugins only
    const pluginsPath = path.join(this.outputDir, 'plugins.json');
    fs.writeFileSync(pluginsPath, JSON.stringify(data.plugins, null, 2));

    // Save flat stats for internal use
    const statsSimplePath = path.join(this.outputDir, 'stats-simple.json');
    fs.writeFileSync(statsSimplePath, JSON.stringify(data.stats, null, 2));

    // Save comprehensive ecosystem stats in EcosystemStatsResponse format
    const ecosystemStats = this.generateEcosystemStats(data);
    const statsPath = path.join(this.outputDir, 'stats.json');
    fs.writeFileSync(statsPath, JSON.stringify(ecosystemStats, null, 2));

    // NOTE: complete.json and data.min.json are intentionally no longer
    // generated. No page fetches them (the site reads marketplaces.json,
    // plugins.json and stats.json directly), and complete.json embedded full
    // manifests — ~2MB at 250 marketplaces, on track to breach the validator's
    // 10MB per-file gate around ~1,250 entries.

    // Retire legacy payloads: without this they linger in the runner's
    // working tree from checkout and ride the artifact round-trip forever.
    for (const dir of [this.outputDir, this.websiteOutputDir]) {
      for (const legacy of ['complete.json', 'data.min.json']) {
        const legacyPath = path.join(dir, legacy);
        if (fs.existsSync(legacyPath)) fs.unlinkSync(legacyPath);
      }
    }

    console.log(`✅ Data saved to ${this.outputDir}`);
  }

  private async generateWebsiteData(data: GeneratedData): Promise<void> {
    console.log('🌐 Generating website data...');

    // Copy data to public directory
    const files = ['marketplaces.json', 'plugins.json', 'stats.json'];

    for (const file of files) {
      const src = path.join(this.outputDir, file);
      const dest = path.join(this.websiteOutputDir, file);

      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`📄 Copied ${file} to website data directory`);
      }
    }

    // Generate index.json with basic info
    const indexPath = path.join(this.websiteOutputDir, 'index.json');
    const indexData = {
      stats: data.stats,
      categories: data.categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        count: cat.count,
      })),
      lastUpdated: data.stats.lastUpdated,
    };

    fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2));
    console.log('📄 Generated index.json');
  }

  private async generateStaticApiFiles(data: GeneratedData): Promise<void> {
    console.log('🔧 Generating static API files...');

    // Ensure public/data directory exists
    const publicDataDir = path.join(process.cwd(), 'public', 'data');
    if (!fs.existsSync(publicDataDir)) {
      fs.mkdirSync(publicDataDir, { recursive: true });
    }

    // Generate health.json
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'production',
    };
    const healthPath = path.join(publicDataDir, 'health.json');
    fs.writeFileSync(healthPath, JSON.stringify(healthData, null, 2));

    // Generate status.json with real counts
    const statusData = {
      api: 'operational',
      database: 'operational',
      scanning: 'operational',
      lastScan: new Date().toISOString(),
      totalMarketplaces: data.stats.totalMarketplaces,
      totalPlugins: data.stats.totalPlugins,
      version: '1.0.0',
    };
    const statusPath = path.join(publicDataDir, 'status.json');
    fs.writeFileSync(statusPath, JSON.stringify(statusData, null, 2));

    // Generate metrics.json
    const metricsData = {
      performance: {
        buildTime: new Date().toISOString(),
        bundleSize: '2.1MB',
        lighthouseScore: 95,
      },
      usage: {
        totalScans: 0,
        totalApiCalls: 0,
        errorRate: 0,
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: process.memoryUsage(),
      },
    };
    const metricsPath = path.join(publicDataDir, 'metrics.json');
    fs.writeFileSync(metricsPath, JSON.stringify(metricsData, null, 2));

    // Update analytics.json with real data if available
    const analyticsPath = path.join(publicDataDir, 'analytics.json');
    let analyticsData;

    try {
      // Try to load existing marketplace data
      const marketplacesDataPath = path.join(publicDataDir, 'marketplaces.json');
      if (fs.existsSync(marketplacesDataPath)) {
        const marketplacesData = JSON.parse(fs.readFileSync(marketplacesDataPath, 'utf-8'));
        analyticsData = {
          marketplaces: marketplacesData.marketplaces || [],
          plugins: this.extractAllPlugins(marketplacesData.marketplaces || []),
          categories: this.extractCategories(marketplacesData.marketplaces || []),
          lastUpdated: new Date().toISOString(),
          summary: {
            totalMarketplaces: (marketplacesData.marketplaces || []).length,
            totalPlugins: this.countAllPlugins(marketplacesData.marketplaces || []),
            averageRating: this.calculateAverageRating(marketplacesData.marketplaces || []),
            topCategories: this.getTopCategories(marketplacesData.marketplaces || []),
          },
        };
      } else {
        // Fallback analytics data
        analyticsData = {
          marketplaces: [],
          plugins: [],
          categories: [],
          lastUpdated: new Date().toISOString(),
          summary: {
            totalMarketplaces: 0,
            totalPlugins: 0,
            averageRating: 0,
            topCategories: [],
          },
        };
      }
    } catch (error) {
      console.warn('⚠️ Error generating analytics data:', error);
      analyticsData = {
        marketplaces: [],
        plugins: [],
        categories: [],
        lastUpdated: new Date().toISOString(),
        summary: {
          totalMarketplaces: 0,
          totalPlugins: 0,
          averageRating: 0,
          topCategories: [],
        },
      };
    }

    fs.writeFileSync(analyticsPath, JSON.stringify(analyticsData, null, 2));

    console.log('🔧 Generated static API files:');
    console.log('  - health.json');
    console.log('  - status.json');
    console.log('  - metrics.json');
    console.log('  - analytics.json');
  }

  private extractAllPlugins(marketplaces: any[]): any[] {
    const plugins: any[] = [];
    for (const marketplace of marketplaces) {
      if (marketplace.manifest && marketplace.manifest.plugins) {
        plugins.push(...marketplace.manifest.plugins);
      }
    }
    return plugins;
  }

  private extractCategories(marketplaces: any[]): string[] {
    const categories = new Set<string>();
    for (const marketplace of marketplaces) {
      if (marketplace.topics) {
        marketplace.topics.forEach((topic: string) => categories.add(topic));
      }
    }
    return Array.from(categories);
  }

  private countAllPlugins(marketplaces: any[]): number {
    return this.extractAllPlugins(marketplaces).length;
  }

  private calculateAverageRating(marketplaces: any[]): number {
    if (marketplaces.length === 0) return 0;
    const totalStars = marketplaces.reduce((sum, mp) => sum + (mp.stars || 0), 0);
    return Math.round((totalStars / marketplaces.length) * 10) / 10;
  }

  private getTopCategories(marketplaces: any[]): Array<{ name: string; count: number }> {
    const categoryCount: Record<string, number> = {};
    for (const marketplace of marketplaces) {
      if (marketplace.topics) {
        marketplace.topics.forEach((topic: string) => {
          categoryCount[topic] = (categoryCount[topic] || 0) + 1;
        });
      }
    }
    return Object.entries(categoryCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private async generateSitemap(data: GeneratedData): Promise<void> {
    console.log('🗺️ Generating sitemap...');

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://localhost:3000';
    const currentDate = format(new Date(), 'yyyy-MM-dd');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/marketplaces</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/plugins</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/stats</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/docs</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${baseUrl}/docs/api</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  ${data.marketplaces
    .map(
      (mp) => `
  <url>
    <loc>${baseUrl}/marketplaces/${mp.id}</loc>
    <lastmod>${format(parseISO(mp.updatedAt), 'yyyy-MM-dd')}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
    )
    .join('')}
</urlset>`;

    const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
    fs.writeFileSync(sitemapPath, sitemap);
    console.log('🗺️ Generated sitemap.xml');
  }

  private async generateRSSFeed(data: GeneratedData): Promise<void> {
    console.log('📡 Generating RSS feed...');

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://localhost:3000';
    const currentDate = new Date().toUTCString();

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Claude Marketplace Aggregator</title>
    <description>Latest Claude Code marketplaces and plugins</description>
    <link>${baseUrl}</link>
    <language>en-us</language>
    <lastBuildDate>${currentDate}</lastBuildDate>
    <generator>Claude Marketplace Aggregator</generator>
    ${data.marketplaces
      .slice(0, 20)
      .map(
        (mp) => `
    <item>
      <title>${mp.name}</title>
      <description>${mp.description}</description>
      <link>${mp.url}</link>
      <guid>${mp.id}</guid>
      <pubDate>${new Date(mp.updatedAt).toUTCString()}</pubDate>
    </item>`
      )
      .join('')}
  </channel>
</rss>`;

    const rssPath = path.join(process.cwd(), 'public', 'rss.xml');
    fs.writeFileSync(rssPath, rss);
    console.log('📡 Generated rss.xml');
  }
}

// CLI execution
async function main() {
  const dryRun = process.argv.includes('--dry-run');

  console.log('🔧 Claude Data Generator');
  console.log(`Mode: ${dryRun ? 'Dry Run' : 'Production'}`);
  console.log('');

  try {
    const generator = new DataGenerator();

    if (dryRun) {
      console.log('🔧 Dry run: Would generate data files...');
      console.log('📊 Expected output:');
      console.log('  - Complete data structure');
      console.log('  - Marketplaces data');
      console.log('  - Plugins data');
      console.log('  - Statistics');
      console.log('  - Categories and tags');
      console.log('  - Sitemap and RSS feed');
      console.log('✅ Dry run completed successfully');
      return;
    }

    await generator.generateAllData();

    console.log('');
    console.log('🎉 Data generation completed successfully!');
    console.log('📁 Files are ready for website deployment');
  } catch (error) {
    console.error('❌ Data generation failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
