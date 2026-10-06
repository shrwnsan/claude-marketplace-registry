#!/usr/bin/env ts-node

/**
 * Plugin Discovery Module
 *
 * Extracts plugins from marketplace manifests and verifies each plugin
 * has the required .claude-plugin/plugin.json manifest per Claude Code spec.
 */

import { Octokit } from '@octokit/rest';

// Official plugin manifest path per Claude Code spec
const PLUGIN_MANIFEST_PATH = '.claude-plugin/plugin.json' as const;

export interface DiscoveredPlugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  repository: string;
  marketplaceId: string;
  marketplaceName: string;
  manifestPath: string;
  isValid: boolean;
  errors: string[];
  /** Number of Claude Code mods (hook modules) this plugin ships, 0 when none. */
  modsCount?: number;
  manifest?: any;
}

/**
 * Number of mods a hooks.json declares: the length of its `modules` array,
 * else 0. Accepts raw file text; malformed JSON or a non-array `modules`
 * (legacy per-event hook configs never carry the key, though a file may mix
 * `modules` with legacy keys) counts as 0.
 */
export function modsCountFromHooksJson(raw: string | null | undefined): number {
  if (!raw) return 0;
  try {
    const hooks = JSON.parse(raw);
    return Array.isArray(hooks?.modules) ? hooks.modules.length : 0;
  } catch {
    return 0;
  }
}

export interface MarketplaceInfo {
  owner: string;
  repo: string;
  id: string;
  name: string;
  url: string;
  manifest: any;
}

export class PluginDiscovery {
  private octokit: Octokit;

  constructor(octokit: Octokit) {
    this.octokit = octokit;
  }

  /**
   * Extract plugins from a marketplace manifest
   */
  async discoverPlugins(marketplace: MarketplaceInfo): Promise<DiscoveredPlugin[]> {
    const plugins: DiscoveredPlugin[] = [];

    // Check if manifest has plugins array
    if (!marketplace.manifest?.plugins || !Array.isArray(marketplace.manifest.plugins)) {
      console.log(`  ⚠️ Marketplace ${marketplace.name} has no plugins array in manifest`);
      return plugins;
    }

    console.log(`  📦 Found ${marketplace.manifest.plugins.length} plugin entries in manifest`);

    for (const pluginEntry of marketplace.manifest.plugins) {
      const plugin = await this.processPluginEntry(pluginEntry, marketplace);
      if (plugin) {
        plugins.push(plugin);
      }
    }

    return plugins;
  }

  /**
   * Process a single plugin entry from marketplace manifest
   */
  private async processPluginEntry(
    pluginEntry: any,
    marketplace: MarketplaceInfo
  ): Promise<DiscoveredPlugin | null> {
    const errors: string[] = [];

    // Extract plugin location - can be path within repo or external repo
    const pluginPath = pluginEntry.path || pluginEntry.directory || '';
    const pluginRepo = pluginEntry.repository || pluginEntry.repo;
    const pluginName = pluginEntry.name || 'Unknown';

    // Generate unique ID
    const pluginId = pluginRepo
      ? pluginRepo.replace('/', '-')
      : pluginPath
        ? `${marketplace.id}-${pluginPath.replace(/\//g, '-')}`
        : `${marketplace.id}-${pluginName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')}`;

    try {
      const [owner, repo] = pluginRepo
        ? pluginRepo.split('/')
        : [marketplace.owner, marketplace.repo];
      // External-repo plugins live at that repo's root; internal ones at their path.
      const pluginDir = pluginRepo ? '' : pluginPath;

      const manifest = await this.fetchPluginManifest(owner, repo, pluginDir);

      if (manifest) {
        // Stamp the source manifest entry: scan-marketplaces persists these
        // objects in data/marketplaces/raw.json — the only scan output the
        // generate job receives (see scan.yml artifacts) — so the count must
        // ride the entry, not just the DiscoveredPlugin record.
        const modsCount = await this.fetchModsCount(owner, repo, pluginDir);
        pluginEntry.modsCount = modsCount;

        return {
          id: pluginId,
          name: manifest.name || pluginName,
          description: manifest.description || pluginEntry.description || '',
          version: manifest.version || '0.0.0',
          author: manifest.author || pluginEntry.author || marketplace.owner,
          repository: pluginRepo || marketplace.url,
          marketplaceId: marketplace.id,
          marketplaceName: marketplace.name,
          manifestPath: pluginPath ? `${pluginPath}/${PLUGIN_MANIFEST_PATH}` : PLUGIN_MANIFEST_PATH,
          isValid: true,
          errors: [],
          modsCount,
          manifest,
        };
      } else {
        errors.push('Plugin manifest not found at expected path');
      }
    } catch (error: any) {
      errors.push(`Failed to fetch plugin manifest: ${error.message}`);
    }

    // Return invalid plugin entry for tracking
    return {
      id: pluginId,
      name: pluginName,
      description: pluginEntry.description || '',
      version: pluginEntry.version || '0.0.0',
      author: pluginEntry.author || '',
      repository: pluginRepo || marketplace.url,
      marketplaceId: marketplace.id,
      marketplaceName: marketplace.name,
      manifestPath: pluginPath ? `${pluginPath}/${PLUGIN_MANIFEST_PATH}` : PLUGIN_MANIFEST_PATH,
      isValid: false,
      errors,
    };
  }

  /**
   * Fetch plugin manifest from GitHub
   */
  private async fetchPluginManifest(
    owner: string,
    repo: string,
    pluginPath: string
  ): Promise<any | null> {
    // Construct full path to plugin manifest
    const manifestPath = pluginPath
      ? `${pluginPath}/${PLUGIN_MANIFEST_PATH}`
      : PLUGIN_MANIFEST_PATH;

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
      // Manifest not found
    }

    return null;
  }

  /**
   * Count the Claude Code mods (hook modules) a plugin ships: a plugin is
   * mod-carrying when its hooks/hooks.json declares a non-empty `modules`
   * array. Absence or any fetch/parse failure counts as 0 — detection must
   * never invalidate an otherwise valid plugin.
   */
  private async fetchModsCount(owner: string, repo: string, pluginPath: string): Promise<number> {
    const hooksPath = pluginPath ? `${pluginPath}/hooks/hooks.json` : 'hooks/hooks.json';

    try {
      const response = await this.octokit.repos.getContent({ owner, repo, path: hooksPath });
      if ('content' in response.data) {
        const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
        return modsCountFromHooksJson(content);
      }
    } catch {
      // No hooks.json (or fetch failed) — not a mod carrier.
    }

    return 0;
  }

  /**
   * Validate all discovered plugins and return valid ones
   */
  validatePlugins(plugins: DiscoveredPlugin[]): {
    valid: DiscoveredPlugin[];
    invalid: DiscoveredPlugin[];
  } {
    const valid = plugins.filter((p) => p.isValid && p.errors.length === 0);
    const invalid = plugins.filter((p) => !p.isValid || p.errors.length > 0);

    return { valid, invalid };
  }
}

// Export singleton factory
export function createPluginDiscovery(octokit: Octokit): PluginDiscovery {
  return new PluginDiscovery(octokit);
}
