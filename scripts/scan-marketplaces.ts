#!/usr/bin/env ts-node

/**
 * Marketplace Scanner
 *
 * This script searches GitHub for repositories containing Claude marketplace configurations
 * and extracts marketplace metadata using multiple search strategies.
 */

// Load environment variables from .env.local for local development
import { config } from 'dotenv';
const envPath = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local';
config({ path: envPath });

import { Octokit } from '@octokit/rest';
import fs from 'fs';
import path from 'path';

// Known Claude Code marketplaces and skill repositories to seed the scanner
const KNOWN_MARKETPLACES = [
  'anthropics/skills',
  'ComposioHQ/awesome-claude-skills',
  'anthropics/claude-code-plugins',
  'anthropics/claude-plugins-official',
];

// Search strategies for discovering Claude Code plugins and skills
const SEARCH_STRATEGIES = [
  // Marketplace registries with manifest files
  { name: 'marketplace-manifest', query: 'path:.claude-plugin marketplace.json', type: 'code' as const },
  { name: 'plugin-manifest', query: 'path:.claude-plugin plugin.json', type: 'code' as const },
  // Skill definitions
  { name: 'skill-files', query: 'filename:SKILL.md claude', type: 'code' as const },
  // Repository topics
  { name: 'topic-claude-plugins', query: 'topic:claude-plugins', type: 'repo' as const },
  { name: 'topic-claude-skills', query: 'topic:claude-skills', type: 'repo' as const },
  { name: 'topic-claude-code', query: 'topic:claude-code-plugin', type: 'repo' as const },
  // Repository names
  { name: 'name-awesome-skills', query: 'awesome-claude-skills in:name', type: 'repo' as const },
  { name: 'name-claude-marketplace', query: 'claude-code-marketplace in:name', type: 'repo' as const },
  { name: 'name-claude-plugins', query: 'claude-plugins in:name', type: 'repo' as const },
  // Description-based search
  { name: 'desc-claude-plugin', query: '"claude code" plugin in:description', type: 'repo' as const },
  { name: 'desc-claude-skill', query: '"claude code" skill in:description', type: 'repo' as const },
];

interface SearchStrategy {
  name: string;
  query: string;
  type: 'code' | 'repo';
}

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
  discoverySource?: string;
}

class MarketplaceScanner {
  private octokit: Octokit;
  private outputDir: string;
  private searchQuery: string;
  private maxResults: number;
  private useMultiStrategy: boolean;

