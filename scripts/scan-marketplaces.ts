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
import { createPluginDiscovery, MarketplaceInfo, DiscoveredPlugin } from './plugin-discovery';

// Known Claude Code marketplaces and skill repositories to seed the scanner
const KNOWN_MARKETPLACES = [
  'anthropics/skills',
  'ComposioHQ/awesome-claude-skills',
  'anthropics/claude-code-plugins',
  'anthropics/claude-plugins-official',
];

// Search strategies for discovering Claude Code plugins and skills.
// Exported so tests can assert on the assembled list (buildSearchStrategies).
export const SEARCH_STRATEGIES = [
  // Marketplace registries with manifest files
  {
    name: 'marketplace-manifest',
    query: 'path:.claude-plugin marketplace.json',
    type: 'code' as const,
  },
  { name: 'plugin-manifest', query: 'path:.claude-plugin plugin.json', type: 'code' as const },
  // Skill definitions
  { name: 'skill-files', query: 'filename:SKILL.md claude', type: 'code' as const },
  // Repository topics
  { name: 'topic-claude-plugins', query: 'topic:claude-plugins', type: 'repo' as const },
  { name: 'topic-claude-skills', query: 'topic:claude-skills', type: 'repo' as const },
  { name: 'topic-claude-code', query: 'topic:claude-code-plugin', type: 'repo' as const },
  // Repository names
  { name: 'name-awesome-skills', query: 'awesome-claude-skills in:name', type: 'repo' as const },
  {
    name: 'name-claude-marketplace',
    query: 'claude-code-marketplace in:name',
    type: 'repo' as const,
  },
  { name: 'name-claude-plugins', query: 'claude-plugins in:name', type: 'repo' as const },
  // Description-based search
  {
    name: 'desc-claude-plugin',
    query: '"claude code" plugin in:description',
    type: 'repo' as const,
  },
  { name: 'desc-claude-skill', query: '"claude code" skill in:description', type: 'repo' as const },
];

interface SearchStrategy {
  name: string;
  query: string;
  type: 'code' | 'repo';
}

/**
 * Star-banded widening strategies for the high-volume discovery topics,
 * appended AFTER the core strategies above (order matters — see
 * buildSearchStrategies).
 *
 * Measured Sep 2026: `topic:claude-skills` holds 8,766 repos and ~81% of
 * them (7,122) sit at 0–5 stars — invisible to recency-sorted paging
 * (`sort: 'updated'`, ≤3 pages of 100). One band per star range surfaces
 * that pool. `topic:claude-code-plugin` (the 'topic-claude-code' strategy)
 * is huge and generic; only its low-star band adds discoverable value, and
 * `topic:claude-plugins` (252 repos) is already fully covered by paging.
 *
 * Bands are repo-search-only by construction: GitHub CODE search silently
 * ignores the `stars:` qualifier (it returns 0 rows without an error), so a
 * `stars:` band on a 'code' strategy would be a silent no-op. Never add one.
 *
 * Budget: the search API allows 30 requests/minute authenticated; the band
 * strategies add only ~12 listing queries per day (≤3 pages each, most
 * bands need 1). Deep-fetch cost per candidate stays bounded by maxResults
 * and the Jev triage skip-list, exactly as for core strategies.
 */
export const STAR_BAND_STRATEGIES: SearchStrategy[] = [
  {
    name: 'topic-claude-skills-0-5',
    query: 'topic:claude-skills stars:0..5',
    type: 'repo' as const,
  },
  {
    name: 'topic-claude-skills-6-20',
    query: 'topic:claude-skills stars:6..20',
    type: 'repo' as const,
  },
  {
    name: 'topic-claude-skills-21-100',
    query: 'topic:claude-skills stars:21..100',
    type: 'repo' as const,
  },
  {
    name: 'topic-claude-skills-101-plus',
    query: 'topic:claude-skills stars:>100',
    type: 'repo' as const,
  },
  {
    name: 'topic-claude-code-0-10',
    query: 'topic:claude-code-plugin stars:0..10',
    type: 'repo' as const,
  },
];

/**
 * Assemble the full strategy list for a scan: core strategies first (they
 * fill the proven catalog), star-band strategies last — so the bands only
 * widen the pool with whatever remains of the maxResults budget instead of
 * competing with the established strategies. Pure and exported so tests can
 * assert on composition, ordering and query shape.
 */
export function buildSearchStrategies(): SearchStrategy[] {
  return [...SEARCH_STRATEGIES, ...STAR_BAND_STRATEGIES];
}

