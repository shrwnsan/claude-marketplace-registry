# Plugin Discovery Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement plugin discovery that extracts plugins from spec-compliant marketplaces and generates `plugins.json`.

**Architecture:** Tighten manifest paths to official spec (`.claude-plugin/marketplace.json` only), extract plugins from marketplace manifests, verify each plugin has `.claude-plugin/plugin.json`, and generate validated plugin data.

**Tech Stack:** TypeScript, Octokit (GitHub API), fs (file system)

**Design Doc:** `docs/plans/archive/2026-02-16-plugin-discovery-design.md`

---

## Task 1: Tighten Manifest Paths in scan-marketplaces.ts

**Files:**
- Modify: `scripts/scan-marketplaces.ts:353-382`

**Step 1: Update the manifest paths constant**

Replace the loose manifest paths with official spec paths only.

```typescript
// FIND this code (lines 353-362):
const manifestPaths = [
  '.claude-plugin/marketplace.json',
  '.claude-plugin/plugin.json',
  '.claude/plugin.json',
  'marketplace.json',
  'claude-marketplace.json',
  'plugins/marketplace.json',
  'plugin.json',
];

// REPLACE with:
// Official manifest paths per Claude Code spec
// https://docs.anthropic.com/en/docs/claude-code/plugins
const MANIFEST_PATHS = {
  marketplace: '.claude-plugin/marketplace.json',
} as const;
```

**Step 2: Update fetchManifest method**

```typescript
// FIND this code (lines 353-382):
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

// REPLACE with:
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
```

**Step 3: Run scan to verify it works**

Run: `npm run scan -- --dry-run`
Expected: Script completes without errors (dry run mode)

**Step 4: Commit**

```bash
git add scripts/scan-marketplaces.ts
git commit -m "refactor(scan): tighten manifest paths to official spec

- Remove non-standard manifest path fallbacks
- Only check .claude-plugin/marketplace.json per Claude Code spec
- Improves data quality by ensuring spec compliance

Co-Authored-By: GLM <zai-org@users.noreply.github.com>"
```

---

## Task 2: Create Plugin Discovery Module

**Files:**
- Create: `scripts/plugin-discovery.ts`

**Step 1: Create the plugin discovery module**

```typescript
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
  manifest?: any;
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
      : `${marketplace.id}-${pluginPath.replace(/\//g, '-')}`;

    try {
      let manifest: any = null;

      if (pluginRepo) {
        // External repository - fetch from that repo
        const [owner, repo] = pluginRepo.split('/');
        manifest = await this.fetchPluginManifest(owner, repo, '');
      } else if (pluginPath) {
        // Internal path within marketplace repo
        manifest = await this.fetchPluginManifest(
          marketplace.owner,
          marketplace.repo,
          pluginPath
        );
      } else {
        // Plugin is the marketplace itself (single-plugin repo)
        manifest = await this.fetchPluginManifest(
          marketplace.owner,
          marketplace.repo,
          ''
        );
      }

      if (manifest) {
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