  constructor() {
    // Initialize GitHub client
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
      userAgent: 'claude-marketplace-aggregator/1.0.0',
    });

    this.outputDir = path.join(process.cwd(), 'data', 'marketplaces');
    this.searchQuery = process.env.SEARCH_QUERY?.trim() || '';
    this.maxResults = parseInt(process.env.SEARCH_RESULTS_LIMIT || '100');
    // Use multi-strategy by default unless a specific query is provided
    this.useMultiStrategy = !this.searchQuery;

    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async scanMarketplaces(): Promise<Marketplace[]> {
    console.log('🔍 Starting marketplace scan...');
    console.log(`Max results: ${this.maxResults}`);
    console.log(`Strategy: ${this.useMultiStrategy ? 'Multi-strategy search' : `Single query: ${this.searchQuery}`}`);

    const repoMap = new Map<string, Marketplace>();

    try {
      // First, fetch known marketplaces
      await this.fetchKnownMarketplaces(repoMap);

      if (this.useMultiStrategy) {
        // Run multiple search strategies
        await this.runMultiStrategySearch(repoMap);
      } else {
        // Use single query (backward compatibility)
        await this.runSingleQuerySearch(repoMap, this.searchQuery, 'custom-query');
      }

      const marketplaces = Array.from(repoMap.values());
      console.log(`\n🎉 Scan complete! Found ${marketplaces.length} unique marketplaces`);
      return marketplaces;
    } catch (error) {
      console.error('❌ Scan failed:', error);
      throw error;
    }
  }

  private async fetchKnownMarketplaces(repoMap: Map<string, Marketplace>): Promise<void> {
    console.log('\n📌 Fetching known marketplaces...');

    for (const repoPath of KNOWN_MARKETPLACES) {
      const [owner, repo] = repoPath.split('/');
      try {
        const response = await this.octokit.repos.get({ owner, repo });
        const marketplace = await this.processRepository(response.data, 'known-seed');
        if (marketplace) {
          repoMap.set(marketplace.id, marketplace);
          console.log(`  ✅ Seeded: ${repoPath}`);
        }
      } catch (error: any) {
        if (error.status === 404) {
          console.log(`  ⚠️ Known repo not found: ${repoPath}`);
        } else {
          console.error(`  ❌ Error fetching ${repoPath}:`, error.message);
        }
      }
      await this.delay(500);
    }

    console.log(`📌 Seeded ${repoMap.size} known marketplaces`);
  }

  private async runMultiStrategySearch(repoMap: Map<string, Marketplace>): Promise<void> {
    console.log(`\n🔎 Running ${SEARCH_STRATEGIES.length} search strategies...`);

    for (const strategy of SEARCH_STRATEGIES) {
      if (repoMap.size >= this.maxResults) {
        console.log(`  ⏹️ Max results (${this.maxResults}) reached, stopping search`);
        break;
      }

      console.log(`\n📍 Strategy: ${strategy.name}`);
      console.log(`   Query: ${strategy.query}`);

      try {
        if (strategy.type === 'code') {
          await this.runCodeSearch(repoMap, strategy);
        } else {
          await this.runSingleQuerySearch(repoMap, strategy.query, strategy.name);
        }
      } catch (error: any) {
        console.error(`   ❌ Strategy failed: ${error.message}`);
      }

      await this.delay(2000); // Rate limiting between strategies
    }
  }

  private async runCodeSearch(repoMap: Map<string, Marketplace>, strategy: SearchStrategy): Promise<void> {
    const startSize = repoMap.size;

    try {
      const searchResponse = await this.octokit.search.code({
        q: strategy.query,
        per_page: 100,
      });

      console.log(`   Found ${searchResponse.data.total_count} code matches`);

      const processedRepos = new Set<string>();
      for (const item of searchResponse.data.items) {
        const repoFullName = item.repository.full_name;
        if (processedRepos.has(repoFullName)) continue;
        processedRepos.add(repoFullName);

        if (repoMap.size >= this.maxResults) break;

        try {
          const repoResponse = await this.octokit.repos.get({
            owner: item.repository.owner.login,
            repo: item.repository.name,
          });
          const marketplace = await this.processRepository(repoResponse.data, strategy.name);
          if (marketplace && !repoMap.has(marketplace.id)) {
            repoMap.set(marketplace.id, marketplace);
          }
        } catch {
          // Skip repos we can't access
        }
        await this.delay(300);
      }

      const newFound = repoMap.size - startSize;
      console.log(`   ➕ Added ${newFound} new repositories`);
    } catch (error: any) {
      if (error.status === 422) {
        console.log(`   ⚠️ Query returned no results or is invalid`);
      } else {
        throw error;
      }
    }
  }

  private async runSingleQuerySearch(
    repoMap: Map<string, Marketplace>,
    query: string,
    source: string
  ): Promise<void> {
    const startSize = repoMap.size;
    let page = 1;
    const perPage = 100;

    while (repoMap.size < this.maxResults) {
      try {
        const searchResponse = await this.octokit.search.repos({
          q: query,
          sort: 'updated',
          order: 'desc',
          per_page: Math.min(perPage, this.maxResults - repoMap.size),
          page,
        });

        if (searchResponse.data.items.length === 0) {
          break;
        }

        if (page === 1) {
          console.log(`   Found ${searchResponse.data.total_count} total matches`);
        }

        for (const repo of searchResponse.data.items) {
          if (repoMap.size >= this.maxResults) break;

          try {
            const marketplace = await this.processRepository(repo, source);
            if (marketplace && !repoMap.has(marketplace.id)) {
              repoMap.set(marketplace.id, marketplace);
            }
          } catch {
            // Skip repos we can't process
          }
        }

        page++;
        await this.delay(1000);

        // Limit pages per strategy
        if (page > 3) break;
      } catch (error: any) {
        if (error.status === 422) {
          console.log(`   ⚠️ Query returned no results`);
        }
        break;
      }
    }

    const newFound = repoMap.size - startSize;
    console.log(`   ➕ Added ${newFound} new repositories`);
  }

  private async processRepository(repo: any, discoverySource?: string): Promise<Marketplace | null> {
    try {
      // Use repo data directly if it has full details, otherwise fetch
      let repoData = repo;
      if (repo.stargazers_count === undefined && repo.owner) {
        const response = await this.octokit.repos.get({
          owner: repo.owner.login,
          repo: repo.name,
        });
        repoData = response.data;
      }

      const marketplace: Marketplace = {
        id: repoData.id.toString(),
        name: repoData.name,
        description: repoData.description || '',
        url: repoData.html_url,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        language: repoData.language || 'Unknown',
        updatedAt: repoData.updated_at,
        createdAt: repoData.created_at,
        license: repoData.license?.name || 'None',
        topics: repoData.topics || [],
        discoverySource,
      };

      // Try to fetch marketplace manifest
      const owner = repoData.owner?.login || repo.owner?.login;
      const repoName = repoData.name || repo.name;
      try {
        const manifest = await this.fetchManifest(owner, repoName);
        if (manifest) {
          marketplace.manifest = manifest;
        }
      } catch {
        // No manifest found, that's OK
      }

      // Check for skills in the repository
      try {
        const skills = await this.detectSkills(owner, repoName);
        if (skills.length > 0) {
          marketplace.plugins = skills;
        }
      } catch {
        // No skills found, that's OK
      }

      return marketplace;
    } catch {
      // Silently skip repos we can't process
      return null;
    }
  }

  private async fetchManifest(owner: string, repo: string): Promise<any | null> {
    const manifestPaths = [
      '.claude-plugin/marketplace.json',
      '.claude-plugin/plugin.json',
      '.claude/plugin.json',
      'marketplace.json',
      'claude-marketplace.json',
      'plugins/marketplace.json',
      'plugin.json',
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

  private async detectSkills(owner: string, repo: string): Promise<any[]> {
    const skills: any[] = [];

    // Check for skills directory
    const skillPaths = ['skills', '.claude/skills', 'src/skills'];

    for (const skillPath of skillPaths) {
      try {
        const response = await this.octokit.repos.getContent({
          owner,
          repo,
          path: skillPath,
        });

        if (Array.isArray(response.data)) {
          for (const item of response.data) {
            if (item.type === 'dir') {
              // Check for SKILL.md in subdirectory
              try {
                const skillMdResponse = await this.octokit.repos.getContent({
                  owner,
                  repo,
                  path: `${skillPath}/${item.name}/SKILL.md`,
                });

                if ('content' in skillMdResponse.data) {
                  const content = Buffer.from(skillMdResponse.data.content, 'base64').toString('utf-8');
                  skills.push({
                    name: item.name,
                    path: `${skillPath}/${item.name}`,
                    hasSkillMd: true,
                    description: this.extractSkillDescription(content),
                  });
                }
              } catch {
                // No SKILL.md in this subdirectory
              }
            }
          }
        }
      } catch {
        // Skills path doesn't exist
      }
    }

    // Also check root for SKILL.md
    try {
      const response = await this.octokit.repos.getContent({
        owner,
        repo,
        path: 'SKILL.md',
      });

      if ('content' in response.data) {
        const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
        skills.push({
          name: repo,
          path: '.',
          hasSkillMd: true,
          description: this.extractSkillDescription(content),
        });
      }
    } catch {
      // No root SKILL.md
    }

    return skills;
  }

  private extractSkillDescription(skillMdContent: string): string {
    // Extract first paragraph or description from SKILL.md
    const lines = skillMdContent.split('\n');
    let description = '';

    for (const line of lines) {
      const trimmed = line.trim();
      // Skip headers and empty lines
      if (trimmed.startsWith('#') || trimmed === '') continue;
      // Skip frontmatter
      if (trimmed === '---') continue;
      // Get first non-empty, non-header line
      description = trimmed.slice(0, 200);
      break;
    }

    return description;
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
