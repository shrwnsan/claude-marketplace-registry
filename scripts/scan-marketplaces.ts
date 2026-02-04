#!/usr/bin/env ts-node

/**
 * Marketplace Scanner
 *
 * This script searches GitHub for repositories containing Claude marketplace configurations
 * and extracts marketplace metadata.
 */

// Load environment variables from .env.local for local development
import { config } from 'dotenv';
const envPath = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local';
config({ path: envPath });

import { Octokit } from '@octokit/rest';
import fs from 'fs';
import path from 'path';

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
  manifest?: any;
  plugins?: any[];
}

class MarketplaceScanner {
  private octokit: Octokit;
  private outputDir: string;
  private searchQuery: string;
  private maxResults: number;

  constructor() {
    // Initialize GitHub client
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
      userAgent: 'claude-marketplace-aggregator/1.0.0',
    });

    this.outputDir = path.join(process.cwd(), 'data', 'marketplaces');
    this.searchQuery = process.env.SEARCH_QUERY || 'claude-plugin marketplace.json';
    this.maxResults = parseInt(process.env.SEARCH_RESULTS_LIMIT || '100');

    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async scanMarketplaces(): Promise<Marketplace[]> {
    console.log('🔍 Starting marketplace scan...');
    console.log(`Search query: ${this.searchQuery}`);
    console.log(`Max results: ${this.maxResults}`);

    const marketplaces: Marketplace[] = [];
    let page = 1;
    const perPage = 100;

    try {
      while (marketplaces.length < this.maxResults) {
        console.log(`📄 Searching page ${page}...`);

        const searchResponse = await this.octokit.search.repos({
          q: this.searchQuery,
          sort: 'updated',
          order: 'desc',
          per_page: Math.min(perPage, this.maxResults - marketplaces.length),
          page,
        });

        if (searchResponse.data.items.length === 0) {
          console.log('✅ No more results found');
          break;
        }

        console.log(`Found ${searchResponse.data.items.length} repositories`);

        for (const repo of searchResponse.data.items) {
          try {
            const marketplace = await this.processRepository(repo);
            if (marketplace) {
              marketplaces.push(marketplace);
              console.log(`✅ Processed: ${repo.full_name}`);
            }
          } catch (error) {
            console.error(`❌ Error processing ${repo.full_name}:`, error);
          }

          if (marketplaces.length >= this.maxResults) {
            break;
          }
        }

        page++;

        // Rate limiting protection
        await this.delay(1000);
      }

      console.log(`🎉 Scan complete! Found ${marketplaces.length} marketplaces`);
      return marketplaces;
    } catch (error) {
      console.error('❌ Scan failed:', error);
      throw error;
    }
  }

  private async processRepository(repo: any): Promise<Marketplace | null> {
    try {
      // Get detailed repository information
      const repoData = await this.octokit.repos.get({
        owner: repo.owner.login,
        repo: repo.name,
      });

      const marketplace: Marketplace = {
        id: repoData.data.id.toString(),
        name: repoData.data.name,
        description: repoData.data.description || '',
        url: repoData.data.html_url,
        stars: repoData.data.stargazers_count,
        forks: repoData.data.forks_count,
        language: repoData.data.language || 'Unknown',
        updatedAt: repoData.data.updated_at,
        createdAt: repoData.data.created_at,
        license: repoData.data.license?.name || 'None',
        topics: repoData.data.topics || [],
      };

      // Try to fetch marketplace manifest
      try {
        const manifest = await this.fetchManifest(repo.owner.login, repo.name);
        if (manifest) {
          marketplace.manifest = manifest;
        }
      } catch {
        console.log(`ℹ️ No manifest found for ${repo.full_name}`);
      }

      return marketplace;
    } catch {
      console.error(`Error processing repository ${repo.full_name}:`, error);
      return null;
    }
  }

  private async fetchManifest(owner: string, repo: string): Promise<any | null> {
    const manifestPaths = [
      '.claude-plugin/marketplace.json',
      'marketplace.json',
      'claude-marketplace.json',
      'plugins/marketplace.json',
    ];

    for (const manifestPath of manifestPaths) {
      try {
        const response = await this.octokit.repos.getContent({
          owner,
          repo,
          path: manifestPath,
        });

        if ('content' in response.data) {
          const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
          return JSON.parse(content);
        }
      } catch {
        // Continue to next path
      }
    }

    return null;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async saveResults(marketplaces: Marketplace[]): Promise<void> {
    console.log('💾 Saving scan results...');

    // Save raw data
    const rawDataPath = path.join(this.outputDir, 'raw.json');
    fs.writeFileSync(rawDataPath, JSON.stringify(marketplaces, null, 2));

    // Save processed data (only essential fields)
    const processedData = marketplaces.map((mp) => ({
      id: mp.id,
      name: mp.name,
      description: mp.description,
      url: mp.url,
      stars: mp.stars,
      forks: mp.forks,
      language: mp.language,
      updatedAt: mp.updatedAt,
      topics: mp.topics,
      hasManifest: !!mp.manifest,
    }));

    const processedDataPath = path.join(this.outputDir, 'processed.json');
    fs.writeFileSync(processedDataPath, JSON.stringify(processedData, null, 2));

    // Save summary
    const summary = {
      totalFound: marketplaces.length,
      withManifest: marketplaces.filter((mp) => !!mp.manifest).length,
      lastUpdated: new Date().toISOString(),
      searchQuery: this.searchQuery,
      languages: this.getLanguageStats(marketplaces),
      topRepos: marketplaces
        .sort((a, b) => b.stars - a.stars)
        .slice(0, 10)
        .map((mp) => ({
          name: mp.name,
          stars: mp.stars,
          url: mp.url,
        })),
    };

    const summaryPath = path.join(this.outputDir, 'summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

    console.log(`✅ Results saved to ${this.outputDir}`);
    console.log(`- Raw data: ${rawDataPath}`);
    console.log(`- Processed data: ${processedDataPath}`);
    console.log(`- Summary: ${summaryPath}`);
  }

  async generateMarketplaceDataFile(marketplaces: Marketplace[]): Promise<void> {
    console.log('📄 Generating UI marketplace data file...');

    const publicDataDir = path.join(process.cwd(), 'public', 'data');

    // Ensure directory exists
    if (!fs.existsSync(publicDataDir)) {
      fs.mkdirSync(publicDataDir, { recursive: true });
    }

    const marketplacesData = {
      marketplaces: marketplaces,
      lastUpdated: new Date().toISOString(),
      totalCount: marketplaces.length,
      source: 'github-scan',
      summary: {
        totalMarketplaces: marketplaces.length,
        withManifests: marketplaces.filter((mp) => !!mp.manifest).length,
        totalStars: marketplaces.reduce((sum, mp) => sum + mp.stars, 0),
        averageStars:
          marketplaces.length > 0
            ? Math.round(marketplaces.reduce((sum, mp) => sum + mp.stars, 0) / marketplaces.length)
            : 0,
        topLanguages: this.getLanguageStats(marketplaces),
      },
    };

    const marketplacesPath = path.join(publicDataDir, 'marketplaces.json');
    fs.writeFileSync(marketplacesPath, JSON.stringify(marketplacesData, null, 2));

    console.log(`✅ Generated UI marketplace data: ${marketplacesPath}`);
    console.log(`📊 Found ${marketplaces.length} marketplaces`);
  }

  private getLanguageStats(marketplaces: Marketplace[]): Record<string, number> {
    const stats: Record<string, number> = {};

    for (const mp of marketplaces) {
      const lang = mp.language || 'Unknown';
      stats[lang] = (stats[lang] || 0) + 1;
    }

    return stats;
  }
}

// CLI execution
async function main() {
  const dryRun = process.argv.includes('--dry-run');

  console.log('🚀 Claude Marketplace Scanner');
  console.log(`Mode: ${dryRun ? 'Dry Run' : 'Production'}`);
  console.log('');

  if (!process.env.GITHUB_TOKEN && !dryRun) {
    console.error('❌ GITHUB_TOKEN environment variable is required');
    process.exit(1);
  }

  try {
    const scanner = new MarketplaceScanner();

    if (dryRun) {
      console.log('🔍 Dry run: Would scan for marketplaces...');
      console.log('📊 Expected output: marketplaces data files');
      console.log('✅ Dry run completed successfully');
      return;
    }

    const marketplaces = await scanner.scanMarketplaces();
    await scanner.saveResults(marketplaces);

    // Generate UI-compatible marketplace data
    await scanner.generateMarketplaceDataFile(marketplaces);

    console.log('');
    console.log('🎉 Scan completed successfully!');
    console.log(`📊 Found ${marketplaces.length} marketplaces`);
  } catch (error) {
    console.error('❌ Scan failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