// Official manifest paths per Claude Code spec
// https://docs.anthropic.com/en/docs/claude-code/plugins
const MANIFEST_PATHS = {
  marketplace: '.claude-plugin/marketplace.json',
} as const;

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

/** Registry entries deep-refreshed per run (rotating slice; rest carry over). */
const REGISTRY_REFRESH_PER_DAY = 100;

/**
 * Ids from a Jev enrichment sidecar scored below the non-marketplace triage
 * threshold (probability the repo is genuinely a marketplace). Pure so the
 * policy stays unit-testable; the scanner consumes it via loadTriageSkip().
 */
export function triageSkipIds(
  entries: Record<string, { isMarketplace?: number } | undefined>,
  threshold = 0.3
): Set<string> {
  const ids = new Set<string>();
  for (const [id, entry] of Object.entries(entries ?? {})) {
    if (typeof entry?.isMarketplace === 'number' && entry.isMarketplace < threshold) {
      ids.add(id);
    }
  }
  return ids;
}

/**
 * Remove catalog entries the Jev sidecar triaged as likely non-marketplaces,
 * provided they have never produced a verified manifest — structural proof
 * (a real .claude-plugin/marketplace.json) always outranks a triage score.
 * Mutates the map; returns the retired ids so the caller can drop them from
 * the registry too. Searches skip re-adding them via the same skip-list;
 * re-scoring an entry above the threshold (enrich --force) re-admits it.
 */
export function retireTriagedEntries<T extends { id: string; manifest?: unknown }>(
  repoMap: Map<string, T>,
  skipIds: Set<string>
): string[] {
  const retired: string[] = [];
  for (const [id, entry] of repoMap) {
    if (skipIds.has(id) && !entry.manifest) {
      repoMap.delete(id);
      retired.push(id);
    }
  }
  return retired;
}

export interface RegistryRecord {
  id: string;
  fullName: string;
  firstSeen: string;
  lastSeen: string;
  discoverySource: string;
}

/**
 * Merge today's discovered marketplaces into the persistent registry.
 * The catalog is monotonic: a marketplace missing from today's search window
 * keeps its record (it will be re-fetched); only explicit 404 removals drop
 * entries. Existing records keep their original firstSeen/discoverySource.
 */
export function mergeRegistryRecords(
  registry: RegistryRecord[],
  discovered: Array<{ id: string; fullName: string; discoverySource: string }>,
  nowISO: string
): RegistryRecord[] {
  const byId = new Map(registry.map((r) => [r.id, r]));
  for (const d of discovered) {
    const existing = byId.get(d.id);
    byId.set(d.id, {
      id: d.id,
      fullName: d.fullName || existing?.fullName || '',
      firstSeen: existing?.firstSeen ?? nowISO,
      lastSeen: nowISO,
      discoverySource: existing?.discoverySource ?? d.discoverySource,
    });
  }
  return [...byId.values()].sort(
    (a, b) => a.firstSeen.localeCompare(b.firstSeen) || a.id.localeCompare(b.id)
  );
}

class MarketplaceScanner {
  private octokit: Octokit;
  private outputDir: string;
  private pluginsDir: string;
  private searchQuery: string;
  private maxResults: number;
  private useMultiStrategy: boolean;
  private pluginDiscovery: ReturnType<typeof createPluginDiscovery>;
  private triageSkip: Set<string> | null = null;
  private triageSkippedCount = 0;

  /**
   * Ids the Jev enrichment sidecar scored below the non-marketplace triage
   * threshold. Skipping these candidates saves their per-repo detail calls
   * (repos.get, manifest fetch, skills walk) — quota this scanner historically
   * burned on repos that only ever produced catalog noise. Known/verified
   * entries are never skipped: they are already in repoMap before searches run.
   * Absent sidecar (enrichment not active) means no skipping at all.
   */
  private loadTriageSkip(): Set<string> {
    if (!this.triageSkip) {
      this.triageSkip = new Set();
      try {
        const parsed = JSON.parse(
          fs.readFileSync(path.join(this.outputDir, 'jev-enrichment.json'), 'utf-8')
        );
        this.triageSkip = triageSkipIds(parsed?.entries ?? {});
        if (this.triageSkip.size > 0) {
          console.log(
            `🧯 Jev triage skip-list loaded: ${this.triageSkip.size} likely non-marketplaces`
          );
        }
      } catch {
        // Sidecar absent or unreadable — enrichment not active; no skipping.
      }
    }
    return this.triageSkip;
  }

  constructor() {
    // Initialize GitHub client
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
      userAgent: 'claude-marketplace-aggregator/1.0.0',
    });

    this.outputDir = path.join(process.cwd(), 'data', 'marketplaces');
    this.pluginsDir = path.join(process.cwd(), 'data', 'plugins');
    this.searchQuery = process.env.SEARCH_QUERY || '';
    this.maxResults = parseInt(process.env.SEARCH_RESULTS_LIMIT || '250');
    // Use multi-strategy by default unless a specific query is provided
    this.useMultiStrategy = !process.env.SEARCH_QUERY;

    // Initialize plugin discovery
    this.pluginDiscovery = createPluginDiscovery(this.octokit);

    // Ensure output directories exist
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    if (!fs.existsSync(this.pluginsDir)) {
      fs.mkdirSync(this.pluginsDir, { recursive: true });
    }
  }

  async scanMarketplaces(): Promise<Marketplace[]> {
    console.log('🔍 Starting marketplace scan...');
    console.log(`Max results: ${this.maxResults}`);
    console.log(
      `Strategy: ${this.useMultiStrategy ? 'Multi-strategy search' : `Single query: ${this.searchQuery}`}`
    );

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

      // Merge with the persistent registry: every marketplace ever discovered
      // stays in the catalog, and entries today's search window missed are
      // re-fetched. The catalog is self-healing and monotonically growing.
      const marketplaces = await this.mergeWithRegistry(repoMap);
      console.log(`\n🎉 Scan complete! Catalog size: ${marketplaces.length} marketplaces`);
      if (this.triageSkippedCount > 0) {
        console.log(
          `🧯 Skipped ${this.triageSkippedCount} Jev-triaged candidate(s) — detail calls saved`
        );
      }
      return marketplaces;
    } catch (error) {
      console.error('❌ Scan failed:', error);
      throw error;
    }
  }

  private registryPath(): string {
    return path.join(this.outputDir, 'registry.json');
  }

  private loadRegistry(): RegistryRecord[] {
    try {
      const raw = JSON.parse(fs.readFileSync(this.registryPath(), 'utf-8'));
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  }

  private saveRegistry(records: RegistryRecord[]): void {
    fs.writeFileSync(this.registryPath(), JSON.stringify(records, null, 2));
  }

  /**
   * Persist today's discoveries and re-fetch registry entries that today's
   * search window did not surface. Search windows reshuffle daily (results
   * are sorted by recency), so without the registry the catalog would
   * silently drop marketplaces from one day to the next.
   */
  private async mergeWithRegistry(repoMap: Map<string, Marketplace>): Promise<Marketplace[]> {
    const registry = this.loadRegistry();
    const known = new Set(repoMap.keys());
    const missing = registry.filter((r) => !known.has(r.id));
    if (missing.length > 0) {
      console.log(
        `\n📖 Registry: ${registry.length} known marketplaces — re-fetching ${missing.length} not surfaced today...`
      );
    }

    const removed: string[] = [];
    // Refresh a small rotating slice each day. Deep-refreshing every entry the
    // search window missed re-issued thousands of serial API calls, which
    // exhausted the token quota and froze the daily pipeline (Sep 2026).
    const dayIndex = Math.floor(Date.now() / 86_400_000);
    const start = missing.length > 0 ? (dayIndex * REGISTRY_REFRESH_PER_DAY) % missing.length : 0;
    const slice: RegistryRecord[] = [];
    for (let i = 0; i < Math.min(REGISTRY_REFRESH_PER_DAY, missing.length); i++) {
      slice.push(missing[(start + i) % missing.length]);
    }
    if (missing.length > slice.length) {
      console.log(
        `  ♻️ Refreshing ${slice.length}/${missing.length} stale entries today (rotating slice; rest retry on later runs)`
      );
    }

    for (const record of slice) {
      const [owner, repo] = record.fullName.split('/');
      try {
        const response = await this.octokit.repos.get({ owner, repo });
        const marketplace = await this.processRepository(response.data, record.discoverySource);
        if (marketplace) repoMap.set(marketplace.id, marketplace);
      } catch (error: any) {
        if (error.status === 404) {
          removed.push(record.id);
          console.log(`  🗑️ Repo deleted, removing from registry: ${record.fullName}`);
        } else {
          console.error(`  ⚠️ Could not refresh ${record.fullName}: ${error.message}`);
        }
      }
      await this.delay(150);
    }

    const nowISO = new Date().toISOString();
    const discovered = Array.from(repoMap.values())
      .filter((m) => !removed.includes(m.id))
      .map((m) => ({
        id: m.id,
        fullName: (m.url || '').replace(/^https?:\/\/github\.com\//, ''),
        discoverySource: m.discoverySource || 'unknown',
      }));

    let records = mergeRegistryRecords(registry, discovered, nowISO);
    if (removed.length > 0) {
      records = records.filter((r) => !removed.includes(r.id));
    }
    this.saveRegistry(records);
    if (records.length !== registry.length || removed.length > 0) {
      console.log(`📖 Registry now ${records.length} entries (was ${registry.length})`);
    }

    // Catalog completeness: entries the search window missed and today's
    // slice did not refresh still belong in the published catalog — carry
    // their last-known record so the catalog never shrinks on a weak search
    // day. These stay unverified until their rotating-slice turn.
    const previousCatalog = this.loadPreviousCatalog();
    let carried = 0;
    for (const record of missing) {
      if (removed.includes(record.id) || repoMap.has(record.id)) continue;
      const previous = previousCatalog.get(record.id);
      if (previous) {
        repoMap.set(record.id, previous);
        carried++;
      }
    }
    if (carried > 0) {
      console.log(
        `  📎 Carried ${carried} unrefreshed entries into the catalog from the previous scan`
      );
    }

    // Catalog self-cleaning: unverified entries Jev triaged as likely
    // non-marketplaces retire from the catalog and the registry, so catalog
    // growth stays quality-weighted instead of accumulating discovery noise.
    // Searches skip re-adding them via the same skip-list.
    const retired = retireTriagedEntries(repoMap, this.loadTriageSkip());
    if (retired.length > 0) {
      records = records.filter((r) => !retired.includes(r.id));
      this.saveRegistry(records);
      console.log(
        `🧯 Retired ${retired.length} unverified non-marketplace(s) from the catalog (Jev triage)`
      );
    }

    return Array.from(repoMap.values());
  }

  /** Last-known marketplace records from the previous scan (full raw first, slim processed as fallback). */
  private loadPreviousCatalog(): Map<string, Marketplace> {
    for (const file of ['raw.json', 'processed.json']) {
      try {
        const parsed = JSON.parse(fs.readFileSync(path.join(this.outputDir, file), 'utf-8'));
        if (Array.isArray(parsed)) {
          return new Map(
            parsed
              .filter((m: any) => m && m.id && m.url)
              .map((m: any) => [m.id as string, m as Marketplace])
          );
        }
      } catch {
        // Missing or corrupt file — fall through to the next candidate.
      }
    }
    return new Map();
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
    const strategies = buildSearchStrategies();
    console.log(`\n🔎 Running ${strategies.length} search strategies...`);

    for (const strategy of strategies) {
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

  private async runCodeSearch(
    repoMap: Map<string, Marketplace>,
    strategy: SearchStrategy
  ): Promise<void> {
    const startSize = repoMap.size;

    try {
      const searchResponse = await this.octokit.search.code({
        q: strategy.query,
        per_page: 100,
      });

      console.log(`   Found ${searchResponse.data.total_count} code matches`);

      const processedRepos = new Set<string>();
      const triageSkip = this.loadTriageSkip();
      for (const item of searchResponse.data.items) {
        const repoFullName = item.repository.full_name;
        if (processedRepos.has(repoFullName)) continue;
        processedRepos.add(repoFullName);

        if (repoMap.size >= this.maxResults) break;

        const repoId = String(item.repository.id);
        if (repoMap.has(repoId)) continue; // known entry — no detail calls needed
        if (triageSkip.has(repoId)) {
          this.triageSkippedCount++;
          continue;
        }

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
    const triageSkip = this.loadTriageSkip();

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

          const repoId = String(repo.id);
          if (repoMap.has(repoId)) continue;
          if (triageSkip.has(repoId)) {
            this.triageSkippedCount++;
            continue;
          }

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

  private async processRepository(
    repo: any,
    discoverySource?: string
  ): Promise<Marketplace | null> {
    try {
      // Use repo data directly if it has full details, otherwise fetch
      let repoData = repo;
      if (!repo.stargazers_count && repo.owner) {
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
    // Only check official marketplace manifest path per Claude Code spec
    try {
      const response = await this.octokit.repos.getContent({
        owner,
        repo,
        path: MANIFEST_PATHS.marketplace,
      });

      if ('content' in response.data) {
        const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
        return JSON.parse(content);
      }
    } catch {
      // No manifest found - repo is not a spec-compliant marketplace
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
                  const content = Buffer.from(skillMdResponse.data.content, 'base64').toString(
                    'utf-8'
                  );
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

  /**
   * Discover plugins from all marketplaces with manifests
   */
  async discoverPluginsFromMarketplaces(marketplaces: Marketplace[]): Promise<DiscoveredPlugin[]> {
    console.log('\n🔌 Discovering plugins from marketplaces...');

    const allPlugins: DiscoveredPlugin[] = [];
    const marketplacesWithManifests = marketplaces.filter((mp) => mp.manifest);

    console.log(`Found ${marketplacesWithManifests.length} marketplaces with manifests`);

    for (const marketplace of marketplacesWithManifests) {
      // Extract owner from URL
      const urlParts = marketplace.url.split('/');
      const owner = urlParts[urlParts.length - 2];
      const repo = urlParts[urlParts.length - 1];

      console.log(`\n📦 Processing marketplace: ${owner}/${repo}`);

      const marketplaceInfo: MarketplaceInfo = {
        owner,
        repo,
        id: marketplace.id,
        name: marketplace.name,
        url: marketplace.url,
        manifest: marketplace.manifest,
      };

      try {
        const plugins = await this.pluginDiscovery.discoverPlugins(marketplaceInfo);
        allPlugins.push(...plugins);
      } catch (error: any) {
        console.error(`  ❌ Failed to discover plugins: ${error.message}`);
      }

      // Rate limiting
      await this.delay(500);
    }

    return allPlugins;
  }

  /**
   * Save plugin discovery results to various output files
   */
  async savePluginResults(plugins: DiscoveredPlugin[]): Promise<void> {
    console.log('\n💾 Saving plugin discovery results...');

    const { valid, invalid } = this.pluginDiscovery.validatePlugins(plugins);

    // Save raw data (all plugins, valid and invalid)
    const rawDataPath = path.join(this.pluginsDir, 'raw.json');
    fs.writeFileSync(rawDataPath, JSON.stringify(plugins, null, 2));
    console.log(`  ✅ Saved raw data: ${rawDataPath}`);

    // Save valid plugins
    const validPluginsPath = path.join(this.pluginsDir, 'valid-plugins.json');
    fs.writeFileSync(validPluginsPath, JSON.stringify(valid, null, 2));
    console.log(`  ✅ Saved valid plugins: ${validPluginsPath}`);

    // Generate UI-ready plugin data
    const publicDataDir = path.join(process.cwd(), 'public', 'data');
    if (!fs.existsSync(publicDataDir)) {
      fs.mkdirSync(publicDataDir, { recursive: true });
    }

    // UI-ready format with metadata
    const uiPluginData = {
      plugins: valid.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        version: p.version,
        author: p.author,
        repository: p.repository,
        marketplaceId: p.marketplaceId,
        marketplaceName: p.marketplaceName,
      })),
      lastUpdated: new Date().toISOString(),
      totalCount: valid.length,
      source: 'plugin-discovery',
      summary: {
        totalDiscovered: plugins.length,
        validPlugins: valid.length,
        invalidPlugins: invalid.length,
        marketplaces: Array.from(new Set(plugins.map((p) => p.marketplaceName))),
      },
    };

    const pluginsPath = path.join(publicDataDir, 'plugins.json');
    fs.writeFileSync(pluginsPath, JSON.stringify(uiPluginData, null, 2));
    console.log(`  ✅ Saved UI data: ${pluginsPath}`);

    // Log summary
    console.log('\n📊 Plugin Discovery Summary:');
    console.log(`  Total discovered: ${plugins.length}`);
    console.log(`  Valid plugins: ${valid.length}`);
    console.log(`  Invalid plugins: ${invalid.length}`);

    if (invalid.length > 0) {
      console.log('\n⚠️ Invalid plugins:');
      for (const plugin of invalid.slice(0, 5)) {
        console.log(`  - ${plugin.name}: ${plugin.errors.join(', ')}`);
      }
      if (invalid.length > 5) {
        console.log(`  ... and ${invalid.length - 5} more`);
      }
    }
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

    // Discover plugins from marketplaces with manifests
    const plugins = await scanner.discoverPluginsFromMarketplaces(marketplaces);
    await scanner.savePluginResults(plugins);

    console.log('');
    console.log('🎉 Scan completed successfully!');
    console.log(`📊 Found ${marketplaces.length} marketplaces`);
    console.log(`🔌 Discovered ${plugins.length} plugins`);
  } catch (error) {
    console.error('❌ Scan failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
